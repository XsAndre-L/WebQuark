import { existsSync, realpathSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { json, writeJson } from '../../infrastructure/filesystem/atomic-json';
import { present } from '../../infrastructure/filesystem/path-safety';
import { linkTarget } from '../../infrastructure/filesystem/system-links';
import { projectPaths, type ProjectPaths } from '../workspace/consumer-paths';
import type { PackageName } from '../workspace/catalog';
import type { Entry, State } from './state-schema';
import { identity, validateState } from './state-integrity';
import { assertBins } from '../launchers/launcher-transaction';

/** Reads and validates the active switch state from .webquark/state/state.json if present. */
export function readState(root: string): State | null {
  const paths = projectPaths(root);
  if (!existsSync(paths.state)) return null;
  const state = json<State>(paths.state);
  validateState(root, state, paths);
  return state;
}

/** Atomically persists state to state.json, or unlinks it when state is null. */
export function saveState(state: State | null, paths: ProjectPaths): void {
  if (state) writeJson(paths.state, state);
  else if (existsSync(paths.state)) unlinkSync(paths.state);
}

/** Asserts that active symlinks and original backups match recorded state without external modification. */
export function assertActive(state: State): void {
  for (const entry of state.entries) {
    if (linkTarget(entry.slot) !== entry.target) {
      throw new Error(`${entry.name} was changed by another install. Refusing to overwrite it.`);
    }
    if (entry.identity && (!present(entry.backup) || identity(entry.backup) !== entry.identity)) {
      throw new Error(`Original package backup is missing or changed: ${entry.backup}`);
    }
  }
  assertBins(state);
}

/** Creates a fresh Entry descriptor for an original installed package before it is switched. */
export function originalEntry(root: string, name: PackageName, target: string): Entry {
  const slot = join(root, 'node_modules', name);
  return {
    name,
    slot,
    backup: `${slot}.wq-original-${randomUUID()}`,
    original: present(slot) ? realpathSync(slot) : '',
    identity: present(slot) ? identity(slot) : '',
    target,
  };
}
