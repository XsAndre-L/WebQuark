import { cpSync, existsSync, mkdirSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { localDependencies, manifest, names, packageDirectories, selectedPackages, type PackageName } from './config';
import { assertActive, link, originalEntry, readState, within, type State } from './state';
import { projectPaths } from './paths';

export function installed(name: string, from: string): string {
  const require = createRequire(join(from, 'package.json'));
  for (const directory of require.resolve.paths(name) ?? []) {
    const candidate = join(directory, name);
    if (existsSync(join(candidate, 'package.json')) && manifest(candidate).name === name) return realpathSync(candidate);
  }
  throw new Error(`Cannot resolve ${name} from ${from}. Install the consumer dependencies first.`);
}
export function installedWebQuark(name: PackageName, root: string): string {
  try { return installed(name, root); }
  catch (error) {
    for (const owner of names.filter(candidate => localDependencies[candidate].includes(name))) {
      try { return installed(name, installed(owner, root)); } catch { /* Try another owning package. */ }
    }
    throw error;
  }
}
export function validatePackage(directory: string): void {
  const pkg = manifest(directory);
  const entries = [pkg.main, pkg.module, pkg.types, ...Object.values(pkg.bin ?? {})].filter((value): value is string => !!value);
  function visit(value: unknown): void {
    if (typeof value === 'string' && value.startsWith('./') && !value.includes('*')) entries.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  }
  visit(pkg.exports);
  for (const entry of entries) {
    const file = resolve(directory, entry);
    if (!within(directory, file) || !existsSync(file) || !statSync(file).isFile()) throw new Error(`Missing or invalid build output: ${file}`);
  }
  if (pkg.name === '@webquark/core' && !pkg.bin?.['wq-switch']) throw new Error('Local WebQuark must include the wq-switch CLI. Update the checkout first.');
}
export function stage(root: string, source: string): State {
  const selected = selectedPackages(root);
  const previous = readState(root);
  if (previous) {
    assertActive(previous);
    if (previous.source !== source || previous.entries.map(e => e.name).join() !== selected.join()) throw new Error('Source or selected dependencies changed. Run wq-switch npm before switching again.');
  }
  const generation = join(projectPaths(root).packages, randomUUID());
  const targets = new Map<PackageName, string>();
  for (const name of selected) {
    const directory = join(source, packageDirectories[name]);
    const pkg = manifest(directory);
    if (pkg.name !== name || pkg.private) throw new Error(`Invalid local package identity: ${directory}`);
    for (const dependency of localDependencies[name]) {
      if (pkg.dependencies?.[dependency] !== pkg.version || manifest(join(source, packageDirectories[dependency])).version !== pkg.version) {
        throw new Error(`${name} must depend on the same local version of ${dependency}.`);
      }
    }
    validatePackage(directory);
    const target = join(generation, 'node_modules', name);
    mkdirSync(target, { recursive: true });
    cpSync(join(directory, 'package.json'), join(target, 'package.json'));
    // Stage only published artifacts, never the checkout's node_modules.
    for (const file of manifest(directory).files ?? []) {
      if (/[*?]/.test(file)) throw new Error(`Unsupported package files glob: ${file}`);
      const from = resolve(directory, file), to = resolve(target, file);
      if (!within(directory, from) || !within(target, to)) throw new Error('Package file escapes package root.');
      if (existsSync(from)) cpSync(from, to, { recursive: true, dereference: true });
    }
    validatePackage(target);
    targets.set(name, target);
  }
  // Transitive packages may live under an installed umbrella or wrapper rather than
  // a top-level consumer slot. Preserve that graph while adding removable shadows.
  const originals = new Map<PackageName, string>();
  for (const name of selected) {
    const saved = previous?.entries.find(e => e.name === name);
    if (saved) {
      originals.set(name, saved.identity ? realpathSync(saved.backup) : saved.original);
      continue;
    }
    try { originals.set(name, installed(name, root)); } catch { /* Try nested packages below. */ }
  }
  for (const name of selected) {
    if (originals.has(name)) continue;
    for (const from of originals.values()) {
      if (!from) continue;
      try { originals.set(name, installed(name, from)); break; } catch { /* Another installed package may own it. */ }
    }
  }
  const entries = selected.map(name => {
    const old = previous?.entries.find(entry => entry.name === name);
    if (old) return { ...old, target: targets.get(name)! };
    const entry = originalEntry(root, name, targets.get(name)!);
    if (!entry.original) entry.original = originals.get(name) ?? '';
    return entry;
  });
  for (const name of selected) {
    const target = targets.get(name)!;
    const pkg = manifest(target);
    // An extracted package can be absent from an older installed umbrella.
    // Its external dependencies still belong to that saved owner's graph.
    const original = originals.get(name) || names
      .filter(owner => localDependencies[owner].includes(name))
      .map(owner => originals.get(owner))
      .find((owner): owner is string => !!owner) || root;
    const peers = pkg.peerDependencies ?? {};
    const dependencies = { ...pkg.dependencies, ...peers };
    for (const dependency of Object.keys(dependencies)) {
      let resolved = targets.get(dependency as PackageName);
      if (!resolved) {
        if (names.includes(dependency as PackageName)) throw new Error(`Unexpected local WebQuark dependency: ${name} -> ${dependency}.`);
        try {
          // Framework peers come from the app, runtime dependencies from its installed package graph.
          resolved = installed(dependency, dependency in peers ? root : original);
        } catch (error) {
          if (pkg.peerDependenciesMeta?.[dependency]?.optional) continue;
          throw error;
        }
      }
      // A physical installed owner moves to its backup during activation.
      // Keep links into that nested runtime graph valid across the move.
      const owner = entries.find(entry => entry.identity && within(entry.slot, resolved!));
      if (owner) resolved = join(owner.backup, relative(owner.slot, resolved));
      link(resolved, join(target, 'node_modules', dependency));
    }
    for (const peer of ['react', 'react-dom', '@angular/core', '@angular/common', '@angular/forms', 'rxjs']) {
      if (peer in peers && installed(peer, target) !== installed(peer, root)) throw new Error(`Duplicate framework resolution: ${peer}`);
    }
    for (const dependency of localDependencies[name]) {
      if (installed(dependency, target) !== targets.get(dependency)) throw new Error(`${name} resolves a different local ${dependency}.`);
    }
  }
  for (const entry of entries) {
    if (previous?.entries.some(saved => saved.name === entry.name) || entry.identity || !entry.original) continue;
    // Renaming a physical umbrella also moves nested original dependencies.
    // Store their eventual backup location, so refreshing never resolves them
    // through the newly activated umbrella's node_modules.
    const owner = entries.find(candidate => candidate.identity && within(candidate.slot, entry.original));
    if (owner) entry.original = join(owner.backup, relative(owner.slot, entry.original));
  }
  return { version: 1, source, generation, entries };
}
