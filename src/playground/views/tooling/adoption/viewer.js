import { feedPath } from './feed-url.js';

// Optional in TypeScript: import type { ReleaseFeed } from '@webquark/tooling/changelog';
// Browser code imports only this application's URL module, never runtime tooling.
const feedUrl = new URL(feedPath, new URL('/', location.href));
const status = document.querySelector('#status');
const releases = document.querySelector('#releases');

function element(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function imageFigure(reference, label) {
  const figure = element('figure');
  const image = element('img');
  // Generated image paths are relative to the feed directory, not the current page.
  const imageUrl = new URL(reference.src, feedUrl);
  if (imageUrl.origin !== feedUrl.origin || !['http:', 'https:'].includes(imageUrl.protocol)) {
    throw new Error('Image URL must be served with this feed.');
  }
  image.src = imageUrl.href;
  image.alt = reference.alt;
  figure.append(image, element('figcaption', label));
  return figure;
}

try {
  const response = await fetch(feedUrl);
  if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
  const feed = await response.json();
  for (const release of feed.releases) {
    const article = element('article');
    article.append(element('h2', release.unreleased ? 'Unreleased' : `v${release.version}`));
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
      if (visual.kind === 'image') article.append(imageFigure(visual.image, visual.title));
      else article.append(imageFigure(visual.before, 'Before'), imageFigure(visual.after, 'After'));
    }
    releases.append(article);
  }
  status.textContent = `Loaded ${feed.releases.length} releases.`;
} catch (error) {
  status.textContent = error instanceof Error ? error.message : 'Could not load release notes.';
}
