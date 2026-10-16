import { renameSync } from 'node:fs';
import { present } from '../infrastructure/filesystem/path-safety';
import { link, removeExpectedLink } from '../infrastructure/filesystem/system-links';
import { projectPaths } from '../domains/workspace';
import { binOperations, changeBin } from '../domains/launchers';
import { assertActive, readState, saveState } from '../domains/transactions/state-store';
import { identity, validateState } from '../domains/transactions/state-integrity';
import { clearJournal, writeJournal } from '../domains/transactions/journal-store';
import { recover } from './crash-recovery-workflow';
import { pruneSnapshots } from './prune-snapshots-workflow';
import type { Operation } from '../domains/transactions/journal-schema';
import type { State } from '../domains/transactions/state-schema';

/** Executes the two-phase activation transaction to swap package slots and launchers to a local snapshot. */
export function activate(root: string, next: State): void {
  const paths = projectPaths(root);
  validateState(root, next, paths);
  const previous = readState(root);
  if (previous) assertActive(previous);

  const operations: Operation[] = next.entries.map(entry => {
    const old = previous?.entries.find(old => old.name === entry.name);
    if (!old && (present(entry.backup) || (entry.identity ? !present(entry.slot) || identity(entry.slot) !== entry.identity : present(entry.slot)))) {
      throw new Error(`Original connection changed: ${entry.name}`);
    }
    return { slot: entry.slot, before: old?.target ?? null, after: entry.target, ...(old ? {} : { move: entry.backup }) };
  });

  const bins = binOperations(previous, next);
  writeJournal(paths, { previous, next, operations, bins });

  try {
    for (const op of operations) {
      if (op.move) {
        if (present(op.slot)) renameSync(op.slot, op.move);
      } else {
        removeExpectedLink(op.slot, op.before!);
      }
      link(op.after!, op.slot);
    }
    for (const operation of bins) changeBin(operation);
    saveState(next, paths);
    clearJournal(paths);
  } catch (error) {
    recover(root);
    throw error;
  }
  pruneSnapshots(root);
}
