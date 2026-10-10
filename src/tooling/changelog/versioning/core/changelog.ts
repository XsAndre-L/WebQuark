import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { parseStableVersion } from '../stable-version.js';
import { writePreservingLineEndings } from './files.js';
import { projectPath, releaseDirectory, validateChangelogConfig, type ChangelogConfig } from '../../config/index.js';
import { loadReleaseAssets } from '../../notes/assets.js';
import { parseReleaseSummaries } from '../../notes/summaries.js';

export function archiveChangelog(
  changelog: string,
  version: string,
  date: string,
  detailedNotesPath = `docs/changelog/v${version}/README.md`,
): string {
  parseStableVersion(version);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Release date must use YYYY-MM-DD; received ${JSON.stringify(date)}.`);
  }

  const normalized = changelog.replace(/\r\n/g, '\n');
  const unreleasedHeadings = [...normalized.matchAll(/^## Unreleased\s*$/gm)];
  if (unreleasedHeadings.length !== 1) {
    throw new Error('CHANGELOG.md must contain exactly one "## Unreleased" heading.');
  }

  const heading = unreleasedHeadings[0];
  const start = heading.index ?? 0;
  const contentStart = start + heading[0].length;
  const remainder = normalized.slice(contentStart);
  const nextHeading = /^##\s+/m.exec(remainder);
  const sectionEnd = nextHeading ? contentStart + (nextHeading.index ?? 0) : normalized.length;
  const releaseNotes = normalized.slice(contentStart, sectionEnd).trim();
  assertCategorizedReleaseNotes(releaseNotes);

  const before = normalized.slice(0, start).trimEnd();
  const after = normalized.slice(sectionEnd).trim();
  const freshUnreleased =
    '## Unreleased\n\n' +
    'Add concise notes under `Added`, `Changed`, `Fixed`, or `Removed`.';
  const releaseSection =
    `## v${version} - ${date}\n\n` +
    `[Detailed notes](${detailedNotesPath})\n\n` +
    releaseNotes;

  return [before, freshUnreleased, releaseSection, after]
    .filter(Boolean)
    .join('\n\n')
    .concat('\n');
}

export function createFreshUnreleasedReadme(changelogLink = '../../../CHANGELOG.md'): string {
  return [
    '# Unreleased changes',
    '',
    'Add detailed notes for the next release and keep the concise summary in',
    '[`CHANGELOG.md`](' + changelogLink + '). Store visual assets in',
    '[`images/`](images/) and use relative Markdown paths.',
    'Configure optional Before/After comparisons in [`visuals.json`](visuals.json);',
    'leave its array empty until both real screenshots exist.',
    'Configure automated After captures in [`captures.json`](captures.json).',
    '',
    '## Workflow',
    '',
    '1. Add notes and visual assets.',
    '2. Run `bun run release` after editing the root package version.',
    '3. Review and commit the resulting diff.',
    '',
  ].join('\n');
}

export function archiveUnreleasedReadme(readme: string, version: string): string {
  parseStableVersion(version);
  const normalized = readme.replace(/\r\n/g, '\n');
  return /^#\s+.+$/m.test(normalized)
    ? normalized.replace(/^#\s+.+$/m, `# v${version}`)
    : normalized;
}

export async function archiveReleaseNotes(
  config: ChangelogConfig,
  version: string,
  date: string,
): Promise<void> {
  await validateChangelogConfig(config);
  const changelogPath = projectPath(config, config.changelog);
  const unreleasedPath = projectPath(config, config.unreleasedDirectory);
  const targetPath = releaseDirectory(config, version);
  const originalChangelog = await readFile(changelogPath, 'utf8');
  const originalReadme = await readFile(resolve(unreleasedPath, 'README.md'), 'utf8');
  const nextChangelog = archiveChangelog(originalChangelog, version, date, relative(dirname(changelogPath), resolve(targetPath, 'README.md')).replaceAll('\\', '/'));
  const currentRelease = parseReleaseSummaries(originalChangelog, version, true).filter((release) => release.unreleased);
  await loadReleaseAssets(config, currentRelease);
  const locations = Object.fromEntries(currentRelease.flatMap((release) => release.visuals.map((visual) => [visual.id, {
    location: visual.location, subject: visual.subject, guidance: visual.guidance,
  }])));

  await rename(unreleasedPath, targetPath);
  // The release owner's existing directory snapshot/rollback transaction includes this file.
  await writeFile(resolve(targetPath, 'locations.json'), `${JSON.stringify({ schemaVersion: 1, visuals: locations }, null, 2)}\n`, 'utf8');
  await writePreservingLineEndings(
    resolve(targetPath, 'README.md'),
    archiveUnreleasedReadme(originalReadme, version),
    originalReadme,
  );
  await writePreservingLineEndings(
    changelogPath,
    nextChangelog,
    originalChangelog,
  );

  await mkdir(resolve(unreleasedPath, 'images'), { recursive: true });
  await writeFile(
    resolve(unreleasedPath, 'README.md'),
    config.unreleasedReadme ?? createFreshUnreleasedReadme(relative(unreleasedPath, changelogPath).replaceAll('\\', '/')),
    'utf8',
  );
  await writeFile(resolve(unreleasedPath, 'images', '.gitkeep'), '', 'utf8');
  await writeFile(resolve(unreleasedPath, 'visuals.json'), '[]\n', 'utf8');
  await writeFile(resolve(unreleasedPath, 'captures.json'), '[]\n', 'utf8');
}

function assertCategorizedReleaseNotes(notes: string): void {
  const headings = [...notes.matchAll(/^### (Added|Changed|Fixed|Removed)\s*$/gm)];
  const hasEntry = headings.some((heading, index) => {
    const start = (heading.index ?? 0) + heading[0].length;
    const end = headings[index + 1]?.index ?? notes.length;
    return /^-\s+\S/m.test(notes.slice(start, end));
  });

  if (!hasEntry) {
    throw new Error(
      'CHANGELOG.md Unreleased must contain at least one bullet under Added, Changed, Fixed, or Removed.',
    );
  }
}

export function localIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

