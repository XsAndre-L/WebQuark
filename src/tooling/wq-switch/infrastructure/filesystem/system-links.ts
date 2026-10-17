import { lstatSync, mkdirSync, readdirSync, readlinkSync, rmdirSync, symlinkSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { present } from './path-safety';

/** Resolves the symbolic target of a link, returning null if the path is absent or not a link. */
export function linkTarget(file: string): string | null {
  if (!present(file) || !lstatSync(file).isSymbolicLink()) return null;
  return resolve(dirname(file), readlinkSync(file));
}

/** Creates a directory link using junctions on Windows and symbolic directory links on POSIX. */
export function link(target: string, file: string): void {
  mkdirSync(dirname(file), { recursive: true });
  symlinkSync(target, file, process.platform === 'win32' ? 'junction' : 'dir');
}

/** Unlinks a symlink slot only if it matches the expected link target. */
export function removeExpectedLink(slot: string, expected: string): void {
  if (linkTarget(slot) !== expected) throw new Error(`Package connection changed: ${slot}`);
  unlinkSync(slot); // Never recurse into a package, junction, or shared package store.
}

/** Recursively removes a snapshot tree, unlinking links themselves without traversing into targets. */
export function removeSnapshotTree(directory: string): void {
  const stat = lstatSync(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    unlinkSync(directory);
    return;
  }
  for (const child of readdirSync(directory)) {
    removeSnapshotTree(resolve(directory, child));
  }
  rmdirSync(directory);
}
