import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import readCmdShim from 'read-cmd-shim';
import type { Artifact } from './launcher-schema';

/** Verifies whether an existing launcher in .bin belongs to WebQuark packages or a foreign dependency. */
export function owned(file: string, value: Artifact, allowed: Set<string>): boolean {
  if ('link' in value) return allowed.has(resolve(dirname(file), value.link));
  if (/\.(exe|bunx)$/i.test(file)) {
    const companion = file.replace(/\.(exe|bunx)$/i, '.bunx');
    if (!existsSync(companion)) return false;
    // Bun's Windows metadata starts with the UTF-16 package-relative target.
    // Read ownership only; generate Windows launchers with npm's cmd-shim.
    const path = readFileSync(companion).toString('utf16le').match(/^([^"\0]+)"\0/)?.[1];
    return !!path && allowed.has(resolve(dirname(file), '..', path));
  }
  try {
    return allowed.has(resolve(dirname(file), readCmdShim.sync(file)));
  } catch {
    return false;
  }
}
