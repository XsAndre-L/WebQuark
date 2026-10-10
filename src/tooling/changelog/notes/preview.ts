import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { loadReleaseAssets, type AssetEvidence, type ReleaseAssetOptions } from './assets.js';
import { validateVisualCapture, validateVisualMetadata } from './location.js';
import { parseReleaseSummaries } from './summaries.js';
import { parseStableVersion } from '../versioning/stable-version.js';
import type { ReleaseEntry } from './types.js';
import { assertCaptureOutput, captureFormatForPath, normalizeCaptureFormat, type CaptureImageFormat } from '../shared/capture-format.js';
import { projectPath, requireCaptureContentConfig, requireMetadata, validateChangelogConfig, type ChangelogConfig } from '../config/index.js';

export type CaptureOwnedOutput = { id: string; visualId?: string; output: string; mode: 'custom' | 'page' };
export type CaptureStagedOutput = { output: string; path: string; format?: CaptureImageFormat; hash: string; width: number; height: number };
export type CapturePreviewOptions = { ownedOutputs: CaptureOwnedOutput[]; selfTargetOutputs?: string[] };
export type CapturePreview = { excludedVisualIds: string[]; contentHash: string; assets: AssetEvidence[]; projection: { releases: ReleaseEntry[] } };
const requests = new WeakMap<CapturePreview, CapturePreviewOptions>();
const assetOptions = new WeakMap<CapturePreview, ReleaseAssetOptions>();

/** Managed builds only: omissions must derive from an exact configured capture owner. */
export async function prepareCapturePreview(config: ChangelogConfig, options: CapturePreviewOptions): Promise<CapturePreview> {
  await validateChangelogConfig(config);
  const { visuals, owned } = await validateOwnership(config, options.ownedOutputs);
  const pendingOutputs = new Set<string>();
  for (const output of owned.keys()) {
    const path = resolve(projectPath(config, config.unreleasedDirectory), output);
    try { await stat(path); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      pendingOutputs.add(output);
    }
  }
  for (const output of options.selfTargetOutputs ?? []) if (!owned.has(output)) throw new Error(`Capture preview self target ${output} has no validated visual owner.`);
  const selfTargets = new Set(options.selfTargetOutputs ?? []);
  if (selfTargets.size) for (const output of pendingOutputs) if (!selfTargets.has(output)) throw new Error(`What's new capture input ${output} is missing. Publish its reviewed image in a separate run first.`);
  const selfIdentities = await Promise.all([...selfTargets].map((output) => assetIdentity(config, output)));
  const excludedVisualIds: string[] = [];
  for (const visual of visuals) {
    const sources = imageSources(visual);
    const matches = sources.some((src) => pendingOutputs.has(src) || selfTargets.has(src)) || (selfTargets.size > 0 && (await Promise.all(sources.map((src) => assetIdentity(config, src))))
      .some((identity) => identity && selfIdentities.some((target) => target && (identity.path === target.path || identity.file === target.file))));
    if (matches) excludedVisualIds.push(visual['id'] as string);
  }
  excludedVisualIds.sort();
  const releases = await releaseEntries(config);
  const assets: AssetEvidence[] = [];
  await loadReleaseAssets(config, releases, { excludedVisualIds: new Set(excludedVisualIds), pendingOutputs, assets });
  const projection = { releases };
  const uniqueAssets = [...new Map(assets.map((asset) => [asset.path, asset])).values()].sort((a, b) => a.path.localeCompare(b.path));
  const contentHash = digest(JSON.stringify({ projection, assets: uniqueAssets, excludedVisualIds }));
  const result = { excludedVisualIds, contentHash, assets: uniqueAssets, projection };
  requests.set(result, structuredClone(options));
  assetOptions.set(result, { excludedVisualIds: new Set(excludedVisualIds), pendingOutputs });
  return result;
}

export function capturePreviewAssetOptions(preview: CapturePreview): ReleaseAssetOptions {
  const options = assetOptions.get(preview);
  if (!options) throw new Error('Capture preview was not prepared in the managed process.');
  return options;
}

