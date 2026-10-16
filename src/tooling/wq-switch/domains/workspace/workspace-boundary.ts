import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, posix, relative } from 'node:path';
import { manifest } from './manifest';

/** Extracts and validates positive relative workspace glob patterns from package.json. */
export function workspacePatterns(root: string): string[] | undefined {
  const value = manifest(root).workspaces;
  if (value === undefined) return undefined;
  const patterns = Array.isArray(value) ? value : value?.packages;
  if (
    !Array.isArray(patterns) ||
    patterns.some(
      pattern => typeof pattern !== 'string' || !pattern || isAbsolute(pattern) || pattern.startsWith('!') || pattern.split(/[\\/]/).includes('..'),
    )
  ) {
    throw new Error(`Invalid or unsupported workspaces in ${join(root, 'package.json')}; use relative positive workspace patterns.`);
  }
  return patterns.map(pattern => pattern.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, ''));
}

/** Resolves the owning monorepo root directory for a consumer by walking up ancestors until a boundary is found. */
export function workspaceRoot(root: string): string {
  // A workspace root owns its own config, even if nested in another workspace.
  if (workspacePatterns(root)) return root;
  for (let directory = dirname(root); ; directory = dirname(directory)) {
    if (existsSync(join(directory, 'package.json'))) {
      const patterns = workspacePatterns(directory);
      if (patterns) {
        const member = relative(directory, root).replaceAll('\\', '/');
        return patterns.some(pattern => posix.matchesGlob(member, pattern)) ? directory : root;
      }
    }
    if (dirname(directory) === directory) return root;
  }
}
