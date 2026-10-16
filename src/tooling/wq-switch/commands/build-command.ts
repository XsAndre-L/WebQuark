import { selectedPackages, sourceFor } from '../domains/workspace';
import { discardSnapshot, stage } from '../domains/snapshots';
import { assertActive, hasJournal, readState } from '../domains/transactions';
import { stageBins } from '../domains/launchers';
import { activate, pruneSnapshots } from '../workflows';
import { compile } from '../infrastructure/concurrency/compile-runner';
import { locked } from '../infrastructure/concurrency/process-lock';

export { compile };

/** Builds WebQuark packages and refreshes active snapshots, or activates them if connect is requested. */
export async function build(root: string, connect = false): Promise<void> {
  const source = sourceFor(root);
  const active = readState(root);
  if (active) {
    assertActive(active);
    if (active.source !== source || active.entries.map(e => e.name).join() !== selectedPackages(root).join()) {
      throw new Error('Configuration changed. Run wq-switch npm before switching again.');
    }
  }

  await locked(`source:${source}`, async () => {
    pruneSnapshots(root);
    await compile(source);
    if (connect || readState(root)) {
      const next = stage(root, source);
      try {
        await stageBins(root, next);
        activate(root, next);
      } catch (error) {
        // A committed activation may report a pruning error. Never discard it,
        // or a generation still referenced by an interrupted recovery journal.
        if (!hasJournal(root) && readState(root)?.generation !== next.generation) {
          try {
            discardSnapshot(root, next.generation);
          } catch (cleanupError) {
            throw new AggregateError([error, cleanupError], 'Local activation failed and its unused snapshot could not be removed.');
          }
        }
        throw error;
      }
      console.log(`LOCAL: ${source}\nBuild activated. Restart the consumer dev server.`);
    } else {
      console.log('Build complete. Package connections unchanged. Use wq-switch local to activate.');
    }
  });
}
