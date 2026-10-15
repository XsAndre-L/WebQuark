import { spawn } from 'node:child_process';
import { selectedPackages, sourceFor } from '../config';
import { stage } from '../packages';
import { activate, assertActive, discardSnapshot, hasJournal, locked, pruneSnapshots, readState } from '../state';
import { stageBins } from '../bins';

export async function compile(source: string): Promise<void> {
  console.log(`Building core, browser, tooling, React, and Angular in ${source}`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn('bun', ['run', 'packages:build'], { cwd: source, stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`WebQuark build failed (${signal ?? code}). Active packages were not changed.`)));
  });
}
export async function build(root: string, connect = false): Promise<void> {
  const source = sourceFor(root);
  const active = readState(root);
  if (active) {
    assertActive(active);
    if (active.source !== source || active.entries.map(e => e.name).join() !== selectedPackages(root).join()) throw new Error('Configuration changed. Run wq-switch npm before switching again.');
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
          try { discardSnapshot(root, next.generation); }
          catch (cleanupError) { throw new AggregateError([error, cleanupError], 'Local activation failed and its unused snapshot could not be removed.'); }
        }
        throw error;
      }
      console.log(`LOCAL: ${source}\nBuild activated. Restart the consumer dev server.`);
    } else console.log('Build complete. Package connections unchanged. Use wq-switch local to activate.');
  });
}
