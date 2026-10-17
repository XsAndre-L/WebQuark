import { existsSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { manifest } from './manifest';
import { names, type PackageName } from './catalog';

/** Finds the nearest consuming project root containing a package.json, refusing execution in WebQuark monorepo. */
export function consumerRoot(cwd = process.cwd()): string {
  let root = resolve(cwd);
  while (!existsSync(join(root, 'package.json'))) {
    const parent = dirname(root);
    if (parent === root) throw new Error('Run this command inside the consuming project.');
    root = parent;
  }
  const pkg = manifest(root);
  if (names.includes(pkg.name as PackageName) || (pkg.private && pkg.scripts?.['packages:build'])) {
    throw new Error('Run wq-switch in the consuming app, not the WebQuark repository.');
  }
  return realpathSync(root);
}
