import { spawn } from 'node:child_process';
import { selectedPackages, sourceFor } from '../config';
import { stage } from '../packages';
import { activate, assertActive, locked, readState } from '../state';

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
    await compile(source);
    if (connect || readState(root)) {
      const next = stage(root, source);
      activate(root, next);
      console.log(`LOCAL: ${source}\nBuild activated. Restart the consumer dev server.`);
    } else console.log('Build complete. Package connections unchanged. Use wq-switch local to activate.');
  });
}
