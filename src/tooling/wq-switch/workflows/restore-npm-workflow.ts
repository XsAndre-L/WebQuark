import { renameSync } from 'node:fs';
import { removeExpectedLink } from '../infrastructure/filesystem/system-links';
import { projectPaths } from '../domains/workspace';
import { binOperations, changeBin } from '../domains/launchers';
import { assertActive, readState, saveState } from '../domains/transactions/state-store';
import { clearJournal, writeJournal } from '../domains/transactions/journal-store';
import { recover } from './crash-recovery-workflow';
import { pruneSnapshots } from './prune-snapshots-workflow';

/** Restores original installed npm package slots and launchers, clearing switch state. */
export function restore(root: string): void {
  const paths = projectPaths(root);
  const previous = readState(root);
  if (!previous) {
    pruneSnapshots(root);
    return;
  }
  assertActive(previous);

  const operations = previous.entries.map(entry => ({ slot: entry.slot, before: entry.target, after: null }));
  const bins = binOperations(previous, null);
  writeJournal(paths, { previous, next: null, operations, bins });

  try {
    for (const entry of previous.entries) {
      removeExpectedLink(entry.slot, entry.target);
      if (entry.identity) renameSync(entry.backup, entry.slot);
    }
    for (const operation of bins) changeBin(operation);
    saveState(null, paths);
    clearJournal(paths);
  } catch (error) {
    recover(root);
    throw error;
  }
  pruneSnapshots(root);
}
