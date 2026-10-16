import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, statSync, symlinkSync, unlinkSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import cmdShim from 'cmd-shim';
import { manifest } from '../workspace/manifest';
import { present, within } from '../../infrastructure/filesystem/path-safety';
import { readState } from '../transactions/state-store';
import { activeArtifact, same, snapshot, validName } from './artifact-snapshot';
import { assertBins, validateBins } from './launcher-transaction';
import { owned } from './runtime-detector';
import type { BinEntry } from './launcher-schema';
import type { State } from '../transactions/state-schema';

const extensions = process.platform === 'win32' ? ['', '.cmd', '.ps1', '.exe', '.bunx'] : [''];

/** Discovers binary targets mapped by package manifests across active or original states. */
export function targets(state: State, originals = false): Map<string, string> {
  const bins = new Map<string, string>();
  for (const entry of state.entries) {
    const directory = originals ? (entry.identity ? (present(entry.backup) ? entry.backup : entry.slot) : entry.original) : entry.target;
    if (!directory || !existsSync(join(directory, 'package.json'))) continue;
    for (const [name, path] of Object.entries(manifest(directory).bin ?? {})) {
      if (!validName(name)) throw new Error(`Invalid package binary name: ${name}`);
      const target = resolve(directory, path);
      if (!within(directory, target) || !existsSync(target) || !statSync(target).isFile()) {
        throw new Error(`Invalid package binary target: ${target}`);
      }
      // Core is selected first and forwards these shared commands to tooling.
      if (!bins.has(name)) bins.set(name, target);
      else if (!['wq-changelog', 'wq-switch', 'wq-setup'].includes(name) || entry.name !== '@webquark/tooling') {
        throw new Error(`Duplicate package binary: ${name}`);
      }
    }
  }
  return bins;
}

/** Prepares all launcher artifacts in snapshot staging without mutating active .bin files. */
export async function stageBins(root: string, next: State): Promise<void> {
  const previous = readState(root);
  if (previous) assertBins(previous);
  const desired = targets(next),
    original = targets(previous ?? next, true);
  const old = new Map((previous?.bins ?? []).map(entry => [entry.file, entry]));
  const names = new Set([...desired.keys(), ...original.keys()]);
  const staging = join(next.generation, 'node_modules', '.bin');
  mkdirSync(staging, { recursive: true });

  for (const [name, target] of desired) {
    const file = join(staging, name);
    if (process.platform === 'win32') {
      await cmdShim(target, file);
    } else {
      chmodSync(target, lstatSync(target).mode | 0o111);
      if (present(file)) unlinkSync(file);
      symlinkSync(relative(staging, target), file, 'file');
    }
  }

  const bins: BinEntry[] = [];
  for (const name of names) {
    const allowed = new Set<string>();
    for (const entry of next.entries) {
      for (const directory of [entry.slot, entry.target, entry.original, entry.backup]) {
        if (!directory || !existsSync(join(directory, 'package.json'))) continue;
        const path = manifest(directory).bin?.[name];
        if (path) {
          allowed.add(resolve(directory, path));
          allowed.add(resolve(entry.slot, path));
        }
      }
    }
    const desiredTarget = desired.get(name);
    const stableTarget = desiredTarget && resolve(root, 'node_modules', relative(join(next.generation, 'node_modules'), desiredTarget));
    const runtime = desiredTarget && readFileSync(desiredTarget, 'utf8').match(/^#!\/usr\/bin\/env[ \t]+(node|bun)[ \t]*(?:\r?\n|$)/)?.[1];
    const retainBun =
      process.platform === 'win32' &&
      stableTarget &&
      ['.exe', '.bunx'].every(extension => {
        const file = join(root, 'node_modules', '.bin', name + extension);
        const value = snapshot(file);
        return value !== null && owned(file, value, new Set([stableTarget]));
      }) &&
      runtime &&
      readFileSync(join(root, 'node_modules', '.bin', name + '.bunx'))
        .toString('utf16le')
        .includes(`"\0${runtime} `);
    const running = process.argv[1] && existsSync(process.argv[1]) ? realpathSync(process.argv[1]) : '';
    if (
      process.platform === 'win32' &&
      !retainBun &&
      present(join(root, 'node_modules', '.bin', name + '.exe')) &&
      [...allowed].some(target => existsSync(target) && realpathSync(target) === running)
    ) {
      throw new Error(`The currently running Windows launcher would change: ${name}. Run the checkout's packages/tooling/dist/wq-switch/index.cjs with node and retry.`);
    }
    for (const extension of extensions) {
      const file = join(root, 'node_modules', '.bin', name + extension),
        current = snapshot(file);
      const saved = old.get(file);
      if (!saved && current && !owned(file, current, allowed)) {
        throw new Error(`Foreign launcher collision: ${file}. Refusing to overwrite it.`);
      }
      const active = retainBun && ['.exe', '.bunx'].includes(extension) ? current : snapshot(join(staging, name + extension));
      const baseline = saved ? saved.original : current;
      bins.push({ file, original: baseline, ...(!same(active, baseline) ? { active } : {}) });
      old.delete(file);
    }
  }
  // A binary introduced by an earlier snapshot may have been removed from source.
  for (const saved of old.values()) bins.push({ ...saved, active: null });
  next.bins = bins;
  validateBins(root, bins);
}
