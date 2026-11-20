import { cpSync, existsSync, mkdirSync, watch } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const source = resolve('src/playground');
const output = resolve('.stencil/dist/playground');
const routes: Record<string, string> = {
  'components.manifest.json': 'playground/components.manifest.json',
  'consumer.html': 'playground/consumer.html',
  specs: 'playground/specs',
  assets: 'assets',
  views: 'views',
  css: 'css',
  'playground.css': 'playground.css',
  'presets.html': 'presets.html',
  'logo.svg': 'logo.svg',
};

function copyEntry(filename: string) {
  const [first, ...rest] = filename.split(/[\\/]/);
  const route = routes[first];
  if (!route || rest.includes('..')) return;
  const from = join(source, first, ...rest);
  const to = join(output, route, ...rest);
  if (existsSync(from)) {
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
  }
}

export function syncPlaygroundAssets() {
  for (const name of Object.keys(routes)) copyEntry(name);
}

export function watchPlaygroundAssets() {
  syncPlaygroundAssets();
  return watch(source, { recursive: true }, (_event, path) => {
    if (!path) return;
    const name = relative(source, resolve(source, path));
    if (name.startsWith('..' + sep)) return;
    copyEntry(name);
  });
}

if (import.meta.main) syncPlaygroundAssets();
