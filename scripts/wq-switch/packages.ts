import { cpSync, existsSync, mkdirSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { manifest, selectedPackages, type PackageName } from './config';
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
export function validatePackage(directory: string): void {
  const pkg = manifest(directory);
  for (const entry of [pkg.main, pkg.module, pkg.types, ...Object.values(pkg.bin ?? {})].filter((value): value is string => !!value)) {
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
    const directory = name === '@webquark/core' ? source : join(source, 'packages', name.split('/')[1]);
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
  for (const name of selected) {
    const target = targets.get(name)!;
    const pkg = manifest(target);
    const saved = previous?.entries.find(e => e.name === name);
    const original = saved ? saved.identity ? realpathSync(saved.backup) : saved.original : installed(name, root);
    const peers = pkg.peerDependencies ?? {};
    const dependencies = { ...pkg.dependencies, ...peers };
    for (const dependency of Object.keys(dependencies)) {
      let resolved = targets.get(dependency as PackageName);
      if (!resolved) {
        try {
          // Framework peers come from the app, runtime dependencies from its installed package graph.
          resolved = installed(dependency, dependency in peers ? root : original);
        } catch (error) {
          if (pkg.peerDependenciesMeta?.[dependency]?.optional) continue;
          throw error;
        }
      }
      link(resolved, join(target, 'node_modules', dependency));
    }
    for (const peer of ['react', 'react-dom', '@angular/core', '@angular/common', '@angular/forms', 'rxjs']) {
      if (peer in peers && installed(peer, target) !== installed(peer, root)) throw new Error(`Duplicate framework resolution: ${peer}`);
    }
    if (name !== '@webquark/core' && installed('@webquark/core', target) !== targets.get('@webquark/core')) throw new Error('Wrapper resolves a different WebQuark core.');
  }
  const entries = selected.map(name => {
    const old = previous?.entries.find(entry => entry.name === name);
    if (old) return { ...old, target: targets.get(name)! };
    const entry = originalEntry(root, name, targets.get(name)!);
    if (!entry.original) entry.original = installed(name, root);
    return entry;
  });
  return { version: 1, source, generation, entries };
}
