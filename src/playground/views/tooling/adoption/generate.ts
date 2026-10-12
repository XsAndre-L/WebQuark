import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { generateWhatsNew } from '@webquark/tooling/changelog';
import { changelogConfig } from './changelog.config';

const result = await generateWhatsNew(changelogConfig, {
  includeUnreleased: true,
  environmentType: process.env.ENVIRONMENT_TYPE ?? 'dev',
});
// The application bridges the returned URL into its own browser code.
await writeFile(fileURLToPath(new URL('./dist/feed-url.js', import.meta.url)),
  `export const feedPath = ${JSON.stringify(result.feedUrl)};\n`);
console.log(`Generated ${result.releases} releases: ${result.feedUrl}`);