/** Recheck current presentation against reviewed staged images without changing feed or release files. */
export async function validateCapturePresentation(config: ChangelogConfig, options: { ownedOutputs: CaptureOwnedOutput[]; stagedOutputs: CaptureStagedOutput[] }): Promise<void> {
  requireCaptureContentConfig(config);
  await validateChangelogConfig(config);
  const { inspectCaptureImage } = await import('../captures/image.js');
  const { owned } = await validateOwnership(config, options.ownedOutputs);
  const stagedOutputs = new Map<string, Uint8Array>();
  const pendingOutputs = new Set<string>();
  for (const image of options.stagedOutputs) {
    if (!options.ownedOutputs.some((entry) => entry.output === image.output)) throw new Error(`Staged output ${image.output} has no configured capture owner.`);
    if (stagedOutputs.has(image.output)) throw new Error(`Duplicate staged output ${image.output}.`);
    const path = await realpath(image.path);
    const stagingRoot = await realpath(projectPath(config, config.captureStagingDirectory));
    const within = relative(stagingRoot, path);
    if (!within || isAbsolute(within) || within === '..' || within.startsWith(`..${sep}`) || !(await stat(path)).isFile()) throw new Error(`Staged output ${image.output} is outside managed capture staging.`);
    const bytes = await readFile(path);
    const inspected = await inspectCaptureImage(bytes, image.output);
    if (captureFormatForPath(path) !== inspected.format || (image.format !== undefined && image.format !== inspected.format) || inspected.sha256 !== image.hash || inspected.width !== image.width || inspected.height !== image.height) throw new Error(`Staged output ${image.output} format, hash or dimensions changed.`);
    stagedOutputs.set(image.output, bytes);
    if (owned.has(image.output)) pendingOutputs.add(image.output);
  }
  const releases = await releaseEntries(config);
  await loadReleaseAssets(config, releases, { stagedOutputs, pendingOutputs });
}

export async function revalidateCapturePreview(config: ChangelogConfig, preview: CapturePreview): Promise<CapturePreview> {
  const request = requests.get(preview);
  if (!request) throw new Error('Capture preview must originate from prepareCapturePreview in the managed process.');
  const current = await prepareCapturePreview(config, request);
  if (current.contentHash !== preview.contentHash) throw new Error('Capture preview content changed before frontend preparation.');
  return current;
}

