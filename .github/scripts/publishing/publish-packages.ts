import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  capture,
  hasFlag,
  npmCommand,
  packages,
  readPackage,
  requireArgument,
  run,
} from './release-utils';

type PackedPackage = {
  name: string;
  version: string;
  filename: string;
  tarballPath: string;
  integrity: string;
};

function pack(directory: string, destination: string): PackedPackage {
  const result = capture([npmCommand, 'pack', '--json', '--pack-destination', destination], directory);
  if (result.exitCode !== 0) {
    throw new Error('npm pack failed in ' + directory + ':\n' + result.stderr);
  }

  const [packed] = JSON.parse(result.stdout) as Array<{
    name: string;
    version: string;
    filename: string;
  }>;
  if (!packed) {
    throw new Error('npm pack returned no package for ' + directory);
  }

  const tarballPath = resolve(destination, packed.filename);
  const digest = createHash('sha512').update(readFileSync(tarballPath)).digest('base64');
  return { ...packed, tarballPath, integrity: 'sha512-' + digest };
}

function registryIntegrity(name: string, version: string): string | undefined {
  const result = capture([npmCommand, 'view', name + '@' + version, 'dist.integrity', '--json']);
  if (result.exitCode !== 0) {
    if (/E404|404 Not Found/i.test(result.stderr)) {
      return undefined;
    }
    throw new Error('Could not inspect ' + name + '@' + version + ':\n' + result.stderr);
  }

  return result.stdout ? JSON.parse(result.stdout) as string : undefined;
}

const npmTag = requireArgument('--tag');
const dryRun = hasFlag('--dry-run');
if (npmTag !== 'dev' && npmTag !== 'latest') {
  throw new Error('--tag must be dev or latest');
}
if (!dryRun && !process.env.NODE_AUTH_TOKEN) {
  throw new Error('NODE_AUTH_TOKEN is required for a real npm publish');
}

const manifests = packages.map((definition) => readPackage(definition.directory));
const versions = new Set(manifests.map((manifest) => manifest.version));
if (versions.size !== 1) {
  throw new Error('Packages are not using one lockstep version: ' + [...versions].join(', '));
}

const version = manifests[0].version;
for (const manifest of manifests.slice(1)) {
  if (manifest.dependencies?.['@webquark/core'] !== version) {
    const message = manifest.name + ' must depend on @webquark/core@' + version + ' before publishing';
    if (!dryRun) {
      throw new Error(message);
    }
    console.warn('Dry-run warning: ' + message);
  }
}

const destination = mkdtempSync(join(tmpdir(), 'webquark-publish-'));
try {
  console.log('Packing WebQuark ' + version + '...');
  const packedPackages = packages.map((definition) => pack(definition.directory, destination));

  if (dryRun) {
    for (const packed of packedPackages) {
      console.log(
        'Would publish ' + packed.name + '@' + packed.version +
        ' from ' + packed.filename + ' with the npm tag ' + npmTag + '.',
      );
    }
    console.log('\nDry run complete: ' + version + ' would use the npm tag ' + npmTag + '.');
    rmSync(destination, { recursive: true, force: true });
    process.exit(0);
  }

  const alreadyPublished = new Set<string>();
  for (const packed of packedPackages) {
    const existingIntegrity = registryIntegrity(packed.name, packed.version);
    if (!existingIntegrity) {
      continue;
    }
    if (existingIntegrity !== packed.integrity) {
      throw new Error(
        packed.name + '@' + packed.version +
        ' already exists on npm with different contents. ' +
        'Bump .github/release.json instead of overwriting it.',
      );
    }
    alreadyPublished.add(packed.name);
    console.log(packed.name + '@' + packed.version + ' already exists; publish will be skipped.');
  }

  for (const packed of packedPackages) {
    if (!alreadyPublished.has(packed.name)) {
      run([npmCommand, 'publish', packed.tarballPath, '--access', 'public', '--tag', npmTag]);
    }
  }

  for (const packed of packedPackages) {
    run([npmCommand, 'dist-tag', 'add', packed.name + '@' + packed.version, npmTag]);
  }

  console.log('\nPublished all WebQuark packages as ' + version + ' with the npm tag ' + npmTag + '.');
} finally {
  rmSync(destination, { recursive: true, force: true });
}
