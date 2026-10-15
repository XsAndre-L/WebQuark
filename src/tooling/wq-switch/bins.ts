import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, renameSync, statSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import cmdShim from 'cmd-shim';
import readCmdShim from 'read-cmd-shim';
import { manifest } from './config';
import { present, readState, within, type State } from './state';

type Artifact = { link: string } | { data: string; mode: number };
export interface BinEntry { file: string; original: Artifact | null; active?: Artifact | null; }
export interface BinOperation { file: string; before: Artifact | null; after: Artifact | null; }
const extensions = process.platform === 'win32' ? ['', '.cmd', '.ps1', '.exe', '.bunx'] : [''];
function validName(name: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) && !/^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(name);
}
function snapshot(file: string): Artifact | null {
  if (!present(file)) return null;
  const stat = lstatSync(file);
  if (stat.isSymbolicLink()) return { link: readlinkSync(file) };
  if (!stat.isFile()) throw new Error(`Unexpected launcher entry: ${file}`);
  return { data: readFileSync(file).toString('base64'), mode: stat.mode & 0o777 };
}
function same(a: Artifact | null, b: Artifact | null): boolean { return JSON.stringify(a) === JSON.stringify(b); }
export function activeArtifact(entry: BinEntry): Artifact | null { return entry.active === undefined ? entry.original : entry.active; }
export function validateBins(root: string, bins: BinEntry[] = []): void {
  const seen = new Set<string>();
  for (const entry of bins) {
    const name = relative(join(root, 'node_modules', '.bin'), entry.file);
    if (!validName(name) || entry.file !== join(root, 'node_modules', '.bin', name) || seen.has(entry.file.toLowerCase())) throw new Error('Invalid switch launcher path.');
    seen.add(entry.file.toLowerCase());
    for (const value of [entry.original, activeArtifact(entry)]) {
      if (value !== null && (!value || typeof value !== 'object' || ('link' in value ? typeof value.link !== 'string' : typeof value.data !== 'string' || !Number.isInteger(value.mode) || value.mode < 0 || value.mode > 0o777))) throw new Error('Invalid switch launcher artifact.');
    }
  }
}
export function assertBins(state: State): void {
  for (const entry of state.bins ?? []) {
    if (!same(snapshot(entry.file), activeArtifact(entry))) throw new Error(`Launcher changed by another install: ${entry.file}. Refusing to overwrite it.`);
  }
}
function put(file: string, value: Artifact | null): void {
  if (value === null) { if (present(file)) unlinkSync(file); return; }
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.wq-${randomUUID()}.tmp`;
  try {
    if ('link' in value) symlinkSync(value.link, temporary, 'file');
    else { writeFileSync(temporary, Buffer.from(value.data, 'base64'), { flag: 'wx' }); chmodSync(temporary, value.mode); }
    renameSync(temporary, file); // Replace the entry atomically; never write through an existing link.
  } finally { if (present(temporary)) unlinkSync(temporary); }
}
export function changeBin(operation: BinOperation, rollback = false): void {
  const expected = rollback ? operation.after : operation.before;
  const desired = rollback ? operation.before : operation.after;
  const actual = snapshot(operation.file);
  if (same(actual, desired)) return;
  if (!same(actual, expected)) throw new Error(`Launcher changed during switching: ${operation.file}. Refusing to overwrite it.`);
  put(operation.file, desired);
}
export function binOperations(previous: State | null, next: State | null): BinOperation[] {
  const entries = next?.bins ?? previous?.bins ?? [];
  return entries.map(entry => ({ file: entry.file, before: previous?.bins?.find(old => old.file === entry.file) ? activeArtifact(previous.bins.find(old => old.file === entry.file)!) : entry.original, after: next ? activeArtifact(entry) : entry.original }));
}
function targets(state: State, originals = false): Map<string, string> {
  const bins = new Map<string, string>();
  for (const entry of state.entries) {
    const directory = originals ? (entry.identity ? present(entry.backup) ? entry.backup : entry.slot : entry.original) : entry.target;
    if (!directory || !existsSync(join(directory, 'package.json'))) continue;
    for (const [name, path] of Object.entries(manifest(directory).bin ?? {})) {
      if (!validName(name)) throw new Error(`Invalid package binary name: ${name}`);
      const target = resolve(directory, path);
      if (!within(directory, target) || !existsSync(target) || !statSync(target).isFile()) throw new Error(`Invalid package binary target: ${target}`);
      // Core is selected first and forwards these shared commands to tooling.
      if (!bins.has(name)) bins.set(name, target);
      else if (!['wq-changelog', 'wq-switch', 'wq-setup'].includes(name) || entry.name !== '@webquark/tooling') throw new Error(`Duplicate package binary: ${name}`);
    }
  }
  return bins;
}
function owned(file: string, value: Artifact, allowed: Set<string>): boolean {
  if ('link' in value) return allowed.has(resolve(dirname(file), value.link));
  if (/\.(exe|bunx)$/i.test(file)) {
    const companion = file.replace(/\.(exe|bunx)$/i, '.bunx');
    if (!existsSync(companion)) return false;
    // Bun's Windows metadata starts with the UTF-16 package-relative target.
    // Read ownership only; generate Windows launchers with npm's cmd-shim.
    const path = readFileSync(companion).toString('utf16le').match(/^([^"\0]+)"\0/)?.[1];
    return !!path && allowed.has(resolve(dirname(file), '..', path));
  }
  try { return allowed.has(resolve(dirname(file), readCmdShim.sync(file))); } catch { return false; }
}
/** Prepare all artifacts without touching the active package slots or .bin directory. */
export async function stageBins(root: string, next: State): Promise<void> {
  const previous = readState(root);
  if (previous) assertBins(previous);
  const desired = targets(next), original = targets(previous ?? next, true);
  const old = new Map((previous?.bins ?? []).map(entry => [entry.file, entry]));
  const names = new Set([...desired.keys(), ...original.keys()]);
  const staging = join(next.generation, 'node_modules', '.bin');
  mkdirSync(staging, { recursive: true });
  for (const [name, target] of desired) {
    const file = join(staging, name);
    if (process.platform === 'win32') await cmdShim(target, file);
    else { chmodSync(target, lstatSync(target).mode | 0o111); if (present(file)) unlinkSync(file); symlinkSync(relative(staging, target), file, 'file'); }
  }
  const bins: BinEntry[] = [];
  for (const name of names) {
    const allowed = new Set<string>();
    for (const entry of next.entries) {
      for (const directory of [entry.slot, entry.target, entry.original, entry.backup]) {
        if (!directory || !existsSync(join(directory, 'package.json'))) continue;
        const path = manifest(directory).bin?.[name];
        if (path) { allowed.add(resolve(directory, path)); allowed.add(resolve(entry.slot, path)); }
      }
    }
    const desiredTarget = desired.get(name);
    const stableTarget = desiredTarget && resolve(root, 'node_modules', relative(join(next.generation, 'node_modules'), desiredTarget));
    const runtime = desiredTarget && readFileSync(desiredTarget, 'utf8').match(/^#!\/usr\/bin\/env[ \t]+(node|bun)[ \t]*(?:\r?\n|$)/)?.[1];
    const retainBun = process.platform === 'win32' && stableTarget && ['.exe', '.bunx'].every(extension => {
      const file = join(root, 'node_modules', '.bin', name + extension);
      const value = snapshot(file);
      return value !== null && owned(file, value, new Set([stableTarget]));
    }) && runtime && readFileSync(join(root, 'node_modules', '.bin', name + '.bunx')).toString('utf16le').includes(`"\0${runtime} `);
    const running = process.argv[1] && existsSync(process.argv[1]) ? realpathSync(process.argv[1]) : '';
    if (process.platform === 'win32' && !retainBun && present(join(root, 'node_modules', '.bin', name + '.exe')) &&
        [...allowed].some(target => existsSync(target) && realpathSync(target) === running)) {
      throw new Error(`The currently running Windows launcher would change: ${name}. Run the checkout's packages/tooling/dist/wq-switch/index.cjs with node and retry.`);
    }
    for (const extension of extensions) {
      const file = join(root, 'node_modules', '.bin', name + extension), current = snapshot(file);
      const saved = old.get(file);
      if (!saved && current && !owned(file, current, allowed)) throw new Error(`Foreign launcher collision: ${file}. Refusing to overwrite it.`);
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
