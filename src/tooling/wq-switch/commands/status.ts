import { join } from 'node:path';
import { json, readSwitchConfig, selectedPackages } from '../config';
import { installedWebQuark, validatePackage } from '../packages';
import { hasJournal, linkTarget, readState } from '../state';
import { assertBins } from '../bins';

export function status(root: string): void {
  const state = readState(root);
  let broken = false, local = 0;
  const rows: string[] = [];
  for (const name of selectedPackages(root)) {
    try {
      const path = installedWebQuark(name, root);
      const entry = state?.entries.find(entry => entry.name === name);
      if (entry && linkTarget(entry.slot) === entry.target) { validatePackage(path); local++; }
      const version = json<{ version?: string }>(join(path, 'package.json')).version ?? 'unknown';
      rows.push(`${name}@${version} -> ${path}`);
    } catch { broken = true; rows.push(`${name} -> MISSING`); }
  }
  if (state) {
    try { assertBins(state); }
    catch (error) { broken = true; rows.push((error as Error).message); }
  }
  const pending = hasJournal(root);
  const mode = pending ? 'RECOVERY NEEDED' : broken ? 'BROKEN' : state ? local === state.entries.length ? 'LOCAL' : 'MIXED' : 'NPM / UNMANAGED';
  const config = readSwitchConfig(root);
  console.log(`Mode: ${mode}\nSource: ${config?.source || 'not configured'}\nPreferred release: ${config?.preferredVersion ?? 'not configured'}\n${rows.join('\n')}`);
  if (pending) console.log('Run wq-switch npm or local to recover the interrupted operation first.');
  if (state) console.log('Local files are snapshots of the last successful activation, not a live source link. The preferred release is not the active snapshot version. Run wq-switch build after source edits, then restart the consumer dev server.');
  if (broken || pending || (state && local !== state.entries.length)) process.exitCode = 1;
}
