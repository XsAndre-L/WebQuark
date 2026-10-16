import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { names } from '../workspace/catalog';
import { within } from '../../infrastructure/filesystem/path-safety';
import { binOperations, validateBins } from '../launchers/launcher-transaction';
import type { ProjectPaths } from '../workspace/consumer-paths';
import type { State } from './state-schema';
import type { Journal } from './journal-schema';

/** Computes the filesystem device and inode identity string for a file. */
export function identity(file: string): string {
  const stat = statSync(file);
  return `${stat.dev}:${stat.ino}`;
}

/** Verifies that switch state data structures and file paths are valid and safe before execution. */
export function validateState(root: string, state: State, paths: ProjectPaths): void {
  if (state.version !== 1 || !Array.isArray(state.entries)) throw new Error('Unsupported switch state.');
  if (!within(paths.packages, state.generation)) throw new Error('Invalid switch generation path; refusing filesystem changes.');
  for (const entry of state.entries) {
    if (
      !names.includes(entry.name) ||
      entry.slot !== join(root, 'node_modules', entry.name) ||
      dirname(entry.backup) !== dirname(entry.slot) ||
      !entry.backup.startsWith(entry.slot + '.wq-original-') ||
      !within(state.generation, entry.target)
    ) {
      throw new Error('Invalid switch state paths; refusing filesystem changes.');
    }
  }
  validateBins(root, state.bins);
}

/** Validates that recovery journal operations match recorded previous and next state entries. */
export function validateJournal(root: string, journal: Journal, paths: ProjectPaths): void {
  if (journal.previous) validateState(root, journal.previous, paths);
  if (journal.next) validateState(root, journal.next, paths);
  const entries = [...(journal.previous?.entries ?? []), ...(journal.next?.entries ?? [])];
  for (const op of journal.operations) {
    const matching = entries.filter(entry => entry.slot === op.slot);
    if (
      !matching.length ||
      (op.move && !matching.some(entry => entry.backup === op.move)) ||
      [op.before, op.after].some(target => target !== null && !matching.some(entry => entry.target === target))
    ) {
      throw new Error('Invalid recovery journal.');
    }
  }
  if (JSON.stringify(journal.bins ?? []) !== JSON.stringify(binOperations(journal.previous, journal.next))) {
    throw new Error('Invalid launcher recovery journal.');
  }
}
