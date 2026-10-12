/** Plain project files, rather than a framework integration or browser tooling runtime. */
export function starterFiles(entry: string): Record<string, string> {
  return {
    'changelog.config.ts': `import { fileURLToPath } from 'node:url';
import type { ChangelogConfig } from '${entry}';

export const changelogConfig: ChangelogConfig = {
  root: fileURLToPath(new URL('.', import.meta.url)),
  sourceManifest: 'package.json',
  changelog: 'CHANGELOG.md',
  releasesDirectory: 'docs/changelog',
  unreleasedDirectory: 'docs/changelog/unreleased',
  feedOutputDirectory: 'public/changelog/generated',
  feedPublicPrefix: 'changelog/generated',
};
`,
    'CHANGELOG.md': `# Changelog

## Unreleased

<!-- Add concise reader-facing bullet points under the relevant category. -->

### Added

### Changed

### Fixed

### Removed
`,
    'docs/changelog/unreleased/README.md': `# Unreleased

1. Add reader-facing bullet points to the Unreleased section in [CHANGELOG.md](../../../CHANGELOG.md).
2. Run \`bun run changelog:preview\` and open the printed local URL.
3. Run \`bun run changelog:generate\` before your application build, and serve the contents of \`public/\` as static files.

The viewer is available at \`changelog/\` under your application's public base URL.
The generated folder and \`public/changelog/feed-url.js\` belong to the generation script; do not edit them.
Production generation excludes Unreleased. No released history is created by setup.

Optional images belong in this folder's \`images/\` directory. List ordinary images or Before/After pairs in \`visuals.json\`; leave \`[]\` for text-only notes.
Contextual metadata and managed capture require separately reviewed adapters and configuration.
Prepare a release only when the release owner explicitly requests it; setup and preview do not prepare or publish a release.
`,
    'docs/changelog/unreleased/visuals.json': '[]\n',
    'docs/changelog/unreleased/images/.gitkeep': '',
    'scripts/generate-changelog.ts': generationScript(entry),
    'public/changelog/index.html': viewerHtml,
    'public/changelog/viewer.js': viewerScript,
  };
}

function generationScript(entry: string): string {
  return `import { writeFile } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { generateWhatsNew } from '${entry}';
import { changelogConfig } from '../changelog.config';

const args = process.argv.slice(2);
if (args.length > 1 || args.some(arg => arg !== '--preview')) {
  throw new Error('Usage: bun scripts/generate-changelog.ts [--preview]');
}
const preview = args.includes('--preview');
const environmentType = process.env.ENVIRONMENT_TYPE ?? (preview ? 'dev' : 'prod');
const result = await generateWhatsNew(changelogConfig, { includeUnreleased: preview, environmentType });
// Bridge the returned hashed feed URL into browser code without importing runtime tooling.
const feedPath = posix.relative('changelog', result.feedUrl);
await writeFile(join(changelogConfig.root, 'public/changelog/feed-url.js'),
  'export const feedUrl = new URL(' + JSON.stringify(feedPath) + ', import.meta.url);\\n');
console.log('Generated ' + result.releases + ' entries: ' + result.feedUrl);

if (preview) {
  const publicRoot = join(changelogConfig.root, 'public');
  const files: Record<string, string> = {
    '/changelog/': 'changelog/index.html',
    '/changelog/index.html': 'changelog/index.html',
    '/changelog/viewer.js': 'changelog/viewer.js',
    '/changelog/feed-url.js': 'changelog/feed-url.js',
  };
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 4173,
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === '/' || path === '/changelog') return Response.redirect(new URL('/changelog/', request.url));
      const filePath = files[path] ?? (
        /^\\/changelog\\/generated\\/(?:releases\\.[a-f0-9]{20}\\.json|images\\/[a-f0-9]{20}\\.(?:png|jpe?g|webp|gif|avif|svg))$/.test(path)
          ? path.slice(1) : undefined
      );
      if (!filePath) return new Response('Not found', { status: 404 });
      const file = Bun.file(join(publicRoot, filePath));
      return await file.exists() ? new Response(file) : new Response('Not found', { status: 404 });
    },
  });
  console.log('Release notes: ' + new URL('changelog/', server.url));
  if (environmentType === 'prod' || environmentType === 'prod-rehearsal') {
    console.log('Unreleased is hidden because ENVIRONMENT_TYPE=' + environmentType + '.');
  }
}
`;
}

const viewerHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Release notes</title>
    <style>
      body { max-width: 760px; margin: 32px auto; padding: 0 20px; font: 16px/1.6 system-ui, sans-serif; color: #182337; background: #f5f7fb; }
      article { margin: 24px 0; padding: 20px; border: 1px solid #cad3e3; background: white; border-radius: 12px; }
      img { display: block; max-width: 100%; height: auto; }
      figure { margin: 16px 0; }
    </style>
  </head>
  <body>
    <h1>Release notes</h1>
    <p id="status" role="status">Loading release notes…</p>
    <main id="releases"></main>
    <script type="module" src="./viewer.js"></script>
  </body>
</html>
`;

const viewerScript = `const status = document.querySelector('#status');
const releases = document.querySelector('#releases');

function element(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function imageFigure(reference, label, feedUrl) {
  const figure = element('figure');
  const image = element('img');
  // Generated image paths are relative to the feed directory, including application base paths.
  const imageUrl = new URL(reference.src, feedUrl);
  if (imageUrl.origin !== feedUrl.origin || !['http:', 'https:'].includes(imageUrl.protocol)
    || !imageUrl.href.startsWith(new URL('images/', feedUrl).href)) {
    throw new Error("Image URL must be inside this feed's images folder.");
  }
  image.src = imageUrl.href;
  image.alt = reference.alt;
  figure.append(image, element('figcaption', label));
  return figure;
}

try {
  const { feedUrl } = await import('./feed-url.js');
  const response = await fetch(feedUrl);
  if (!response.ok) throw new Error('Feed request failed: ' + response.status);
  const feed = await response.json();
  for (const release of feed.releases) {
    const article = element('article');
    article.append(element('h2', release.unreleased ? 'Unreleased' : 'v' + release.version));
    if (release.date) article.append(element('p', release.date));
    for (const category of release.categories) {
      article.append(element('h3', category.name));
      const list = element('ul');
      for (const summary of category.summaries) list.append(element('li', summary));
      article.append(list);
    }
    for (const visual of release.visuals) {
      article.append(element('h3', visual.title));
      if (visual.description) article.append(element('p', visual.description));
      if (visual.kind === 'image') article.append(imageFigure(visual.image, visual.title, feedUrl));
      else article.append(imageFigure(visual.before, 'Before', feedUrl), imageFigure(visual.after, 'After', feedUrl));
    }
    if (release.unreleased && !release.categories.length && !release.visuals.length) {
      article.append(element('p', 'No changes recorded yet. Add bullet points under Unreleased in CHANGELOG.md, then rerun bun run changelog:preview.'));
    }
    releases.append(article);
  }
  status.textContent = feed.releases.length
    ? 'Loaded ' + feed.releases.length + ' release entries.'
    : 'No published releases yet. Record changes in CHANGELOG.md and use bun run changelog:preview to see Unreleased notes.';
} catch (error) {
  status.textContent = (error instanceof Error ? error.message + ' ' : '')
    + 'Run bun run changelog:generate or bun run changelog:preview to generate the feed.';
}
`;
