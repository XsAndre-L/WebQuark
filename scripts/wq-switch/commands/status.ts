import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { json, selectedPackages, type SwitchConfig } from '../config';
import { installed, validatePackage } from '../packages';
import { hasJournal, linkTarget, readState } from '../state';

export function status(root: string): void {
  const state = readState(root);
  let broken = false, local = 0;
  const rows: string[] = [];
  for (const name of selectedPackages(root)) {
    try {
      const path = installed(name, root);
      const entry = state?.entries.find(entry => entry.name === name);
      if (entry && linkTarget(entry.slot) === entry.target) { validatePackage(path); local++; }
      rows.push(`${name} -> ${path}`);
    } catch { broken = true; rows.push(`${name} -> MISSING`); }
  }
  const pending = hasJournal(root);
  const mode = pending ? 'RECOVERY NEEDED' : broken ? 'BROKEN' : state ? local === state.entries.length ? 'LOCAL' : 'MIXED' : 'NPM / UNMANAGED';
  const file = join(root, '.wq-switch.json');
  const config = existsSync(file) ? json<SwitchConfig>(file) : undefined;
  console.log(`Mode: ${mode}\nSource: ${config?.source || 'not configured'}\nPreferred release: ${config?.preferredVersion ?? 'not configured'}\n${rows.join('\n')}`);
  if (pending) console.log('Run wq-switch npm or local to recover the interrupted operation first.');
  if (state) console.log('Local files are snapshots of the last successful activation. Run wq-switch build after source edits.');
  if (broken || pending || (state && local !== state.entries.length)) process.exitCode = 1;
}
