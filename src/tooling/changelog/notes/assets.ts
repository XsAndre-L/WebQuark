import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { categoryNames, imageFramingAnchors, type ImageCrop, type ImageReference, type ReleaseEntry, type ReleaseSummaryAnchor } from './types.js';
import { resolveVisualMetadata, validateVisualMetadata, validateVisualCapture, type ResolvedVisualMetadata } from './location.js';
import { projectPath, releaseDirectory, validateChangelogConfig, type ChangelogConfig } from '../config/index.js';

export type AssetEvidence = { path: string; hash: string };
export type ReleaseAssetOptions = {
  excludedVisualIds?: ReadonlySet<string>;
  pendingOutputs?: ReadonlySet<string>;
  stagedOutputs?: ReadonlyMap<string, Uint8Array>;
  assets?: AssetEvidence[];
};

/** Validate every comparison and image before output is replaced. */
export async function loadReleaseAssets(
  config: ChangelogConfig,
  releases: ReleaseEntry[],
  options: ReleaseAssetOptions = {},
): Promise<Map<string, Uint8Array>> {
  const imageFiles = new Map<string, Uint8Array>();
  await validateChangelogConfig(config);
  const canonicalRoot = await realpath(config.root);
  for (const release of releases) {
    const folderName = release.unreleased ? 'unreleased' : `v${release.version}`;
    const folder = release.unreleased ? projectPath(config, config.unreleasedDirectory) : releaseDirectory(config, release.version);
    const folderReal = await realpath(folder).catch(() => undefined);
    const expectedFolder = resolve(canonicalRoot, relative(config.root, folder));
    const pathKey = (path: string) => process.platform === 'win32' ? path.toLowerCase() : path;
    if (!folderReal || pathKey(folderReal) !== pathKey(expectedFolder) || !contained(canonicalRoot, folderReal) || !(await stat(folderReal)).isDirectory()) {
      throw new Error(`${config.changelog}: ${folderName} requires a matching ${relative(config.root, folder).replaceAll('\\', '/')}/ release folder.`);
    }
    const configuration = resolve(folder, 'visuals.json');
    const source = await readFile(configuration, 'utf8').catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        return undefined;
      }
      throw error;
    });
    if (source === undefined) {
      continue;
    }
    let entries: unknown;
    try {
      entries = JSON.parse(source);
    } catch {
      throw new Error(`${configuration}: expected valid JSON containing an array of visuals.`);
    }
    if (!Array.isArray(entries)) {
      throw new Error(`${configuration}: expected an array of visuals (use [] for none).`);
    }
    const ids = new Set<string>();
    const snapshot = release.unreleased ? undefined : await readFile(resolve(folder, 'locations.json'), 'utf8').catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    const locations = snapshot ? parseLocationsSnapshot(snapshot, configuration) : undefined;
    for (const [index, entry] of entries.entries()) {
      const location = `${configuration}[${index}]`;
      const record = object(entry, location);
      validateVisualCapture(record, location);
      const id = requiredText(record['id'], `${location}.id`);
      if (ids.has(id)) {
        throw new Error(`${location}.id: duplicate visual ID "${id}" within this release.`);
      }
      ids.add(id);
      const title = requiredText(record['title'], `${location}.title`);
      const description = record['description'];
      if (description !== undefined && typeof description !== 'string') {
        throw new Error(`${location}.description: expected text.`);
      }
      const aspectRatio = record['aspectRatio'];
      if (
        aspectRatio !== undefined &&
        (typeof aspectRatio !== 'number' || !Number.isFinite(aspectRatio) || aspectRatio <= 0)
      ) {
        throw new Error(`${location}.aspectRatio: expected a positive finite width/height ratio.`);
      }
      const afterSummary = resolveSummaryAnchor(record['afterSummary'], `${location}.afterSummary`, release);
      let metadata: ResolvedVisualMetadata | undefined;
      if (release.unreleased) {
        metadata = await resolveVisualMetadata(config, record, location);
      } else if (locations) {
        metadata = locations[id];
        if (!metadata) throw new Error(`${location}: release locations.json is missing visual ${id}.`);
        const authored = validateVisualMetadata(record, location, config.metadata?.applications ?? [metadata.location.application]);
        if (authored.location.application !== metadata.location.application || authored.location.route !== metadata.location.route || authored.subject.kind !== metadata.subject.kind) {
          throw new Error(`${location}: historical location snapshot conflicts with the visual metadata.`);
        }
      } else if (record['location'] !== undefined || record['subject'] !== undefined) {
        const application = object(record['location'], `${location}.location`)['application'];
        validateVisualMetadata(record, location, config.metadata?.applications ?? (typeof application === 'string' ? [application] : []));
      }
      const details = {
        id,
        title,
        ...(description !== undefined ? { description } : {}),
        ...(aspectRatio !== undefined ? { aspectRatio: aspectRatio as number } : {}),
        ...(afterSummary ? { afterSummary } : {}),
        ...(metadata ?? {}),
      };
      const files = new Map<string, Uint8Array>();
      const evidence: AssetEvidence[] = [];
      const excluded = release.unreleased && options.excludedVisualIds?.has(id);
      const pending = release.unreleased ? options.pendingOutputs : undefined;
      const staged = release.unreleased ? options.stagedOutputs : undefined;
      const kind = record['kind'];
      if (kind === 'image') {
        if ('before' in record || 'after' in record) {
          throw new Error(`${location}: an image visual must contain image only, without before or after.`);
        }
        const image = await resolveImage(record['image'], `${location}.image`, folderReal, files, pending, staged, evidence, relative(config.root, folderReal).replaceAll('\\', '/'));
        if (!excluded) release.visuals.push({ ...details, kind, image });
      } else if (kind === undefined || kind === 'comparison') {
        if ('image' in record) {
          throw new Error(`${location}.image: standalone images require kind "image" and cannot contain before or after.`);
        }
        const before = await resolveImage(record['before'], `${location}.before`, folderReal, files, undefined, undefined, evidence, relative(config.root, folderReal).replaceAll('\\', '/'));
        const after = await resolveImage(record['after'], `${location}.after`, folderReal, files, pending, staged, evidence, relative(config.root, folderReal).replaceAll('\\', '/'));
        if (!excluded) release.visuals.push({ ...details, ...(kind ? { kind } : {}), before, after });
      } else {
        throw new Error(`${location}.kind: expected "image", "comparison", or omitted for a legacy comparison.`);
      }
      if (!excluded) {
        for (const [path, content] of files) imageFiles.set(path, content);
        options.assets?.push(...evidence);
      }
    }
  }
  return imageFiles;
}

