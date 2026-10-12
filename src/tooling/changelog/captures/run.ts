import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { projectPath, requireCaptureContentConfig, type ChangelogConfig } from '../config/index.js';
import type { CaptureAdapter, CaptureJob, OwnedCaptureRuntime } from '../adapters/capture.js';
import { prepareCapturePreview, validateCapturePresentation } from '../notes/preview.js';
import { generateWhatsNew } from '../notes/feed.js';
import { readCaptureConfiguration } from './config.js';
import { captureFingerprint } from './fingerprint.js';
import { assertDependencyPublication, planCapturePublication, publicationSnapshot, publishCaptureRun, type StagedCapture } from './publication.js';
import { stagedPresentation, assertScenarioGates } from './reviewed.js';
import { captureReportSchemaVersion, captureToolRevision, inspectCaptureImage } from './image.js';

export type StageCaptureOptions = { selected?: readonly string[]; signal?: AbortSignal; cached?: unknown; stageOnly?: boolean };
export type CaptureResult = { empty: boolean; cached?: unknown; runId?: string; reportPath?: string };

/** Shared lifecycle: all jobs stage, owned cleanup passes, then publication may begin. */
export async function captureRun<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>, options: StageCaptureOptions = {}): Promise<CaptureResult> {
  requireCaptureContentConfig(config);
  const configuration = await readCaptureConfiguration(config, adapter);
  if (!configuration.entries.length) { console.log('[capture] No captures configured in Unreleased.'); return { empty: true, cached: options.cached }; }
  const selected = options.selected ?? [];
  const entries = selected.length ? configuration.entries.filter(entry => selected.includes(entry.id)) : configuration.entries;
  for (const id of selected) if (!entries.some(entry => entry.id === id)) throw new Error(`Capture ID is not configured: ${id}`);
  if (new Set(selected).size !== selected.length) throw new Error('Capture selection contains duplicate IDs.');
  const stageOnly = options.stageOnly ?? true;
  if (entries.some(entry => entry.mode === 'page') && !stageOnly) throw new Error('Generic page captures require capture stage (or --stage-only). Review the staged image/report, then save that exact run with capture publish <run-id> (or --publish-run <run-id>).');
  for (const entry of entries) adapter.validateEntry?.(entry);
  const ownedOutputs = configuration.entries.map(({ id, visualId, output, mode }) => ({ id, visualId, output, mode }));
  const selfTargetOutputs = entries.filter(entry => adapter.repositoryContent(entry)).map(entry => entry.output);
  const previewRequest = { ownedOutputs, selfTargetOutputs };
  const capturePreview = await prepareCapturePreview(config, previewRequest);
  const inputDependencies = selfTargetOutputs.length ? capturePreview.assets : [];
  await assertDependencyPublication(config, entries, inputDependencies);
  const projection = adapter.projection(configuration.entries);
  const plan = await planCapturePublication(config, configuration.path, configuration.bytes, configuration.entries, {
    captureProjection: projection, inputDependencies,
    currentProjection: async () => adapter.projection((await readCaptureConfiguration(config, adapter)).entries),
    validatePresentation: async results => validateCapturePresentation(config, { ownedOutputs, stagedOutputs: await stagedPresentation(results) }),
  });
  const captureIds = entries.map(entry => entry.id);
  const fingerprint = await captureFingerprint(config, adapter, false, captureIds);
  const buildFingerprint = await captureFingerprint(config, adapter, true);
  const effectiveBuildFingerprint = createHash('sha256').update(`${buildFingerprint.sha256}\0${capturePreview.contentHash}`).digest('hex');
  const runId = `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  const runDirectory = resolve(projectPath(config, config.captureStagingDirectory), runId);
  await mkdir(runDirectory, { recursive: true });
  const report: Record<string, unknown> = {
    runId, startedAt: new Date().toISOString(), status: 'running', fingerprint: fingerprint.sha256,
    buildFingerprint: effectiveBuildFingerprint, webquark: fingerprint.webquark, defaults: adapter.defaults, stageOnly,
    adapter: { id: adapter.id, revision: adapter.revision },
    sourceApplicationVersion: JSON.parse(await readFile(projectPath(config, config.sourceManifest), 'utf8')).version,
    schemaVersion: captureReportSchemaVersion, captureToolRevision, captureProjection: projection, captureIds,
    previewRequest, capturePreview, publicationPlan: publicationSnapshot(plan), scenarios: [],
  };
  const reportPath = resolve(runDirectory, 'report.json');
  const controller = new AbortController();
  const signal = options.signal;
  const stop = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', stop, { once: true });
  if (signal?.aborted) stop();
  let runtime: OwnedCaptureRuntime<E> | undefined;
  let preparationAttempted = false, closed = false;
  let expiry: ReturnType<typeof setTimeout> | undefined;
  const assertCurrent = async () => {
    controller.signal.throwIfAborted();
    if ((await captureFingerprint(config, adapter, false, captureIds)).sha256 !== fingerprint.sha256) throw new Error('Capture inputs changed during this run; staged images were discarded.');
    if (selfTargetOutputs.length && (await prepareCapturePreview(config, previewRequest)).contentHash !== capturePreview.contentHash) throw new Error("What's new visible content/assets changed during capture; re-stage this page.");
    if (runtime && !closed) await runtime.verifyCurrent();
  };
  const cleanup = async () => {
    if (closed || !runtime) return;
    await runtime.close(); closed = true; clearTimeout(expiry);
    report['cleanup'] = 'passed';
  };
  try {
    preparationAttempted = true;
    runtime = await adapter.prepare({ config, entries, signal: controller.signal, runDirectory, buildFingerprint: effectiveBuildFingerprint,
      capturePreview, cached: options.cached, stageOnly, report, assertCurrent,
      generatePreviewFeed: () => generateWhatsNew(config, { includeUnreleased: true, capturePreview }) });
    if (!Number.isFinite(Date.parse(runtime.expiresAt)) || Date.parse(runtime.expiresAt) <= Date.now()) throw new Error('Owned capture runtime has no current bounded capture window.');
    report['environment'] = { expiresAt: runtime.expiresAt };
    expiry = setTimeout(() => controller.abort(new Error('The owned capture window expired.')), Math.max(1, Date.parse(runtime.expiresAt) - Date.now()));
    const results: (StagedCapture & { id: string; format: string; hash: string; width: number; height: number })[] = [];
    for (const entry of entries) {
      await assertCurrent(); console.log(`[capture] ${entry.id}`);
      const scenarioReport: Record<string, unknown> = { id: entry.id, mode: entry.mode, visualId: entry.visualId, output: entry.output, format: entry.format, viewport: entry.viewport };
      (report['scenarios'] as unknown[]).push(scenarioReport);
      const outputPath = resolve(runDirectory, `${entry.id}.${entry.format}`);
      await runtime.capture(entry, outputPath, scenarioReport);
      assertScenarioGates(scenarioReport, entry.id);
      const image = await inspectCaptureImage(await readFile(outputPath), entry.output);
      const evidence = scenarioReport['evidence'] as { image?: { format: string; sha256: string }; width?: number; height?: number };
      if (image.format !== entry.format || evidence.image?.format !== image.format || evidence.image.sha256 !== image.sha256 || evidence.width !== image.width || evidence.height !== image.height) throw new Error(`Capture ${entry.id} has inconsistent screenshot evidence.`);
      results.push({ output: entry.output, stagedPath: outputPath, id: entry.id, format: image.format, hash: image.sha256, width: image.width, height: image.height });
    }
    await assertCurrent(); report['stagedCaptures'] = results;
    await cleanup(); report['finishedAt'] = new Date().toISOString();
    await adapter.validateReviewedEvidence(config, report, entries);
    report['changedPaths'] = stageOnly ? [] : await publishCaptureRun(plan, results, assertCurrent);
    report['publication'] = stageOnly ? 'staged' : 'published'; report['status'] = 'passed';
    for (const scenario of report['scenarios'] as Record<string, unknown>[]) if (scenario['framingSuggestion']) (scenario['framingSuggestion'] as Record<string, unknown>)['source'] = stageOnly ? 'staged' : 'published';
    console.log(`[capture] ${stageOnly ? 'Staged' : 'Saved'} ${results.length} image(s). Report: ${reportPath}`);
    return { empty: false, cached: runtime.cached, runId, reportPath };
  } catch (error) {
    report['status'] = 'failed'; report['error'] = error instanceof Error ? error.message : String(error);
    if (!runtime && preparationAttempted) {
      if (report['cleanup'] === undefined) report['cleanup'] = 'unknown';
      await adapter.preparationFailure?.(runDirectory, report);
    }
    console.error(`[capture] Failed. Report: ${reportPath}`); throw error;
  } finally {
    signal?.removeEventListener('abort', stop);
    try { await cleanup(); }
    catch (error) { report['status'] = 'failed'; report['cleanup'] = 'failed'; report['cleanupError'] = error instanceof Error ? error.message : String(error); throw error; }
    finally { clearTimeout(expiry); report['finishedAt'] = new Date().toISOString(); await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`); }
  }
}