async function validateOwnership(config: ChangelogConfig, supplied: CaptureOwnedOutput[]) {
  requireMetadata(config);
  const folder = projectPath(config, config.unreleasedDirectory);
  const visuals = await jsonArray(resolve(folder, 'visuals.json'));
  const custom = await jsonArray(resolve(folder, 'captures.json'));
  const visualById = new Map<string, Record<string, unknown>>();
  for (const visual of visuals) {
    if (typeof visual['id'] !== 'string' || visualById.has(visual['id'])) throw new Error('Capture preview requires unique visual IDs.');
    validateVisualCapture(visual, `visual ${visual['id']}`);
    visualById.set(visual['id'], visual);
  }
  const expected: CaptureOwnedOutput[] = [];
  const owned = new Map<string, string>();
  for (const visual of visuals) if (visual['capture'] !== undefined) {
    const output = outputSource(visual);
    assertCaptureOutput(output, normalizeCaptureFormat((visual['capture'] as Record<string, unknown>)['format'], `visual ${visual['id']}.capture`), `visual ${visual['id']}`);
    expected.push({ id: visual['id'] as string, visualId: visual['id'] as string, output, mode: 'page' });
    addOwner(owned, output, visual['id'] as string);
  }
  for (const capture of custom) {
    if (typeof capture['id'] !== 'string') throw new Error('Capture preview custom owner requires id.');
    const format = normalizeCaptureFormat(capture['format'], `capture ${capture['id']}`);
    const visualId = capture['visualId'];
    if (visualId !== undefined) {
      if (typeof visualId !== 'string' || !visualById.has(visualId)) throw new Error(`Capture preview ${capture['id']}: unknown linked visual.`);
      if (capture['output'] !== undefined || capture['location'] !== undefined || capture['subject'] !== undefined || capture['application'] !== undefined) throw new Error(`Capture preview ${capture['id']}: linked metadata/output must be owned once by the visual.`);
      const visual = visualById.get(visualId)!;
      if (visual['capture'] !== undefined) throw new Error(`Capture preview ${visualId}: configured as both custom and generic.`);
      const output = outputSource(visual);
      assertCaptureOutput(output, format, `capture ${capture['id']}`);
      expected.push({ id: capture['id'], visualId, output, mode: 'custom' }); addOwner(owned, output, visualId);
    } else {
      if (typeof capture['output'] !== 'string') throw new Error(`Capture preview ${capture['id']}: standalone owner requires output.`);
      assertCaptureOutput(capture['output'], format, `capture ${capture['id']}`);
      validateVisualMetadata(capture, `Capture preview ${capture['id']}`, config.metadata.applications);
      expected.push({ id: capture['id'], output: capture['output'], mode: 'custom' });
    }
  }
  const ids = new Set<string>(); const outputs = new Set<string>();
  const beforeSources = new Set(visuals.flatMap((visual) => {
    const before = visual['before']; return before && typeof before === 'object' && typeof (before as Record<string, unknown>)['src'] === 'string' ? [(before as { src: string }).src] : [];
  }));
  for (const entry of expected) {
    if (ids.has(entry.id) || outputs.has(entry.output)) throw new Error(`Capture preview has duplicate output owner ${entry.id}/${entry.output}.`);
    ids.add(entry.id); outputs.add(entry.output);
    if (beforeSources.has(entry.output)) throw new Error(`Capture preview ${entry.id}: output is a protected Before image.`);
  }
  const normalize = (entries: CaptureOwnedOutput[]) => entries.map((entry) => ({ id: entry.id, ...(entry.visualId ? { visualId: entry.visualId } : {}), output: entry.output, mode: entry.mode })).sort((a, b) => a.id.localeCompare(b.id));
  if (JSON.stringify(normalize(expected)) !== JSON.stringify(normalize(supplied))) throw new Error('Capture preview ownership does not match all current configured jobs.');
  return { visuals, owned };
}
async function releaseEntries(config: ChangelogConfig): Promise<ReleaseEntry[]> {
  const manifest = JSON.parse(await readFile(projectPath(config, config.sourceManifest), 'utf8'));
  return parseReleaseSummaries(await readFile(projectPath(config, config.changelog), 'utf8'), parseStableVersion(manifest.version).value, true);
}
async function jsonArray(path: string): Promise<Record<string, unknown>[]> {
  const value: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (!Array.isArray(value) || value.some((entry) => !entry || typeof entry !== 'object' || Array.isArray(entry))) throw new Error(`${path}: expected an array of objects.`);
  return value as Record<string, unknown>[];
}
function outputSource(visual: Record<string, unknown>): string {
  const image = visual['kind'] === 'image' ? visual['image'] : visual['after'];
  const src = image && typeof image === 'object' && !Array.isArray(image) ? (image as Record<string, unknown>)['src'] : undefined;
  if (typeof src !== 'string') throw new Error(`Visual ${visual['id']}: missing capture image/After source.`);
  return src;
}
function imageSources(visual: Record<string, unknown>): string[] {
  return ['image', 'before', 'after'].flatMap((key) => {
    const image = visual[key]; return image && typeof image === 'object' && typeof (image as Record<string, unknown>)['src'] === 'string' ? [(image as { src: string }).src] : [];
  });
}
function addOwner(owners: Map<string, string>, output: string, id: string) { if (owners.has(output)) throw new Error(`Capture preview output ${output} has multiple owners.`); owners.set(output, id); }
function digest(content: string | Uint8Array): string { return createHash('sha256').update(content).digest('hex'); }

async function assetIdentity(config: ChangelogConfig, source: string): Promise<{ path: string; file: string } | undefined> {
  // Final release-asset validation still enforces images confinement and file type.
  const path = await realpath(resolve(projectPath(config, config.unreleasedDirectory), source)).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
  if (!path) return undefined;
  const identity = await stat(path);
  return { path, file: `${identity.dev}:${identity.ino}` };
}
