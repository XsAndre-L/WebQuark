import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, rmdirSync, statSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { json, names, writeJson, type PackageName } from './config';
import { projectPaths, type ProjectPaths } from './paths';
import { assertBins, binOperations, changeBin, validateBins, type BinEntry, type BinOperation } from './bins';

export interface Entry { name: PackageName; slot: string; backup: string; original: string; identity: string; target: string; }
function identity(file: string): string { const stat = statSync(file); return `${stat.dev}:${stat.ino}`; }
export interface State { version: 1; source: string; generation: string; entries: Entry[]; bins?: BinEntry[]; }
interface Operation { slot: string; before: string | null; after: string | null; move?: string; }
interface Journal { previous: State | null; next: State | null; operations: Operation[]; bins?: BinOperation[]; }
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
function validateState(root: string, state: State, paths: ProjectPaths): void {
  if (state.version !== 1 || !Array.isArray(state.entries)) throw new Error('Unsupported switch state.');
  if (!within(paths.packages, state.generation)) throw new Error('Invalid switch generation path; refusing filesystem changes.');
  for (const entry of state.entries) {
    if (!names.includes(entry.name) || entry.slot !== join(root, 'node_modules', entry.name) ||
        dirname(entry.backup) !== dirname(entry.slot) || !entry.backup.startsWith(entry.slot + '.wq-original-') ||
        !within(state.generation, entry.target)) throw new Error('Invalid switch state paths; refusing filesystem changes.');
  }
  validateBins(root, state.bins);
}
export function readState(root: string): State | null {
  const paths = projectPaths(root);
  if (!existsSync(paths.state)) return null;
  const state = json<State>(paths.state); validateState(root, state, paths); return state;
}
function saveState(state: State | null, paths: ProjectPaths): void {
  if (state) writeJson(paths.state, state);
  else if (existsSync(paths.state)) unlinkSync(paths.state);
}
export function assertActive(state: State): void {
  for (const entry of state.entries) {
    if (linkTarget(entry.slot) !== entry.target) throw new Error(`${entry.name} was changed by another install. Refusing to overwrite it.`);
    if (entry.identity && (!present(entry.backup) || identity(entry.backup) !== entry.identity)) throw new Error(`Original package backup is missing or changed: ${entry.backup}`);
  }
  assertBins(state);
}
export function hasJournal(root: string): boolean { return existsSync(projectPaths(root).journal); }

