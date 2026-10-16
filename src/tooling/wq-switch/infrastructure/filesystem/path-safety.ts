import { lstatSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';

/** Checks whether a file or directory physically exists on disk without following links. */
export function present(file: string): boolean {
  try {
    lstatSync(file);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

/** Verifies that child path strictly resides inside parent directory to prevent path traversal. */
export function within(parent: string, child: string): boolean {
  const r = relative(parent, child);
  return r !== '' && !r.startsWith('..') && !isAbsolute(r);
}
