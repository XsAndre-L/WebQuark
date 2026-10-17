import { lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { present } from '../infrastructure/filesystem/path-safety';
import { removeSnapshotTree } from '../infrastructure/filesystem/system-links';
import { protectedGenerations, snapshotDirectory } from '../domains/snapshots/snapshot-retention';

/** Enforces the strict 2-generation retention limit by deleting older snapshot directories under consumer lock. */
export function pruneSnapshots(root: string): void {
  const directory = snapshotDirectory(root);
  if (!present(directory)) return;
  const keep = protectedGenerations(root);
  const snapshots = readdirSync(directory)
    .map(name => {
      const path = join(directory, name),
        stat = lstatSync(path);
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new Error(`Unexpected snapshot entry; refusing cleanup: ${path}`);
      }
      // Deleting children changes mtime even when deletion later fails. Birthtime
      // keeps an older, partially removed generation older on the next retry.
      return { path, created: stat.birthtimeMs };
    })
    .sort((a, b) => b.created - a.created || b.path.localeCompare(a.path));

  if (keep.size > 2) throw new Error('More than two snapshots are required for recovery; recover before cleanup.');
  for (const snapshot of snapshots) if (keep.size < 2) keep.add(snapshot.path);
  for (const snapshot of [...snapshots].reverse()) {
    if (keep.has(snapshot.path)) continue;
    try {
      removeSnapshotTree(snapshot.path);
    } catch (error) {
      throw new Error(`Snapshot cleanup failed: ${snapshot.path}. Active connections are unchanged; retry the command to enforce the two-snapshot limit.`, {
        cause: error,
      });
    }
  }
}
