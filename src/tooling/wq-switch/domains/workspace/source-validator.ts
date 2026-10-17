import { existsSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { manifest } from './manifest';
import { names, packageDirectories } from './catalog';
import { resolveSwitchConfig } from './config-reader';

/** Asserts that a directory path points to a valid, private WebQuark repository checkout. */
export function validateSource(source: string): string {
  const root = realpathSync(resolve(source));
  const pkg = manifest(root);
  if (
    !pkg.private ||
    !pkg.scripts?.['packages:build'] ||
    !names.every(name => existsSync(join(root, packageDirectories[name], 'package.json')) && manifest(join(root, packageDirectories[name])).name === name)
  ) {
    throw new Error('Source must be the private WebQuark repository root, with packages:build and all five package manifests.');
  }
  return root;
}

/** Resolves and validates the configured WebQuark source repository path for a consumer. */
export function sourceFor(root: string): string {
  const resolved = resolveSwitchConfig(root);
  if (!resolved) throw new Error('First run: wq-setup');
  const { config } = resolved;
  if (!config.source.trim()) {
    throw new Error('Set source inside "wq-switch" in .webquark/.webquark.json to your WebQuark repository, or run wq-setup --source "path/to/WebQuark".');
  }
  return validateSource(resolve(resolved.root, config.source));
}
