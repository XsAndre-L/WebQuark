import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { present } from '../../infrastructure/filesystem/path-safety';
import type { Artifact, BinEntry } from './launcher-schema';

/** Validates that binary filename is well-formed and does not conflict with reserved Windows device names. */
export function validName(name: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) && !/^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(name);
}

/** Captures an immutable snapshot of an executable launcher on disk, either as symlink or base64 file data with mode. */
export function snapshot(file: string): Artifact | null {
  if (!present(file)) return null;
  const stat = lstatSync(file);
  if (stat.isSymbolicLink()) return { link: readlinkSync(file) };
  if (!stat.isFile()) throw new Error(`Unexpected launcher entry: ${file}`);
  return { data: readFileSync(file).toString('base64'), mode: stat.mode & 0o777 };
}

/** Determines if two launcher snapshots are bitwise and metadata identical. */
export function same(a: Artifact | null, b: Artifact | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Returns the active artifact for a launcher entry, falling back to original if active is unspecified. */
export function activeArtifact(entry: BinEntry): Artifact | null {
  return entry.active === undefined ? entry.original : entry.active;
}
