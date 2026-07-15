import { resolve } from 'node:path';
import {
  assertFile,
  capture,
  npmCommand,
  packages,
  readPackage,
  repositoryRoot,
  run,
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
  return [...entries];
}

function verifyManifest(directory: string): void {
  const manifest = readPackage(directory);
  assertNoLocalDependencies(manifest.dependencies, manifest.name + ' dependencies');
  assertNoLocalDependencies(manifest.devDependencies, manifest.name + ' devDependencies');

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

  const sourceFiles = summary.files.filter((file) => file.path.startsWith('src/'));
  if (directory !== repositoryRoot && sourceFiles.length > 0) {
    throw new Error(summary.name + ' would publish source files outside its dist folder');
  }

  console.log(
    summary.name + '@' + summary.version + ': ' +
    summary.files.length + ' files, ' + summary.unpackedSize + ' bytes unpacked',
  );
}

console.log('Building core, React, and Angular packages...');
run(['bun', 'run', 'build']);
for (const definition of packages.slice(1)) {
  run(['bun', 'run', 'build'], definition.directory);
}

console.log('\nRunning the Vitest suite...');
run(['bunx', 'vitest', 'run']);

console.log('\nChecking package manifests and npm tarballs...');
for (const definition of packages) {
  verifyManifest(definition.directory);
  verifyTarball(definition.directory);
}

console.log('\nAll WebQuark packages are ready to be packed.');
