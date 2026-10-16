import { globSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { workspacePatterns } from './workspace-boundary';

/** Discovers all member package roots within a workspace boundary for cross-consumer safety checks. */
export function workspaceMembers(root: string): string[] {
  const patterns = workspacePatterns(root) ?? [];
  const files = globSync(
    patterns.map(pattern => `${pattern}/package.json`),
    {
      cwd: root,
      exclude: ['**/node_modules/**', '**/.webquark/**', '**/.git/**'],
    },
  );
  return [...new Set(files.map(file => realpathSync(dirname(resolve(root, file)))))].filter(member => {
    const path = relative(root, member);
    return path !== '' && !path.startsWith('..') && !isAbsolute(path);
  });
}