function resolveSummaryAnchor(
  value: unknown,
  location: string,
  release: ReleaseEntry,
): ReleaseSummaryAnchor | undefined {
  if (value === undefined) {
    return undefined;
  }
  const anchor = object(value, location);
  const category = categoryNames.find((name) => name === anchor['category']);
  if (!category) {
    throw new Error(`${location}.category: expected Added, Changed, Fixed or Removed.`);
  }
  const summary = requiredText(anchor['summary'], `${location}.summary`);
  const matches = release.categories
    .filter((entry) => entry.name === category)
    .flatMap((entry) => entry.summaries)
    .filter((entry) => entry === summary).length;
  if (matches !== 1) {
    throw new Error(`${location}.summary: expected exactly one matching ${category} bullet in this release's CHANGELOG.md section; found ${matches}. Copy the complete bullet text with wrapped lines joined by spaces.`);
  }
  return { category, summary };
}

async function resolveImage(
  value: unknown,
  location: string,
  folder: string,
  files: Map<string, Uint8Array>,
  pendingOutputs?: ReadonlySet<string>,
  stagedOutputs?: ReadonlyMap<string, Uint8Array>,
  evidence?: AssetEvidence[],
  sourceFolder?: string,
): Promise<ImageReference> {
  const image = object(value, location);
  const src = requiredText(image['src'], `${location}.src`);
  const alt = requiredText(image['alt'], `${location}.alt`);
  const crop = resolveImageCrop(image, location);
  const parts = src.split('/');
  const validPath =
    parts[0] === 'images' &&
    parts.length >= 2 &&
    parts.every((part) => part && part !== '.' && part !== '..') &&
    !/[\\\u0000:?#]/.test(src);
  if (!validPath || !/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(src)) {
    throw new Error(`${location}.src: "${src}" must reference an image inside this release's images/ folder using a relative path.`);
  }
  const imagesRoot = await realpath(resolve(folder, 'images')).catch(() => undefined);
  const imagePath = await realpath(resolve(folder, src)).catch(() => undefined);
  // Only a validated owned After/image binding can be pending, never a Before image.
  if (!imagePath && pendingOutputs?.has(src)) {
    if (!imagesRoot || !contained(folder, imagesRoot) || src.split('/').length !== 2) throw new Error(`${location}.src: pending output must be confined to the release images folder.`);
    return { src, alt, ...(crop ? { crop } : {}) };
  }
  if (
    !imagesRoot ||
    !contained(folder, imagesRoot) ||
    !imagePath ||
    !contained(imagesRoot, imagePath) ||
    !(await stat(imagePath)).isFile()
  ) {
    throw new Error(`${location}.src: "${src}" must exist as a file confined to this release's images/ folder (including symlink targets).`);
  }
  const content = stagedOutputs?.get(src) ?? await readFile(imagePath);
  const outputPath = `images/${contentHash(content)}${extname(src).toLowerCase()}`;
  files.set(outputPath, content);
  if (evidence && sourceFolder) evidence.push({ path: `${sourceFolder}/${src}`, hash: createHash('sha256').update(content).digest('hex') });
  return { src: outputPath, alt, ...(crop ? { crop } : {}) };
}

function parseLocationsSnapshot(source: string, context: string): Record<string, ResolvedVisualMetadata> {
  const snapshot = object(JSON.parse(source), `${context} locations.json`);
  if (snapshot['schemaVersion'] !== 1) throw new Error(`${context}: unsupported locations.json schemaVersion.`);
  const visuals = object(snapshot['visuals'], `${context} locations.json.visuals`);
  for (const [id, value] of Object.entries(visuals)) {
    const metadata = object(value, `${context} locations.json.${id}`);
    const location = object(metadata['location'], `${context} locations.json.${id}.location`);
    requiredText(location['pageLabel'], `${context} locations.json.${id}.pageLabel`);
    for (const name of ['navigation', 'access']) if (!Array.isArray(location[name]) || (location[name] as unknown[]).some((label) => typeof label !== 'string' || !label.trim())) throw new Error(`${context}: invalid historical ${name}.`);
    const guidance = object(metadata['guidance'], `${context} locations.json.${id}.guidance`);
    requiredText(guidance['text'], `${context} locations.json.${id}.guidance.text`);
    requiredText(guidance['sourceRevision'], `${context} locations.json.${id}.guidance.sourceRevision`);
    requiredText(object(metadata['subject'], `${context} locations.json.${id}.subject`)['label'], `${context} locations.json.${id}.subject.label`);
  }
  return visuals as Record<string, ResolvedVisualMetadata>;
}

function resolveImageCrop(image: Record<string, unknown>, location: string): ImageCrop | undefined {
  if ('crop' in image && 'framing' in image) {
    throw new Error(`${location}: use either crop or framing, never both.`);
  }
  if ('crop' in image) {
    const crop = object(image['crop'], `${location}.crop`);
    const x = percentage(crop['x'], `${location}.crop.x`, true);
    const y = percentage(crop['y'], `${location}.crop.y`, true);
    const width = percentage(crop['width'], `${location}.crop.width`);
    const height = percentage(crop['height'], `${location}.crop.height`);
    if (x + width > 100) {
      throw new Error(`${location}.crop.width: x + width must not exceed 100%.`);
    }
    if (y + height > 100) {
      throw new Error(`${location}.crop.height: y + height must not exceed 100%.`);
    }
    return { x, y, width, height };
  }
  if ('framing' in image) {
    const framing = object(image['framing'], `${location}.framing`);
    const anchor = imageFramingAnchors.find((name) => name === framing['anchor']);
    if (!anchor) {
      throw new Error(`${location}.framing.anchor: expected ${imageFramingAnchors.join(', ')}.`);
    }
    const width = percentage(framing['width'], `${location}.framing.width`);
    const height = percentage(framing['height'], `${location}.framing.height`);
    const x = anchor.endsWith('left') || anchor === 'left' ? 0
      : anchor.endsWith('right') || anchor === 'right' ? 100 - width : (100 - width) / 2;
    const y = anchor.startsWith('top') ? 0
      : anchor.startsWith('bottom') ? 100 - height : (100 - height) / 2;
    return { x, y, width, height };
  }
  return undefined;
}

function percentage(value: unknown, location: string, allowZero = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value > 100 || (allowZero ? value < 0 : value <= 0)) {
    throw new Error(`${location}: expected a finite percentage ${allowZero ? 'in [0, 100]' : 'in (0, 100]'}.`);
  }
  return value;
}

function contained(root: string, path: string): boolean {
  const within = relative(root, path);
  return within !== '' && within !== '..' && !within.startsWith(`..${sep}`) && !isAbsolute(within);
}

function object(value: unknown, location: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${location}: expected an object.`);
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, location: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${location}: expected non-empty text.`);
  }
  return value;
}

export function contentHash(content: string | Uint8Array): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 20);
}

