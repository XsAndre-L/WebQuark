import type { Stats } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { acquireReleaseContentLock } from '../shared/release-content-lock.js';
import { projectPath, validateChangelogConfig, type ChangelogConfig } from '../config/index.js';
import { captureFormatForPath, inspectCaptureImage } from './image.js';

type CaptureOutput = { output: string };
type PlannedOutput = { output: string; path: string; identity?: string; original?: Buffer };
export type PublicationPlan = {
  repositoryRoot: string;
  config: ChangelogConfig;
  currentProjection?: () => Promise<unknown>;
  unreleasedPath: string;
  unreleasedIdentity: string;
  imagesPath: string;
  imagesIdentity: string;
  configPath: string;
  configBytes: Buffer;
  visualsBytes?: Buffer;
  outputs: PlannedOutput[];
  entries: readonly CaptureOutput[];
  captureProjection?: unknown;
  inputDependencies: readonly { path: string; hash: string }[];
  validatePresentation?: (results: readonly StagedCapture[]) => Promise<void>;
};
export type StagedCapture = { output: string; stagedPath: string };

/** Resolve a missing destination against its nearest existing real parent. */
export async function canonicalPath(path: string): Promise<string> {
  const absolute = resolve(path);
  try {
    return await realpath(absolute);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
    // A dangling symlink must not be mistaken for a new ordinary file.
    if (await lstat(absolute).catch((failure: NodeJS.ErrnoException) => {
      if (failure.code === 'ENOENT') {
        return undefined;
      }
      throw failure;
    })) {
      throw new Error(`Cannot resolve existing path: ${absolute}.`);
    }
    const parent = dirname(absolute);
    if (parent === absolute) {
      throw new Error(`Cannot resolve path: ${absolute}.`);
    }
    return resolve(await canonicalPath(parent), basename(absolute));
  }
}

export async function planCapturePublication(
  config: ChangelogConfig,
  configPath: string,
  configBytes: Uint8Array,
  entries: readonly CaptureOutput[],
  options: { currentProjection?: () => Promise<unknown>; captureProjection?: unknown; inputDependencies?: readonly { path: string; hash: string }[]; validatePresentation?: PublicationPlan['validatePresentation'] } = {},
): Promise<PublicationPlan> {
  await validateChangelogConfig(config);
  const root = await realpath(config.root);
  const unreleasedPath = await realpath(projectPath(config, config.unreleasedDirectory));
  assertInside(root, unreleasedPath, 'Unreleased folder');
  if (pathKey(unreleasedPath) !== pathKey(projectPath(config, config.unreleasedDirectory))) {
    throw new Error('Unreleased folder must not alias another folder or archived release.');
  }
  const imagesPath = await realpath(resolve(unreleasedPath, 'images'));
  assertInside(unreleasedPath, imagesPath, 'Unreleased images folder');
  const canonicalConfig = await realpath(configPath);
  assertInside(unreleasedPath, canonicalConfig, 'captures.json');
  if (pathKey(canonicalConfig) !== pathKey(resolve(unreleasedPath, 'captures.json'))) {
    throw new Error('Capture configuration must be the active Unreleased captures.json.');
  }
  const bytes = Buffer.from(configBytes);
  if (!(await readFile(canonicalConfig)).equals(bytes)) {
    throw new Error('captures.json changed while loading; restart capture.');
  }
  const visualsBytes = await optionalRead(resolve(unreleasedPath, 'visuals.json'));
  const beforeSources: string[] = [];
  if (visualsBytes) {
    const visuals: unknown = JSON.parse(visualsBytes.toString('utf8'));
    if (!Array.isArray(visuals)) {
      throw new Error('Unreleased visuals.json must contain an array.');
    }
    for (const visual of visuals) {
      if (visual?.before?.src) {
        beforeSources.push(visual.before.src);
      }
    }
  }
  const beforePaths = new Set<string>();
  const beforeFiles = new Set<string>();
  for (const source of beforeSources) {
    const path = await imageDestination(unreleasedPath, imagesPath, source);
    const info = await stat(path);
    if (!info.isFile()) {
      throw new Error(`Before screenshot must be an existing file: ${source}.`);
    }
    beforePaths.add(pathKey(path));
    beforeFiles.add(fileIdentity(info));
  }
  const outputs: PlannedOutput[] = [];
  const destinations = new Set<string>();
  const existingFiles = new Set<string>();
  for (const entry of entries) {
    if (!/-after\.(?:webp|png)$/i.test(basename(entry.output))) {
      throw new Error(`Capture output must end in -after.webp or -after.png: ${entry.output}.`);
    }
    const path = await imageDestination(unreleasedPath, imagesPath, entry.output);
    if (!/-after\.(?:webp|png)$/i.test(basename(path)) || captureFormatForPath(path) !== captureFormatForPath(entry.output)) {
      throw new Error(`Capture output must resolve to an After file of the configured format: ${entry.output}.`);
    }
    const key = pathKey(path);
    const info = await optionalStat(path);
    const identity = info ? fileIdentity(info) : undefined;
    if (beforePaths.has(key) || (identity && beforeFiles.has(identity))) {
      throw new Error(`Capture output aliases an immutable Before screenshot: ${entry.output}.`);
    }
    if (destinations.has(key) || (identity && existingFiles.has(identity))) {
      throw new Error(`Capture outputs must have unique canonical destinations: ${entry.output}.`);
    }
    if (info && !info.isFile()) {
      throw new Error(`Capture output is not a regular file: ${entry.output}.`);
    }
    destinations.add(key);
    if (identity) {
      existingFiles.add(identity);
    }
    outputs.push({ output: entry.output, path, identity, original: await optionalRead(path) });
  }
  return {
    repositoryRoot: root,
    config,
    currentProjection: options.currentProjection,
    unreleasedPath,
    unreleasedIdentity: directoryIdentity(await stat(unreleasedPath)),
    imagesPath,
    imagesIdentity: directoryIdentity(await stat(imagesPath)),
    configPath: canonicalConfig,
    configBytes: bytes,
    visualsBytes,
    outputs,
    entries,
    captureProjection: options.captureProjection,
    inputDependencies: options.inputDependencies ?? [],
    validatePresentation: options.validatePresentation,
  };
}

