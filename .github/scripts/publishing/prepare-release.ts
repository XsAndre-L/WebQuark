import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertStableVersion,
  capture,
  hasFlag,
  npmCommand,
  packageJsonPath,
  packages,
  prepareManifest,
  readJson,
  readPackage,
  repositoryRoot,
  requireArgument,
  writeJson,
} from './release-utils';

type ReleasePlan = {
  nextVersion: string;
  versioning: 'lockstep';
};

type Channel = 'dev' | 'stable';

function publishedVersions(packageName: string): string[] {
  const result = capture([npmCommand, 'view', packageName, 'versions', '--json']);
  if (result.exitCode !== 0) {
    if (/E404|404 Not Found/i.test(result.stderr)) {
      return [];
    }
    throw new Error('Could not read npm versions for ' + packageName + ':\n' + result.stderr);
  }

  if (!result.stdout) {
    return [];
  }

  const value = JSON.parse(result.stdout) as string | string[];
  return Array.isArray(value) ? value : [value];
}

function nextDevSequence(baseVersion: string): number {
  const requestedSequence = Bun.argv.includes('--sequence')
    ? Number(requireArgument('--sequence'))
    : undefined;

  if (requestedSequence !== undefined) {
    if (!Number.isSafeInteger(requestedSequence) || requestedSequence < 1) {
      throw new Error('--sequence must be a positive whole number');
    }
    return requestedSequence;
  }

  const escapedBase = baseVersion.replace(/\./g, '\\.');
  const devPattern = new RegExp('^' + escapedBase + '-dev\\.(\\d+)$');
  let highest = 0;

  for (const definition of packages) {
    const versions = publishedVersions(definition.name);
    if (versions.includes(baseVersion)) {
      throw new Error(
        definition.name + '@' + baseVersion + ' is already released. ' +
        'Change nextVersion in .github/release.json before publishing more dev builds.',
      );
    }

    for (const version of versions) {
      const match = version.match(devPattern);
      if (match) {
        highest = Math.max(highest, Number(match[1]));
      }
    }
  }

  return highest + 1;
}

const planPath = resolve(repositoryRoot, '.github/release.json');
const plan = readJson<ReleasePlan>(planPath);
const channel = requireArgument('--channel') as Channel;
const dryRun = hasFlag('--dry-run');

if (plan.versioning !== 'lockstep') {
  throw new Error('Only lockstep package versioning is supported');
}
if (channel !== 'dev' && channel !== 'stable') {
  throw new Error('--channel must be dev or stable');
}
assertStableVersion(plan.nextVersion);

const version = channel === 'dev'
  ? plan.nextVersion + '-dev.' + nextDevSequence(plan.nextVersion)
  : plan.nextVersion;
const npmTag = channel === 'dev' ? 'dev' : 'latest';

console.log((dryRun ? 'Would prepare' : 'Preparing') + ' all WebQuark packages:');
console.log('  version: ' + version);
console.log('  npm tag: ' + npmTag);
const prepared = packages.map(definition => ({ definition, manifest: prepareManifest(definition, readPackage(definition.directory), version) }));
for (const { definition, manifest } of prepared) {
  console.log('  ' + definition.name + '@' + version);
  if (!dryRun) writeJson(packageJsonPath(definition.directory), manifest);
}

const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
  const packageLinks = packages.map(({ name }) => `- [${name}](https://www.npmjs.com/package/${name}/v/${version})`);
  const packageNotes = ['## Packages', '', ...packageLinks].join('\n');

  appendFileSync(
    githubOutput,
    `version=${version}\nnpm_tag=${npmTag}\nchannel=${channel}\npackage_notes<<END_NOTES\n${packageNotes}\nEND_NOTES\n`,
  );
}
