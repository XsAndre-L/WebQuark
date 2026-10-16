import { renameSync } from 'node:fs';
import { present } from '../infrastructure/filesystem/path-safety';
import { link, linkTarget, removeExpectedLink } from '../infrastructure/filesystem/system-links';
import { projectPaths } from '../domains/workspace';
import { changeBin } from '../domains/launchers';
import { identity } from '../domains/transactions/state-integrity';
import { saveState } from '../domains/transactions/state-store';
import { clearJournal, readJournal } from '../domains/transactions/journal-store';
import { discardSnapshot } from '../domains/snapshots';
import { pruneSnapshots } from './prune-snapshots-workflow';

/** Replays the recovery journal in reverse order to roll back interrupted switches and restore consistency. */
export function recover(root: string): void {
  const paths = projectPaths(root);
  const journal = readJournal(root);
  if (!journal) return;

  for (const operation of [...(journal.bins ?? [])].reverse()) {
    changeBin(operation, true);
  }

  for (const op of [...journal.operations].reverse()) {
    if (op.move) {
      const entry = journal.next!.entries.find(entry => entry.slot === op.slot)!;
      if (!entry.identity) {
        if (present(op.slot)) removeExpectedLink(op.slot, op.after!);
        continue;
      }
      // Initial switch: the original package was moved aside, not copied or deleted.
      if (present(op.move)) {
        if (present(op.slot)) removeExpectedLink(op.slot, op.after!);
        renameSync(op.move, op.slot);
      } else if (!present(op.slot) || identity(op.slot) !== entry.identity) {
        throw new Error(`Recovery needs the original package: ${op.slot}`);
      }
    } else if (op.after === null) {
      // Restore: move an original package back into its saved position if necessary.
      const entry = journal.previous!.entries.find(entry => entry.slot === op.slot)!;
      if (entry.identity && !present(entry.backup)) {
        if (!present(op.slot) || identity(op.slot) !== entry.identity) {
          throw new Error(`Recovery found an unexpected package: ${op.slot}`);
        }
        renameSync(op.slot, entry.backup);
      }
      if (!present(op.slot)) link(op.before!, op.slot);
      else if (linkTarget(op.slot) !== op.before) throw new Error(`Recovery found an unexpected connection: ${op.slot}`);
    } else {
      const current = linkTarget(op.slot);
      if (current === op.after) removeExpectedLink(op.slot, op.after);
      else if (present(op.slot) && current !== op.before) throw new Error(`Recovery found an unexpected connection: ${op.slot}`);
      if (!present(op.slot)) link(op.before!, op.slot);
    }
  }

  saveState(journal.previous, paths);
  clearJournal(paths);
  if (journal.next && journal.next.generation !== journal.previous?.generation) {
    discardSnapshot(root, journal.next.generation);
  }
  pruneSnapshots(root);
}
