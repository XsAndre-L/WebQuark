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
  for (const entry of Object.values(manifest.bin ?? {})) {
    if (typeof entry === 'string') entries.add(entry.replace(/^\.\//, ''));
  }
  return [...entries];
}

function verifyManifest(directory: string, coreVersion: string): void {
  const manifest = readPackage(directory);
  assertNoLocalDependencies(manifest.dependencies, manifest.name + ' dependencies');
  assertNoLocalDependencies(manifest.devDependencies, manifest.name + ' devDependencies');

  if (manifest.version !== coreVersion) {
    throw new Error(
      manifest.name + ' version ' + manifest.version +
      ' does not match @webquark/core@' + coreVersion,
    );
  }

  const runtimeCoreVersion = manifest.dependencies?.['@webquark/core'];
  if (runtimeCoreVersion !== undefined) {
    const peerCoreVersion = manifest.peerDependencies?.['@webquark/core'];
    if (runtimeCoreVersion !== coreVersion || peerCoreVersion !== coreVersion) {
      throw new Error(
        manifest.name + ' must depend on and peer @webquark/core@' + coreVersion +
        ' after release preparation',
      );
    }
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

  for (const entry of Object.values(readPackage(directory).bin ?? {})) {
    if (typeof entry === 'string' && !summary.files.some(file => file.path === entry.replace(/^\.\//, ''))) {
      throw new Error('Packed executable missing: ' + entry);
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

console.log('Building core, React, and Angular packages...');
run(['bun', 'run', 'build']);
for (const definition of packages.slice(1)) {
  run(['bun', 'run', 'build'], definition.directory);
}

console.log('\nVerifying packed Angular 21 and Angular 22 consumers...');
const angularPackage = packages.find((definition) => definition.key === 'angular');
if (!angularPackage) {
  throw new Error('The Angular package definition is missing');
}
run(['bun', 'run', 'verify:compatibility'], angularPackage.directory);

console.log('\nRunning the Vitest suite...');
run(['bunx', 'vitest', 'run']);

console.log('\nChecking package manifests and npm tarballs...');
const coreVersion = readPackage(repositoryRoot).version;
for (const definition of packages) {
  verifyManifest(definition.directory, coreVersion);
  verifyTarball(definition.directory);
}

console.log('\nAll WebQuark packages are ready to be packed.');
