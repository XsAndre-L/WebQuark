import { lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import { present } from '../../infrastructure/filesystem/path-safety';
import { removeSnapshotTree } from '../../infrastructure/filesystem/system-links';
import { projectPaths } from '../workspace/consumer-paths';
import { assertActive, readState } from '../transactions/state-store';
import { hasJournal, readJournal } from '../transactions/journal-store';

/** Validates that snapshot directories are genuine physical folders and returns the packages storage root. */
export function snapshotDirectory(root: string): string {
  const paths = projectPaths(root);
  for (const directory of [paths.directory, dirname(paths.packages), paths.packages]) {
    if (present(directory) && (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink())) {
      throw new Error(`Snapshot directory is not a physical directory: ${directory}`);
    }
  }
  return paths.packages;
}

/** Identifies snapshot generation paths that must not be deleted because they are active or in recovery. */
export function protectedGenerations(root: string): Set<string> {
  const protectedPaths = new Set<string>();
  const active = readState(root);
  if (active) {
    assertActive(active);
    protectedPaths.add(active.generation);
  }
  if (hasJournal(root)) {
    const journal = readJournal(root);
    for (const state of [journal?.previous, journal?.next]) {
      if (state) protectedPaths.add(state.generation);
    }
  }
  return protectedPaths;
}

/** Safely discards an unused snapshot generation directory if not protected by active state or recovery journal. */
export function discardSnapshot(root: string, generation: string): void {
  const directory = snapshotDirectory(root);
  if (dirname(generation) !== directory) throw new Error('Invalid snapshot path; refusing cleanup.');
  if (protectedGenerations(root).has(generation)) throw new Error(`Snapshot is still needed by active state or recovery: ${generation}`);
  if (present(generation)) removeSnapshotTree(generation);
}
