import { fileURLToPath } from 'node:url';
import type { ChangelogConfig } from '@webquark/tooling/changelog';

export const changelogConfig: ChangelogConfig = {
  root: fileURLToPath(new URL('.', import.meta.url)),
  sourceManifest: 'package.json',
  changelog: 'CHANGELOG.md',
  releasesDirectory: 'docs/changelog',
  unreleasedDirectory: 'docs/changelog/unreleased',
  feedOutputDirectory: 'dist/release-notes',
  feedPublicPrefix: 'release-notes',
};
