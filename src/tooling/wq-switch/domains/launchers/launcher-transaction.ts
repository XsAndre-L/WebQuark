import { chmodSync, mkdirSync, renameSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { present } from '../../infrastructure/filesystem/path-safety';
import type { Artifact, BinEntry, BinOperation } from './launcher-schema';
import { activeArtifact, same, snapshot, validName } from './artifact-snapshot';
import type { State } from '../transactions/state-schema';

export class LauncherMismatchError extends Error {
  readonly code = 'WQ_LAUNCHER_MISMATCH';

  constructor(readonly file: string) {
    super('The installed launcher differs from the saved local-setup copy.');
    this.name = 'LauncherMismatchError';
  }
}

/** Validates that all launcher paths reside inside node_modules/.bin and contain valid artifacts. */
export function validateBins(root: string, bins: BinEntry[] = []): void {
  const seen = new Set<string>();
  for (const entry of bins) {
    const name = relative(join(root, 'node_modules', '.bin'), entry.file);
    if (!validName(name) || entry.file !== join(root, 'node_modules', '.bin', name) || seen.has(entry.file.toLowerCase())) {
      throw new Error('Invalid switch launcher path.');
    }
    seen.add(entry.file.toLowerCase());
    for (const value of [entry.original, activeArtifact(entry)]) {
      if (
        value !== null &&
        (!value ||
          typeof value !== 'object' ||
          ('link' in value ? typeof value.link !== 'string' : typeof value.data !== 'string' || !Number.isInteger(value.mode) || value.mode < 0 || value.mode > 0o777))
      ) {
        throw new Error('Invalid switch launcher artifact.');
      }
    }
  }
}

/** Asserts that current launchers on disk have not drifted from expected active state. */
export function assertBins(state: State): void {
  for (const entry of state.bins ?? []) {
    if (!same(snapshot(entry.file), activeArtifact(entry)))
      throw new LauncherMismatchError(entry.file);
  }
}

/** Atomically writes or removes a launcher artifact without overwriting through existing symlinks. */
export function put(file: string, value: Artifact | null): void {
  if (value === null) {
    if (present(file)) unlinkSync(file);
    return;
  }
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.wq-${randomUUID()}.tmp`;
  try {
    if ('link' in value) {
      symlinkSync(value.link, temporary, 'file');
    } else {
      writeFileSync(temporary, Buffer.from(value.data, 'base64'), { flag: 'wx' });
      chmodSync(temporary, value.mode);
    }
    renameSync(temporary, file); // Replace the entry atomically; never write through an existing link.
  } finally {
    if (present(temporary)) unlinkSync(temporary);
  }
}

/** Executes or rolls back a single launcher mutation operation. */
export function changeBin(operation: BinOperation, rollback = false): void {
  const expected = rollback ? operation.after : operation.before;
  const desired = rollback ? operation.before : operation.after;
  const actual = snapshot(operation.file);
  if (same(actual, desired)) return;
  if (!same(actual, expected)) {
    throw new Error(`Launcher changed during switching: ${operation.file}. Refusing to overwrite it.`);
  }
  put(operation.file, desired);
}

/** Computes the forward or rollback list of launcher operations between previous and next states. */
export function binOperations(previous: State | null, next: State | null): BinOperation[] {
  const entries = next?.bins ?? previous?.bins ?? [];
  return entries.map(entry => ({
    file: entry.file,
    before: previous?.bins?.find(old => old.file === entry.file) ? activeArtifact(previous.bins.find(old => old.file === entry.file)!) : entry.original,
    after: next ? activeArtifact(entry) : entry.original,
  }));
}
