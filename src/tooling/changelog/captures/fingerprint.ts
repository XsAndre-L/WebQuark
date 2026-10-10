import { createHash } from 'node:crypto';
import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { projectPath, type ChangelogConfig } from '../config/index.js';
import type { CaptureAdapter, CaptureJob } from '../adapters/capture.js';
import { readCaptureConfiguration } from './config.js';
import { prepareCapturePreview } from '../notes/preview.js';

/** Hash the active emitted package bytes, including local installed snapshots. */
export async function captureFingerprint<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>, buildOnly = false, selected?: readonly string[]) {
  const hash = createHash('sha256');
  const watchRoots: string[] = [];
  const activeRelease = config.unreleasedDirectory.replaceAll('\\', '/');
  async function visit(path: string, label: string, packageTree = false): Promise<void> {
    const metadata = await stat(path).catch((error: NodeJS.ErrnoException) => { if (error.code === 'ENOENT') return null; throw error; });
    if (!metadata) { hash.update(`${label}:missing\n`); return; }
    if (metadata.isDirectory()) {
      const entries = await readdir(path, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        if (!packageTree && ['generated', 'tests', 'node_modules', 'build', 'dist', 'coverage'].includes(entry.name)) continue;
        // Active presentation/crops and capture-owned writes are normalized separately.
        if (!packageTree && label === activeRelease) continue;
        await visit(resolve(path, entry.name), `${label}/${entry.name}`, packageTree);
      }
    } else if (metadata.isFile()) {
      hash.update(`${label}\0`); hash.update(await readFile(path)); hash.update('\0');
    }
  }
  hash.update(`adapter\0${adapter.id}\0${adapter.revision}\0${config.metadata?.id ?? ''}\0${config.metadata?.revision ?? ''}\0`);
  if (!buildOnly) {
    const configuration = await readCaptureConfiguration(config, adapter);
    hash.update(`normalized-capture-jobs\0${JSON.stringify(adapter.projection(configuration.entries))}\0`);
    const selfTargetOutputs = configuration.entries.filter(entry => adapter.repositoryContent(entry) && (!selected?.length || selected.includes(entry.id))).map(entry => entry.output);
    if (selfTargetOutputs.length) {
      const preview = await prepareCapturePreview(config, { ownedOutputs: configuration.entries, selfTargetOutputs });
      hash.update(`repository-content\0${preview.contentHash}\0`);
    }
  }
  for (const input of adapter.inputs) {
    if (buildOnly && input.build === false) continue;
    const absolute = projectPath(config, input.path);
    await visit(absolute, input.path.replaceAll('\\', '/'));
    if (await stat(absolute).catch(() => null)) watchRoots.push(absolute);
  }
  const webquark: Record<string, string> = {};
  for (const input of adapter.packages) {
    const activePath = await realpath(projectPath(config, input.path));
    webquark[input.name] = activePath;
    hash.update(`active-package\0${input.name}\0${activePath}\0`);
    for (const tree of input.trees) await visit(projectPath({ root: activePath }, tree), `${input.name}/${tree}`, true);
    watchRoots.push(activePath);
  }
  return { sha256: hash.digest('hex'), webquark, watchRoots: [...new Set(watchRoots)] };
}

export type CaptureWatchInputs = { ownedOutputs: readonly string[]; inputAssets: readonly string[]; packageRoots?: readonly string[] };
export function relevantWatchChange(config: ChangelogConfig, path: string, inputs?: CaptureWatchInputs) {
  const local = relative(config.root, path).replaceAll('\\', '/');
  if (inputs?.packageRoots?.some(root => isWithin(root, path))) return true;
  if (local.startsWith(`${config.unreleasedDirectory}/`)) {
    if (/\.(?:json|md)$/.test(local)) return true;
    if (!/\.(?:png|jpe?g|webp|gif|svg)$/.test(local)) return false;
    return inputs?.inputAssets.some(asset => pathKey(resolve(config.root, asset)) === pathKey(resolve(path))) ?? false;
  }
  return !/(^|\/)(generated|tests|build)(\/|$)/.test(local);
}
export function requiresCaptureRestart<E extends CaptureJob>(config: ChangelogConfig, adapter: CaptureAdapter<E>, path: string, packageRoots: readonly string[] = []) {
  return packageRoots.some(root => isWithin(root, path)) || adapter.restartInputs.some(root => isWithin(projectPath(config, root), path));
}
function pathKey(path: string) { return process.platform === 'win32' ? path.toLowerCase() : path; }
function isWithin(root: string, path: string) { const local = relative(pathKey(root), pathKey(path)); return !local || (!local.startsWith('..') && !local.includes(':')); }
