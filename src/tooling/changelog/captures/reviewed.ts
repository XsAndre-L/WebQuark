import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { projectPath, requireCaptureContentConfig, type ChangelogConfig } from '../config/index.js';
import type { CaptureAdapter, CaptureJob } from '../adapters/capture.js';
import { readCaptureConfiguration } from './config.js';
import { captureFingerprint } from './fingerprint.js';
import { planCapturePublication, publicationSnapshot, publishCaptureRun, type StagedCapture } from './publication.js';
import { prepareCapturePreview, validateCapturePresentation, type CaptureStagedOutput } from '../notes/preview.js';
import { captureFormatForPath, captureReportSchemaVersion, captureToolRevision, inspectCaptureImage } from './image.js';

export async function stagedPresentation(results: readonly StagedCapture[]): Promise<CaptureStagedOutput[]> {
  return Promise.all(results.map(async result => {
    const bytes = await readFile(result.stagedPath);
    if (captureFormatForPath(result.stagedPath) !== captureFormatForPath(result.output)) throw new Error(`Staged output ${result.output} extension differs from its saved file.`);
    const image = await inspectCaptureImage(bytes, result.output);
    return { output: result.output, path: result.stagedPath, format: image.format, hash: image.sha256, width: image.width, height: image.height };
  }));
}

export function record(value: unknown): value is Record<string, any> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
export function assertScenarioGates(scenario: Record<string, any>, id: string): void {
  if (!record(scenario['evidence']) || !record(scenario['evidence']['image']) || !Array.isArray(scenario['pageErrors']) || scenario['pageErrors'].length || !Array.isArray(scenario['networkViolations']) || scenario['networkViolations'].length || !Array.isArray(scenario['unrecoveredFailedRequests']) || scenario['unrecoveredFailedRequests'].length) throw new Error(`Reviewed report ${id} has incomplete passed capture gates.`);
  const evidence = scenario['evidence'];
  if (typeof evidence['capturedURL'] !== 'string' || !Array.isArray(evidence['readiness']) || !evidence['readiness'].includes('fonts') || !evidence['readiness'].includes('animations')) throw new Error(`Reviewed report ${id} has no settled destination evidence.`);
  const url = new URL(evidence['capturedURL']);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.username || url.password || url.hash) throw new Error(`Reviewed report ${id} requires an owned loopback destination.`);
}

