import { join, resolve } from 'node:path';
import { json } from '../infrastructure/filesystem/atomic-json';
import { linkTarget } from '../infrastructure/filesystem/system-links';
import { resolveSwitchConfig, selectedPackages } from '../domains/workspace';
import { installedWebQuark, validatePackage } from '../domains/snapshots';
import { hasJournal, readState } from '../domains/transactions';
import { assertBins } from '../domains/launchers';
import { reportFailure } from '../cli/feedback';

export function inspectStatus(root: string) {
  const state = readState(root);
  const rows: string[] = [];
  const errors: Error[] = [];
  let local = 0;

  for (const name of selectedPackages(root)) {
    try {
      const path = installedWebQuark(name, root);
      const entry = state?.entries.find(entry => entry.name === name);

      if (entry && linkTarget(entry.slot) === entry.target) {
        validatePackage(path);
        local++;
      }

      const version = json<{ version?: string }>(join(path, 'package.json')).version ?? 'unknown';
      rows.push(`${name}@${version} -> ${path}`);
    } catch (error) {
      errors.push(new Error(`Could not inspect ${name}: ${error instanceof Error ? error.message : String(error)}`));
      rows.push(`${name} -> UNAVAILABLE`);
    }
  }

  if (state) {
    try {
      assertBins(state);
    } catch (error) {
      errors.unshift(error instanceof Error ? error : new Error(String(error)));
    }
  }

  const pending = hasJournal(root);
  const mode = pending
    ? 'RECOVERY NEEDED'
    : errors.length
      ? 'BROKEN'
      : state
        ? (local === state.entries.length ? 'LOCAL' : 'MIXED')
        : 'NPM / UNMANAGED';

  if (pending)
    errors.push(new Error('An interrupted WebQuark switch still has a recovery journal.'));

  if (state && local !== state.entries.length)
    errors.push(new Error('Installed packages differ from the saved local setup.'));

  return { mode, rows, errors, state };
}

/** Prints the full package and configuration report for explicit status requests. */
export function status(root: string): void {
  const result = inspectStatus(root);
  const resolved = resolveSwitchConfig(root);
  const config = resolved?.config;

  console.log(
    `Mode: ${result.mode}\nConfiguration: ${resolved?.file ?? 'not configured'}\nSource: ${config?.source ? resolve(resolved!.root, config.source) : 'not configured'}\nPreferred release: ${config?.preferredVersion ?? 'not configured'}\n${result.rows.join('\n')}`,
  );

  for (const error of result.errors)
    reportFailure(error, root, 'WebQuark setup needs attention', false);

  if (result.state && result.errors.length === 0) {
    console.log(
      'Local files are snapshots of the last successful activation, not a live source link. ' +
      'The preferred release is not the active snapshot version. ' +
      'Run wq-switch build after source edits, then restart the consumer dev server.',
    );
  }
}
