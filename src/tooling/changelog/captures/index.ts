import { createHash } from 'node:crypto';
import { acquireFileLock } from '../shared/release-content-lock.js';
import type { ChangelogConfig } from '../config/index.js';
import type { CaptureAdapter, CaptureJob } from '../adapters/capture.js';
import type { StageCaptureOptions, CaptureResult } from './run.js';
import type { PublicationPlan, StagedCapture } from './publication.js';
import { captureCommandHelp, parseArguments } from './config.js';

export type * from '../adapters/capture.js';
export type { StageCaptureOptions, CaptureResult } from './run.js';
export type { PublicationPlan, StagedCapture } from './publication.js';
export type { CaptureWatchInputs } from './fingerprint.js';
export type { BuiltFrontend } from './watch.js';
export { captureCommandHelp, normalizeCaptureFocus, parseArguments, readCaptureConfiguration, type CaptureFocus, type CaptureFocusContext } from './config.js';
export { bindCaptureDestination, assertCaptureDestination, type CaptureDestination, type CapturePage } from './destination.js';
export { captureReportSchemaVersion, captureToolRevision } from './revision.js';
export { relevantWatchChange, requiresCaptureRestart } from './fingerprint.js';
export { captureWatch, watchCaptureInputs } from './watch.js';

/** Codec dependencies are loaded only when explicitly requested. */
export async function encodeCaptureImage(png: Buffer, outputPath: string) { return (await import('./image.js')).encodeCaptureImage(png, outputPath); }
export async function inspectCaptureImage(bytes: Buffer, path: string) { return (await import('./image.js')).inspectCaptureImage(bytes, path); }
export async function stagedPresentation(results: readonly StagedCapture[]) { return (await import('./reviewed.js')).stagedPresentation(results); }
export async function canonicalPath(path: string) { return (await import('./publication.js')).canonicalPath(path); }
export async function planCapturePublication(...args: Parameters<typeof import('./publication.js').planCapturePublication>) { return (await import('./publication.js')).planCapturePublication(...args); }
export async function publishCaptureRun(plan: PublicationPlan, results: readonly StagedCapture[], assertCurrent: () => Promise<void>) { return (await import('./publication.js')).publishCaptureRun(plan, results, assertCurrent); }
export async function assertDependencyPublication(...args: Parameters<typeof import('./publication.js').assertDependencyPublication>) { return (await import('./publication.js')).assertDependencyPublication(...args); }
export function publicationSnapshot(plan: PublicationPlan) {
  return { unreleasedPath: plan.unreleasedPath, unreleasedIdentity: plan.unreleasedIdentity, imagesPath: plan.imagesPath, imagesIdentity: plan.imagesIdentity,
    outputs: plan.outputs.map(output => ({ output: output.output, path: output.path, identity: output.identity,
      originalHash: output.original ? createHash('sha256').update(output.original).digest('hex') : undefined })) };
}
export async function captureFingerprint<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>, buildOnly = false, selected?: readonly string[]) { return (await import('./fingerprint.js')).captureFingerprint(config, adapter, buildOnly, selected); }
export async function stageCaptures<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>, options: Omit<StageCaptureOptions, 'stageOnly'> = {}): Promise<CaptureResult> {
  const unlock = await acquireFileLock(config.root, 'whats-new-capture', config.lockNamespace);
  try { return await (await import('./run.js')).captureRun(config, adapter, { ...options, stageOnly: true }); }
  finally { await unlock(); }
}
export async function publishReviewedRun<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>, runId: string): Promise<void> {
  const unlock = await acquireFileLock(config.root, 'whats-new-capture', config.lockNamespace);
  try { await (await import('./reviewed.js')).publishReviewedCaptureRun(config, adapter, runId); }
  finally { await unlock(); }
}
export async function runCaptureCommand<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>, args: string[] = process.argv.slice(2)): Promise<void> {
  const options = parseArguments(args);
  if (options.help) { console.log(captureCommandHelp(args[0])); return; }
  const unlock = await acquireFileLock(config.root, 'whats-new-capture', config.lockNamespace);
  const controller = new AbortController(), stop = () => controller.abort();
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  try {
    if (options.publishRun) { await (await import('./reviewed.js')).publishReviewedCaptureRun(config, adapter, options.publishRun); return; }
    const { captureRun } = await import('./run.js');
    const run = async (selected: string[], signal: AbortSignal, cached?: unknown) => {
      const configuration = await adapter.readConfiguration(config);
      const hasGeneric = configuration.entries.some(entry => entry.mode === 'page' && (!selected.length || selected.includes(entry.id)));
      return captureRun(config, adapter, { selected, signal, cached, stageOnly: options.stageOnly || (options.watch && hasGeneric) });
    };
    if (options.watch) await (await import('./watch.js')).captureWatch(config, adapter, options.selected, controller.signal, run);
    else await run(options.selected, controller.signal);
  } finally { process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); await unlock(); }
}
