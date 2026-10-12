import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathExists } from './files.js';
import type { SnapshotEntry } from './types.js';

export async function createSnapshot(
  repositoryRoot: string,
  relativePaths: readonly string[],
): Promise<{ readonly root: string; readonly entries: readonly SnapshotEntry[] }> {
  const snapshotRoot = await mkdtemp(join(tmpdir(), 'webquark-release-'));
  const entries: SnapshotEntry[] = [];

  for (const [index, relativePath] of relativePaths.entries()) {
    const path = managedRepositoryPath(repositoryRoot, relativePath);
    const snapshotPath = resolve(snapshotRoot, String(index));
    const existed = await pathExists(path);
    if (existed) {
      await cp(path, snapshotPath, { recursive: true, force: true });
    }
    entries.push({ path, snapshotPath, existed });
  }

  return { root: snapshotRoot, entries };
}

export async function restoreSnapshot(snapshot: {
  readonly entries: readonly SnapshotEntry[];
}): Promise<void> {
  for (const entry of snapshot.entries) {
    await rm(entry.path, { recursive: true, force: true });
    if (entry.existed) {
      await mkdir(dirname(entry.path), { recursive: true });
      await cp(entry.snapshotPath, entry.path, { recursive: true, force: true });
    }
  }
}

export async function removeSnapshot(snapshot: { readonly root: string }): Promise<void> {
  const temporaryRoot = resolve(tmpdir());
  const snapshotRoot = resolve(snapshot.root);
  const relation = relative(temporaryRoot, snapshotRoot);
  if (!relation || relation.startsWith('..') || isAbsolute(relation)) {
    throw new Error(`Refusing to remove unexpected snapshot path ${snapshotRoot}.`);
  }
  await rm(snapshotRoot, { recursive: true, force: true });
}

function managedRepositoryPath(repositoryRoot: string, relativePath: string): string {
  const root = resolve(repositoryRoot);
  const path = resolve(root, relativePath);
  const relation = relative(root, path);
  if (!relation || relation.startsWith('..') || isAbsolute(relation)) {
    throw new Error(`Release path must be a repository descendant: ${relativePath}.`);
  }
  return path;
}