/** All selected captures are staged before the short shared release-content lock. */
export async function publishCaptureRun(
  plan: PublicationPlan,
  results: readonly StagedCapture[],
  assertRunCurrent: () => Promise<void>,
): Promise<string[]> {
  const unlock = await acquireReleaseContentLock(plan.repositoryRoot, plan.config.lockNamespace);
  try {
    await revalidatePublication(plan);
    await plan.validatePresentation?.(results);
    await assertDependencyPublication(plan.config, results, plan.inputDependencies);
    const selected = new Set<string>();
    const replacements: { target: PlannedOutput; content: Buffer }[] = [];
    for (const result of results) {
      const target = plan.outputs.find((output) => output.output === result.output);
      if (!target || selected.has(target.output)) {
        throw new Error(`Unexpected or duplicate staged capture: ${result.output}.`);
      }
      selected.add(target.output);
      const content = await readFile(result.stagedPath);
      if (captureFormatForPath(result.stagedPath) !== captureFormatForPath(result.output)) throw new Error(`Staged capture extension differs from its output: ${result.output}.`);
      await inspectCaptureImage(content, result.output);
      if (!target.original?.equals(content)) {
        replacements.push({ target, content });
      }
    }
    await assertRunCurrent();
    const changed: PlannedOutput[] = [];
    try {
      for (const { target, content } of replacements) {
        await replaceFile(target.path, content);
        changed.push(target);
      }
    } catch (error) {
      for (const target of changed.reverse()) {
        if (target.original) {
          await replaceFile(target.path, target.original);
        } else {
          await rm(target.path);
        }
      }
      throw error;
    }
    return changed.map((target) => target.path);
  } finally {
    await unlock();
  }
}

