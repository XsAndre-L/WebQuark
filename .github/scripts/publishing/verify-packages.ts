import { resolve } from 'node:path';
import {
  assertFile,
  assertLockstepPackages,
  assertPackageContract,
  capture,
  hasFlag,
  npmCommand,
  packages,
  readPackage,
  repositoryRoot,
  run,
  type PackageDefinition,
} from './release-utils';

function assertNoLocalDependencies(value: unknown, context: string): void {
  if (!value || typeof value !== 'object') {
    return;
  }

  for (const [name, version] of Object.entries(value)) {
    if (typeof version === 'string' && version.startsWith('file:')) {
      throw new Error(context + ' contains a local-only dependency: ' + name + '=' + version);
    }
  }
}

function entryPaths(manifest: Record<string, any>): string[] {
  const entries = new Set<string>();
  for (const field of ['main', 'module', 'types']) {
    if (typeof manifest[field] === 'string') {
      entries.add(manifest[field]);
    }
  }

  function visit(value: unknown): void {
    if (typeof value === 'string' && value.startsWith('./') && !value.includes('*')) {
      entries.add(value.slice(2));
    } else if (value && typeof value === 'object') {
      for (const nested of Object.values(value)) {
        visit(nested);
      }
    }
  }

  visit(manifest.exports);
  for (const entry of Object.values(manifest.bin ?? {})) {
    if (typeof entry === 'string') entries.add(entry.replace(/^\.\//, ''));
  }
  return [...entries];
}

function verifyManifest(definition: PackageDefinition, version: string): void {
  const directory = definition.directory;
  const manifest = readPackage(directory);
  assertNoLocalDependencies(manifest.dependencies, manifest.name + ' dependencies');
  assertNoLocalDependencies(manifest.devDependencies, manifest.name + ' devDependencies');

  assertPackageContract(definition, manifest, version);
  assertNoLocalDependencies(manifest.peerDependencies, manifest.name + ' peerDependencies');
  if (definition.role === 'browser' && manifest.exports?.['./native-content.css'] !== './dist/webquark/native-content.css') {
    throw new Error('@webquark/browser must export ./native-content.css to ./dist/webquark/native-content.css');
  }
  if (definition.role === 'umbrella' && (!manifest.exports?.['./browser'] || !manifest.exports?.['./tooling/changelog'] || !manifest.bin?.['wq-changelog'])) {
    throw new Error('@webquark/core must forward browser and tooling/changelog entries and the wq-changelog command');
  }

  for (const entry of entryPaths(manifest)) {
    assertFile(resolve(directory, entry), manifest.name + ' package entry ' + entry);
  }
}

function verifyTarball(directory: string): void {
  const result = capture([npmCommand, 'pack', '--dry-run', '--json'], directory);
  if (result.exitCode !== 0) {
    throw new Error('npm pack failed in ' + directory + ':\n' + result.stderr);
  }

  const [summary] = JSON.parse(result.stdout) as Array<{
    name: string;
    version: string;
    unpackedSize: number;
    files: Array<{ path: string }>;
  }>;
  if (!summary) {
    throw new Error('npm pack returned no package summary for ' + directory);
  }

  for (const entry of entryPaths(readPackage(directory))) {
    if (!summary.files.some(file => file.path === entry.replace(/^\.\//, ''))) {
      throw new Error('Packed package entry missing: ' + entry);
    }
  }

  const sourceFiles = summary.files.filter((file) => file.path.startsWith('src/'));
  if (directory !== repositoryRoot && sourceFiles.length > 0) {
    throw new Error(summary.name + ' would publish source files outside its dist folder');
  }

  console.log(
    summary.name + '@' + summary.version + ': ' +
    summary.files.length + ' files, ' + summary.unpackedSize + ' bytes unpacked',
  );
}

console.log('Checking component prop ordering...');
run(['bun', 'run', 'check:prop-order']);

console.log('\nBuilding core, browser, tooling, React, and Angular packages...');
run(['bun', 'run', 'packages:build']);

console.log('\nVerifying packed Angular 21 and Angular 22 consumers...');
const angularPackage = packages.find((definition) => definition.key === 'angular');
if (!angularPackage) {
  throw new Error('The Angular package definition is missing');
}
run(['bun', 'run', 'verify:compatibility'], angularPackage.directory);

if (!hasFlag('--reuse-dev-tests')) {
  run(['bun', 'test', 'src/tooling/formatter/update.test.ts']);
  run(['bun', 'scripts/verify-formatter-consumer.ts']);
  console.log('\nRunning the Vitest suite...');
  run(['bunx', 'vitest', 'run']);
}

console.log('\nChecking package manifests and npm tarballs...');
if (!readPackage(repositoryRoot).private) throw new Error('The repository orchestration manifest must be private.');
const version = assertLockstepPackages(packages.map(definition => readPackage(definition.directory)));
for (const definition of packages) {
  verifyManifest(definition, version);
  verifyTarball(definition.directory);
}

console.log('\nAll WebQuark packages are ready to be packed.');