function snapshotDirectory(root: string): string {
  const paths = projectPaths(root);
  for (const directory of [paths.directory, dirname(paths.packages), paths.packages]) {
    if (present(directory) && (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink())) {
      throw new Error(`Snapshot directory is not a physical directory: ${directory}`);
    }
  }
  return paths.packages;
}
function protectedGenerations(root: string): Set<string> {
  const protectedPaths = new Set<string>();
  const active = readState(root);
  if (active) { assertActive(active); protectedPaths.add(active.generation); }
  const paths = projectPaths(root);
  if (hasJournal(root)) {
    const journal = json<Journal>(paths.journal); validateJournal(root, journal, paths);
    for (const state of [journal.previous, journal.next]) if (state) protectedPaths.add(state.generation);
  }
  return protectedPaths;
}
/** Remove links themselves, never the installed dependency directories they reference. */
function removeSnapshotTree(directory: string): void {
  const stat = lstatSync(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) { unlinkSync(directory); return; }
  for (const child of readdirSync(directory)) removeSnapshotTree(join(directory, child));
  rmdirSync(directory);
}
export function discardSnapshot(root: string, generation: string): void {
  const directory = snapshotDirectory(root);
  if (dirname(generation) !== directory) throw new Error('Invalid snapshot path; refusing cleanup.');
  if (protectedGenerations(root).has(generation)) throw new Error(`Snapshot is still needed by active state or recovery: ${generation}`);
  if (present(generation)) removeSnapshotTree(generation);
}
/** Called under the consumer lock, after a transaction has committed or recovered. */
export function pruneSnapshots(root: string): void {
  const directory = snapshotDirectory(root);
  if (!present(directory)) return;
  const keep = protectedGenerations(root);
  const snapshots = readdirSync(directory).map(name => {
    const path = join(directory, name), stat = lstatSync(path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Unexpected snapshot entry; refusing cleanup: ${path}`);
    // Deleting children changes mtime even when deletion later fails. Birthtime
    // keeps an older, partially removed generation older on the next retry.
    return { path, created: stat.birthtimeMs };
  }).sort((a, b) => b.created - a.created || b.path.localeCompare(a.path));
  if (keep.size > 2) throw new Error('More than two snapshots are required for recovery; recover before cleanup.');
  for (const snapshot of snapshots) if (keep.size < 2) keep.add(snapshot.path);
  for (const snapshot of [...snapshots].reverse()) {
    if (keep.has(snapshot.path)) continue;
    try { removeSnapshotTree(snapshot.path); }
    catch (error) { throw new Error(`Snapshot cleanup failed: ${snapshot.path}. Active connections are unchanged; retry the command to enforce the two-snapshot limit.`, { cause: error }); }
  }
}
function removeExpectedLink(slot: string, expected: string): void {
  if (linkTarget(slot) !== expected) throw new Error(`Package connection changed: ${slot}`);
  unlinkSync(slot); // Never recurse into a package, junction, or shared package store.
}
function validateJournal(root: string, journal: Journal, paths: ProjectPaths): void {
  if (journal.previous) validateState(root, journal.previous, paths);
  if (journal.next) validateState(root, journal.next, paths);
  const entries = [...(journal.previous?.entries ?? []), ...(journal.next?.entries ?? [])];
  for (const op of journal.operations) {
    const matching = entries.filter(entry => entry.slot === op.slot);
    if (!matching.length || (op.move && !matching.some(entry => entry.backup === op.move)) ||
        [op.before, op.after].some(target => target !== null && !matching.some(entry => entry.target === target))) throw new Error('Invalid recovery journal.');
  }
  if (JSON.stringify(journal.bins ?? []) !== JSON.stringify(binOperations(journal.previous, journal.next))) throw new Error('Invalid launcher recovery journal.');
}
export function recover(root: string): void {
  const paths = projectPaths(root);
  if (!existsSync(paths.journal)) return;
  const journal = json<Journal>(paths.journal); validateJournal(root, journal, paths);
  for (const operation of [...(journal.bins ?? [])].reverse()) changeBin(operation, true);
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
  saveState(journal.previous, paths);
  unlinkSync(paths.journal);
  if (journal.next && journal.next.generation !== journal.previous?.generation) discardSnapshot(root, journal.next.generation);
  pruneSnapshots(root);
}
export function activate(root: string, next: State): void {
  const paths = projectPaths(root);
  validateState(root, next, paths);
  const previous = readState(root);
  if (previous) assertActive(previous);
  const operations: Operation[] = next.entries.map(entry => {
    const old = previous?.entries.find(old => old.name === entry.name);
    if (!old && (present(entry.backup) || (entry.identity ? !present(entry.slot) || identity(entry.slot) !== entry.identity : present(entry.slot)))) throw new Error(`Original connection changed: ${entry.name}`);
    return { slot: entry.slot, before: old?.target ?? null, after: entry.target, ...(old ? {} : { move: entry.backup }) };
  });
  const bins = binOperations(previous, next);
  writeJson(paths.journal, { previous, next, operations, bins });
  try {
    for (const op of operations) {
      if (op.move) { if (present(op.slot)) renameSync(op.slot, op.move); }
      else removeExpectedLink(op.slot, op.before!);
      link(op.after!, op.slot);
    }
    for (const operation of bins) changeBin(operation);
    saveState(next, paths); unlinkSync(paths.journal);
  } catch (error) { recover(root); throw error; }
  pruneSnapshots(root);
}
export function restore(root: string): void {
  const paths = projectPaths(root);
  const previous = readState(root); if (!previous) { pruneSnapshots(root); return; }
  assertActive(previous);
  const operations = previous.entries.map(entry => ({ slot: entry.slot, before: entry.target, after: null }));
  const bins = binOperations(previous, null);
  writeJson(paths.journal, { previous, next: null, operations, bins });
  try {
    for (const entry of previous.entries) { removeExpectedLink(entry.slot, entry.target); if (entry.identity) renameSync(entry.backup, entry.slot); }
    for (const operation of bins) changeBin(operation);
    saveState(null, paths); unlinkSync(paths.journal);
  } catch (error) { recover(root); throw error; }
  pruneSnapshots(root);
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