async function revalidatePublication(plan: PublicationPlan): Promise<void> {
  const current = await realpath(projectPath(plan.config, plan.config.unreleasedDirectory));
  if (pathKey(current) !== pathKey(plan.unreleasedPath)
    || directoryIdentity(await stat(current)) !== plan.unreleasedIdentity
    || directoryIdentity(await stat(plan.imagesPath)) !== plan.imagesIdentity) {
    throw new Error('Unreleased folder changed during capture; restart capture.');
  }
  if (plan.captureProjection !== undefined) {
    if (!plan.currentProjection) throw new Error('Publication requires current normalized capture inputs.');
    if (JSON.stringify(await plan.currentProjection()) !== JSON.stringify(plan.captureProjection)) throw new Error('Capture inputs or output associations changed; re-stage this run.');
  } else if (!sameBytes(await optionalRead(plan.configPath), plan.configBytes)
    || !sameBytes(await optionalRead(resolve(current, 'visuals.json')), plan.visualsBytes)) {
      throw new Error('Capture configuration or visual references changed during capture; restart capture.');
  }
  const currentBytes = await readFile(plan.configPath);
  const refreshed = await planCapturePublication(plan.config, plan.configPath, currentBytes, plan.entries);
  for (const output of plan.outputs) {
    const fresh = refreshed.outputs.find((entry) => entry.output === output.output);
    if (!fresh || pathKey(fresh.path) !== pathKey(output.path) || fresh.identity !== output.identity || !sameBytes(fresh.original, output.original)) {
      throw new Error(`Capture destination changed during capture: ${output.output}.`);
    }
  }
}

export function publicationSnapshot(plan: PublicationPlan) {
  return { unreleasedPath: plan.unreleasedPath, unreleasedIdentity: plan.unreleasedIdentity, imagesPath: plan.imagesPath, imagesIdentity: plan.imagesIdentity,
    outputs: plan.outputs.map(output => ({ output: output.output, path: output.path, identity: output.identity,
      originalHash: output.original ? createHash('sha256').update(output.original).digest('hex') : undefined })) };
}

/** An input displayed inside a page must be published in an earlier transaction. */
export async function assertDependencyPublication(config: ChangelogConfig, selected: readonly CaptureOutput[], dependencies: readonly { path: string; hash: string }[]): Promise<void> {
  await validateChangelogConfig(config);
  const root = await realpath(config.root);
  const destinations = await Promise.all(selected.map(async item => {
    const path = await canonicalPath(resolve(projectPath(config, config.unreleasedDirectory), item.output));
    const info = await optionalStat(path);
    return { path: pathKey(path), identity: info ? fileIdentity(info) : undefined };
  }));
  for (const dependency of dependencies) {
    const source = await realpath(resolve(root, dependency.path));
    assertInside(root, source, 'Repository-content dependency');
    const info = await stat(source);
    if (!info.isFile() || createHash('sha256').update(await readFile(source)).digest('hex') !== dependency.hash) throw new Error(`Repository-content input changed: ${dependency.path}. Re-stage this page.`);
    if (destinations.some(item => item.path === pathKey(source) || item.identity === fileIdentity(info))) throw new Error(`This capture/publication set replaces a What's new input image: ${dependency.path}. Publish dependencies first, then stage What's new separately.`);
  }
}

async function imageDestination(unreleasedPath: string, imagesPath: string, source: string): Promise<string> {
  if (typeof source !== 'string' || source.split('/')[0] !== 'images'
    || source.split('/').length < 2 || /[\\\u0000:?#<>|*"]/.test(source)
    || source.split('/').some((part) => !part || part === '.' || part === '..' || /[. ]$/.test(part))) {
    throw new Error(`Image must use a relative path inside Unreleased images/: ${source}.`);
  }
  const path = await canonicalPath(resolve(unreleasedPath, source));
  assertInside(imagesPath, path, source);
  return path;
}

function pathKey(path: string): string {
  return process.platform === 'win32' ? path.toLowerCase() : path;
}

function assertInside(root: string, path: string, label: string): void {
  const within = relative(pathKey(root), pathKey(path));
  if (!within || within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within)) {
    throw new Error(`${label} escapes its allowed root.`);
  }
}

function fileIdentity(info: Stats): string {
  return `${info.dev}:${info.ino}`;
}

function directoryIdentity(info: Stats): string {
  if (!info.isDirectory()) {
    throw new Error('Capture root must be a directory.');
  }
  return `${fileIdentity(info)}:${info.birthtimeMs}`;
}

function sameBytes(left?: Buffer, right?: Buffer): boolean {
  return left === undefined ? right === undefined : right !== undefined && left.equals(right);
}

async function optionalRead(path: string): Promise<Buffer | undefined> {
  try {
    return await readFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

async function optionalStat(path: string): Promise<Stats | undefined> {
  try {
    return await stat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

async function replaceFile(path: string, content: Buffer): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const sibling = resolve(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
  try {
    await writeFile(sibling, content, { flag: 'wx' });
    await rename(sibling, path);
  } finally {
    await rm(sibling, { force: true });
  }
}

