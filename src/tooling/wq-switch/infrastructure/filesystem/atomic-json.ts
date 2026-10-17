import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/** Reads and parses a JSON file into type T. */
export function json<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

/** Atomically writes data as formatted JSON using a temporary file before renaming. */
export function writeJson(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
  renameSync(temporary, file);
}
