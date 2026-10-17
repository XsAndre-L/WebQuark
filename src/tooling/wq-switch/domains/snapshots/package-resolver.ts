import { existsSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { localDependencies, manifest, names, type PackageName } from '../workspace';

/** Resolves an installed package directory starting from a consumer or parent package path. */
export function installed(name: string, from: string): string {
  const require = createRequire(join(from, 'package.json'));
  for (const directory of require.resolve.paths(name) ?? []) {
    const candidate = join(directory, name);
    if (existsSync(join(candidate, 'package.json')) && manifest(candidate).name === name) {
      return realpathSync(candidate);
    }
  }
  throw new Error(`Cannot resolve ${name} from ${from}. Install the consumer dependencies first.`);
}

/** Resolves a WebQuark package, falling back to inspecting owning umbrella packages if hoisted or nested. */
export function installedWebQuark(name: PackageName, root: string): string {
  try {
    return installed(name, root);
  } catch (error) {
    for (const owner of names.filter(candidate => localDependencies[candidate].includes(name))) {
      try {
        return installed(name, installed(owner, root));
      } catch {
        /* Try another owning package. */
      }
    }
    throw error;
  }
}
