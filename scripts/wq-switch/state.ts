import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, renameSync, statSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { json, names, writeJson, type PackageName } from './config';

export interface Entry { name: PackageName; slot: string; backup: string; original: string; identity: string; target: string; }
function identity(file: string): string { const stat = statSync(file); return `${stat.dev}:${stat.ino}`; }
export interface State { version: 1; source: string; generation: string; entries: Entry[]; }
interface Operation { slot: string; before: string | null; after: string | null; move?: string; }
interface Journal { previous: State | null; next: State | null; operations: Operation[]; }
export const home = (root: string) => join(root, '.wq-switch');
const stateFile = (root: string) => join(home(root), 'state.json');
const journalFile = (root: string) => join(home(root), 'journal.json');
export function present(file: string): boolean { try { lstatSync(file); return true; } catch (error: any) { if (error.code === 'ENOENT') return false; throw error; } }
export function within(parent: string, child: string): boolean { const r = relative(parent, child); return r !== '' && !r.startsWith('..') && !isAbsolute(r); }
export function linkTarget(file: string): string | null {
  if (!present(file) || !lstatSync(file).isSymbolicLink()) return null;
  return resolve(dirname(file), readlinkSync(file));
}
export function link(target: string, file: string): void {
  mkdirSync(dirname(file), { recursive: true });
  symlinkSync(target, file, process.platform === 'win32' ? 'junction' : 'dir');
}
function validateState(root: string, state: State): void {
  if (state.version !== 1 || !Array.isArray(state.entries)) throw new Error('Unsupported switch state.');
  for (const entry of state.entries) {
    if (!names.includes(entry.name) || entry.slot !== join(root, 'node_modules', entry.name) ||
        dirname(entry.backup) !== dirname(entry.slot) || !entry.backup.startsWith(entry.slot + '.wq-original-') ||
        !within(join(home(root), 'packages'), entry.target)) throw new Error('Invalid switch state paths; refusing filesystem changes.');
  }
}
export function readState(root: string): State | null {
  if (!existsSync(stateFile(root))) return null;
  const state = json<State>(stateFile(root)); validateState(root, state); return state;
}
function saveState(root: string, state: State | null): void {
  if (state) writeJson(stateFile(root), state);
  else if (existsSync(stateFile(root))) unlinkSync(stateFile(root));
}
export function assertActive(state: State): void {
  for (const entry of state.entries) {
    if (linkTarget(entry.slot) !== entry.target) throw new Error(`${entry.name} was changed by another install. Refusing to overwrite it.`);
    if (entry.identity && (!present(entry.backup) || identity(entry.backup) !== entry.identity)) throw new Error(`Original package backup is missing or changed: ${entry.backup}`);
  }
}
export function hasJournal(root: string): boolean { return existsSync(journalFile(root)); }
function removeExpectedLink(slot: string, expected: string): void {
  if (linkTarget(slot) !== expected) throw new Error(`Package connection changed: ${slot}`);
  unlinkSync(slot); // Never recurse into a package, junction, or shared package store.
}
function validateJournal(root: string, journal: Journal): void {
  if (journal.previous) validateState(root, journal.previous);
  if (journal.next) validateState(root, journal.next);
  const entries = [...(journal.previous?.entries ?? []), ...(journal.next?.entries ?? [])];
  for (const op of journal.operations) {
    const matching = entries.filter(entry => entry.slot === op.slot);
    if (!matching.length || (op.move && !matching.some(entry => entry.backup === op.move)) ||
        [op.before, op.after].some(target => target !== null && !matching.some(entry => entry.target === target))) throw new Error('Invalid recovery journal.');
  }
}
export function recover(root: string): void {
  if (!hasJournal(root)) return;
  const journal = json<Journal>(journalFile(root)); validateJournal(root, journal);
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
      } else if (!present(op.slot) || identity(op.slot) !== entry.identity) throw new Error(`Recovery needs the original package: ${op.slot}`);
    } else if (op.after === null) {
      // Restore: move an original package back into its saved position if necessary.
      const entry = journal.previous!.entries.find(entry => entry.slot === op.slot)!;
      if (entry.identity && !present(entry.backup)) {
        if (!present(op.slot) || identity(op.slot) !== entry.identity) throw new Error(`Recovery found an unexpected package: ${op.slot}`);
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
  saveState(root, journal.previous);
  unlinkSync(journalFile(root));
}
export function activate(root: string, next: State): void {
  validateState(root, next);
  const previous = readState(root);
  if (previous) assertActive(previous);
  const operations: Operation[] = next.entries.map(entry => {
    const old = previous?.entries.find(old => old.name === entry.name);
    if (!old && (present(entry.backup) || (entry.identity ? !present(entry.slot) || identity(entry.slot) !== entry.identity : present(entry.slot)))) throw new Error(`Original connection changed: ${entry.name}`);
    return { slot: entry.slot, before: old?.target ?? null, after: entry.target, ...(old ? {} : { move: entry.backup }) };
  });
  writeJson(journalFile(root), { previous, next, operations });
  try {
    for (const op of operations) {
      if (op.move) { if (present(op.slot)) renameSync(op.slot, op.move); }
      else removeExpectedLink(op.slot, op.before!);
      link(op.after!, op.slot);
    }
    saveState(root, next); unlinkSync(journalFile(root));
  } catch (error) { recover(root); throw error; }
}
export function restore(root: string): void {
  const previous = readState(root); if (!previous) return;
  assertActive(previous);
  const operations = previous.entries.map(entry => ({ slot: entry.slot, before: entry.target, after: null }));
  writeJson(journalFile(root), { previous, next: null, operations });
  try {
    for (const entry of previous.entries) { removeExpectedLink(entry.slot, entry.target); if (entry.identity) renameSync(entry.backup, entry.slot); }
    saveState(root, null); unlinkSync(journalFile(root));
  } catch (error) { recover(root); throw error; }
}
export function originalEntry(root: string, name: PackageName, target: string): Entry {
  const slot = join(root, 'node_modules', name);
  return { name, slot, backup: `${slot}.wq-original-${randomUUID()}`, original: present(slot) ? realpathSync(slot) : '', identity: present(slot) ? identity(slot) : '', target };
}
export async function locked<T>(key: string, action: () => Promise<T>): Promise<T> {
  const file = join(tmpdir(), `wq-switch-${createHash('sha256').update(key.toLowerCase()).digest('hex')}.lock`);
  const content = JSON.stringify({ pid: process.pid, id: randomUUID() });
  try { writeFileSync(file, content, { flag: 'wx' }); }
  catch (error: any) {
    if (error.code !== 'EEXIST') throw error;
    const previous = readFileSync(file, 'utf8');
    const { pid } = JSON.parse(previous);
    let alive = true;
    try { process.kill(pid, 0); } catch (e: any) { if (e.code === 'ESRCH') alive = false; }
    if (alive) throw new Error(`Another switch/build is running (PID ${pid}).`);
    if (readFileSync(file, 'utf8') !== previous) throw new Error('Lock changed; retry.');
    unlinkSync(file); writeFileSync(file, content, { flag: 'wx' });
  }
  try { return await action(); } finally { if (existsSync(file) && readFileSync(file, 'utf8') === content) unlinkSync(file); }
}
