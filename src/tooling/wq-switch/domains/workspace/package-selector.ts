import { manifest } from './manifest';
import { localDependencies, names, type PackageName } from './catalog';

/** Calculates the full transitive closure of WebQuark packages required by the consumer application. */
export function selectedPackages(root: string): PackageName[] {
  const pkg = manifest(root);
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  const selected = new Set<PackageName>(names.filter(name => dependencies[name]));
  if (!selected.size) throw new Error('The consuming project must declare a WebQuark package.');
  for (const name of selected) {
    for (const dependency of localDependencies[name]) {
      selected.add(dependency);
    }
  }
  return names.filter(name => selected.has(name));
}
