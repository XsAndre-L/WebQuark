import { existsSync, unlinkSync } from 'node:fs';
import { projectPaths, type ProjectPaths } from '../workspace/consumer-paths';
import { json, writeJson } from '../../infrastructure/filesystem/atomic-json';
import type { Journal } from './journal-schema';
import { validateJournal } from './state-integrity';

/** Returns true if an uncommitted recovery journal is present on disk. */
export function hasJournal(root: string): boolean {
  return existsSync(projectPaths(root).journal);
}

/** Reads and validates the recovery journal from .webquark/state/journal.json. */
export function readJournal(root: string): Journal | null {
  const paths = projectPaths(root);
  if (!existsSync(paths.journal)) return null;
  const journal = json<Journal>(paths.journal);
  validateJournal(root, journal, paths);
  return journal;
}

/** Writes the recovery journal atomically to disk before modifying package connections. */
export function writeJournal(paths: ProjectPaths, journal: Journal): void {
  writeJson(paths.journal, journal);
}

/** Removes the recovery journal after a transaction has committed or recovered. */
export function clearJournal(paths: ProjectPaths): void {
  if (existsSync(paths.journal)) unlinkSync(paths.journal);
}