/** Publication never starts a browser, build, API or database. */
export async function publishReviewedCaptureRun<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>, runId: string): Promise<void> {
  requireCaptureContentConfig(config);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-f0-9]{8}$/.test(runId)) throw new Error('--publish-run requires a generated capture run ID, never a path.');
  const stagingRoot = await realpath(projectPath(config, config.captureStagingDirectory));
  const runDirectory = await realpath(resolve(stagingRoot, runId));
  if (pathKey(dirname(runDirectory)) !== pathKey(stagingRoot) || basename(runDirectory) !== runId || !(await stat(runDirectory)).isDirectory()) throw new Error('Reviewed run is not a direct managed staging directory.');
  const reportPath = await realpath(resolve(runDirectory, 'report.json'));
  if (pathKey(dirname(reportPath)) !== pathKey(runDirectory)) throw new Error('Reviewed report aliases another directory.');
  const report: unknown = JSON.parse(await readFile(reportPath, 'utf8'));
  if (!record(report) || report['schemaVersion'] !== captureReportSchemaVersion || report['captureToolRevision'] !== captureToolRevision) throw new Error('Capture report format revision changed. Re-stage this run with the current capture tool.');
  if (report['runId'] !== runId || report['status'] !== 'passed' || report['cleanup'] !== 'passed' || report['publication'] !== 'staged' || report['stageOnly'] !== true || !Array.isArray(report['scenarios']) || !report['scenarios'].length || !Array.isArray(report['stagedCaptures'])) throw new Error('Only a completed, passed, cleanup-verified staged capture report can be published.');
  if (!record(report['adapter']) || report['adapter']['id'] !== adapter.id || report['adapter']['revision'] !== adapter.revision) throw new Error('Capture adapter revision changed. Re-stage this run.');
  if (!record(report['environment']) || !Number.isFinite(Date.parse(report['environment']['expiresAt'])) || !Number.isFinite(Date.parse(report['startedAt'])) || !Number.isFinite(Date.parse(report['finishedAt'])) || Date.parse(report['finishedAt']) < Date.parse(report['startedAt']) || Date.parse(report['finishedAt']) > Date.parse(report['environment']['expiresAt'])) throw new Error('Reviewed report has inconsistent capture-window evidence.');
  const configuration = await readCaptureConfiguration(config, adapter);
  const projection = adapter.projection(configuration.entries);
  if (JSON.stringify(projection) !== JSON.stringify(report['captureProjection'])) throw new Error('Capture route, owner, viewport, profile or verified subject changed. Re-stage this run.');
  if (!Array.isArray(report['captureIds']) || report['captureIds'].length !== report['scenarios'].length || report['captureIds'].some((id: unknown) => typeof id !== 'string') || new Set(report['captureIds']).size !== report['captureIds'].length) throw new Error('Reviewed report has an invalid capture selection.');
  const fingerprint = await captureFingerprint(config, adapter, false, report['captureIds']);
  if (report['fingerprint'] !== fingerprint.sha256) throw new Error('Application, capture tool or seed inputs changed. Re-stage this run.');
  const ownedOutputs = configuration.entries.map(({ id, visualId, output, mode }) => ({ id, visualId, output, mode }));
  const results: StagedCapture[] = [], selected: E[] = [];
  const ids = new Set<string>();
  for (const scenario of report['scenarios']) {
    if (!record(scenario) || typeof scenario['id'] !== 'string' || ids.has(scenario['id'])) throw new Error('Reviewed report has invalid or duplicate capture IDs.');
    ids.add(scenario['id']);
    if (!report['captureIds'].includes(scenario['id'])) throw new Error('Reviewed capture does not belong to the saved selection.');
    const entry = configuration.entries.find(item => item.id === scenario['id']);
    const staged = report['stagedCaptures'].find((item: unknown) => record(item) && item['id'] === scenario['id']);
    if (!entry || !record(staged) || scenario['output'] !== entry.output || staged['output'] !== entry.output || scenario['mode'] !== entry.mode) throw new Error(`Reviewed report ${scenario['id']} does not match its current job.`);
    assertScenarioGates(scenario, entry.id);
    const path = await realpath(resolve(runDirectory, `${entry.id}.${entry.format}`));
    if (typeof staged['stagedPath'] !== 'string' || pathKey(await realpath(staged['stagedPath'])) !== pathKey(path) || pathKey(dirname(path)) !== pathKey(runDirectory) || !(await stat(path)).isFile()) throw new Error(`Reviewed ${entry.id} image is not its bound staged file.`);
    const image = (await stagedPresentation([{ output: entry.output, stagedPath: path }]))[0]!;
    const evidence = scenario['evidence'];
    if (scenario['format'] !== entry.format || staged['format'] !== entry.format || evidence['image']['format'] !== entry.format || image.format !== entry.format || image.hash !== staged['hash'] || image.width !== staged['width'] || image.height !== staged['height'] || image.hash !== evidence['image']['sha256'] || image.width !== evidence['width'] || image.height !== evidence['height']) throw new Error(`Reviewed ${entry.id} staged image format, hash or dimensions changed.`);
    selected.push(entry); results.push({ output: entry.output, stagedPath: path });
  }
  if (report['stagedCaptures'].length !== results.length) throw new Error('Reviewed report has unbound staged outputs.');
  await adapter.validateReviewedEvidence(config, report, selected);
  const selfTargetOutputs = selected.filter(entry => adapter.repositoryContent(entry)).map(entry => entry.output);
  const preview = await prepareCapturePreview(config, { ownedOutputs, selfTargetOutputs });
  const inputDependencies = selfTargetOutputs.length ? preview.assets : [];
  if (selfTargetOutputs.length && (!record(report['capturePreview']) || preview.contentHash !== report['capturePreview']['contentHash'] || JSON.stringify(preview.excludedVisualIds) !== JSON.stringify(report['capturePreview']['excludedVisualIds']))) throw new Error("What's new visible content, exclusions or asset inputs changed. Re-stage this page.");
  const plan = await planCapturePublication(config, configuration.path, configuration.bytes, configuration.entries, {
    captureProjection: projection, inputDependencies,
    currentProjection: async () => adapter.projection((await readCaptureConfiguration(config, adapter)).entries),
    validatePresentation: async images => validateCapturePresentation(config, { ownedOutputs, stagedOutputs: await stagedPresentation(images) }),
  });
  if (JSON.stringify(publicationSnapshot(plan)) !== JSON.stringify(report['publicationPlan'])) throw new Error('Release folders or canonical output paths/files changed since staging. Re-stage this run.');
  const assertCurrent = async () => {
    if ((await captureFingerprint(config, adapter, false, report['captureIds'])).sha256 !== report['fingerprint']) throw new Error('Capture inputs changed during reviewed publication.');
    if (selfTargetOutputs.length && (await prepareCapturePreview(config, { ownedOutputs, selfTargetOutputs })).contentHash !== preview.contentHash) throw new Error("What's new inputs changed during reviewed publication.");
    await adapter.validateReviewedEvidence(config, report, selected);
    for (const [index, image] of (await stagedPresentation(results)).entries()) {
      const bound = report['stagedCaptures'].find((item: unknown) => record(item) && item['id'] === selected[index]!.id);
      if (!record(bound) || image.format !== bound['format'] || image.hash !== bound['hash'] || image.width !== bound['width'] || image.height !== bound['height']) throw new Error('Reviewed bytes changed under the publication lock.');
    }
  };
  const changedPaths = await publishCaptureRun(plan, results, assertCurrent);
  report['publication'] = 'published'; report['changedPaths'] = changedPaths; report['publishedAt'] = new Date().toISOString();
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`[capture] Saved ${results.length} reviewed image(s). Report: ${reportPath}`);
}
function pathKey(path: string) { return process.platform === 'win32' ? path.toLowerCase() : path; }
