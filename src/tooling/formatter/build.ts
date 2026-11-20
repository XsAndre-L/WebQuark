import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';
import { languages } from './languages';

export const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

const transpiler = new Bun.Transpiler({ loader: 'js', minifyWhitespace: true });

export interface ReleaseManifest {
  version: string;
  integrity: string;
  files: Record<string, string>;
}

function languageModuleSources(): Record<string, string> {
  return Object.fromEntries(Object.entries(languages).map(([name, { parser, plugins }]) => {
    const imports = plugins.map(plugin => `import * as ${plugin} from '../plugins/${plugin}.mjs';`);
    const lines = [
      "import { format } from '../standalone.mjs';", ...imports, '',
      'export function formatSource(code) {',
      `  return format(code, { parser: '${parser}', plugins: [${plugins.join(', ')}],`,
      "    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });", '}', '',
    ];
    return [`languages/${name}.mjs`, lines.join('\n')];
  }));
}

export function matchesLanguageCatalog(manifest: ReleaseManifest): boolean {
  const expected = Object.entries(languageModuleSources());
  const pinned = Object.keys(manifest.files).filter(file => file.startsWith('languages/'));

  return pinned.length === expected.length && expected.every(([file, source]) =>
    manifest.files[file] === sha256(Buffer.from(source)),
  );
}

export async function writeLanguageModules(source: string) {
  await mkdir(join(source, 'languages'), { recursive: true });
  for (const [file, contents] of Object.entries(languageModuleSources())) {
    await writeFile(join(source, file), contents);
  }
}

// Relative literal imports let consumer bundlers discover and split each language on demand.
function runtimeSource() {
  const loaders = Object.keys(languages).map(name => {
    const path = name === 'html' ? './html-fragment.mjs' : `./languages/${name}.mjs`;
    return `  '${name}': () => import('${path}'),`;
  });
  return [
    'const loaders = {',
    ...loaders,
    '};',
    '',
    'export async function loadFormatter(language) {',
    '  if (!Object.hasOwn(loaders, language)) throw new RangeError("Unsupported formatter language: " + language);',
    '  return (await loaders[language]()).formatSource;',
    '}',
    '',
    'export async function formatSource(code, language) {',
    '  const format = await loadFormatter(language);',
    '  return format(code);',
    '}',
    '',
  ].join('\n');
}

async function writeModule(path: string, source: string) {
  const js = transpiler.transformSync(source);
  await writeFile(path, js);
  await writeFile(path + '.gz', gzipSync(js, { level: 9 }));
}

export async function buildFormatter(source: string, output: string) {
  const manifest: ReleaseManifest = JSON.parse(await readFile(join(source, 'manifest.json'), 'utf8'));
  if (!matchesLanguageCatalog(manifest)) {
    throw new Error('Pinned language entries differ from the catalog. Run bun run formatter:refresh.');
  }

  await mkdir(output, { recursive: true });
  for (const [file, digest] of Object.entries(manifest.files)) {
    const bytes = await readFile(join(source, file));
    if (sha256(bytes) !== digest) throw new Error('Vendored formatter checksum mismatch: ' + file);
    const target = join(output, file);
    await mkdir(dirname(target), { recursive: true });
    if (!file.endsWith('.mjs')) {
      await copyFile(join(source, file), target);
      continue;
    }
    // Upstream ESM is already bundled. Minify modules individually so shared plugins stay separate.
    await writeModule(target, bytes.toString('utf8'));
  }
  await writeModule(join(output, 'runtime.mjs'), runtimeSource());
  await writeModule(join(output, 'html-fragment.mjs'), await readFile(join(import.meta.dir, 'html-fragment.mjs'), 'utf8'));
  await copyFile(join(import.meta.dir, 'runtime.d.mts'), join(output, 'runtime.d.mts'));
  const files: Record<string, string> = {};
  for (const entry of await readdir(output, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const path = join(entry.parentPath, entry.name);
    if (path === join(output, 'manifest.json')) continue;
    files[relative(output, path).split(sep).join('/')] = sha256(await readFile(path));
  }
  const buildManifest: ReleaseManifest = { version: manifest.version, integrity: manifest.integrity, files };
  await writeFile(join(output, 'manifest.json'), JSON.stringify(buildManifest, null, 2) + '\n');
}

export async function checkFormatter(output: string) {
  const files = await readdir(output, { recursive: true });
  for (const file of files.filter(name => name.endsWith('.mjs'))) {
    const path = join(output, file);
    const [plain, compressed] = await Promise.all([readFile(path), readFile(path + '.gz')]);
    if (!gunzipSync(compressed).equals(plain)) throw new Error('Invalid precompressed module: ' + file);
  }

  const runtime = await import(pathToFileURL(join(output, 'runtime.mjs')).href);
  for (const [language, { sample }] of Object.entries(languages)) {
    const result = await runtime.formatSource(sample, language);
    if (!result.trim() || await runtime.formatSource(result, language) !== result) {
      throw new Error('Formatter smoke check failed: ' + language);
    }
  }
  // Detect new upstream languages at upgrade time instead of silently dropping them.
  const knownParsers = new Set(Object.values(languages).map(language => language.parser));
  for (const file of await readdir(join(output, 'plugins'))) {
    if (!file.endsWith('.mjs')) continue;
    const plugin = await import(pathToFileURL(join(output, 'plugins', file)).href);
    for (const language of plugin.languages ?? []) {
      if (!language.parsers.some((parser: string) => knownParsers.has(parser))) {
        throw new Error('Missing formatter mapping for upstream language: ' + language.name);
      }
    }
  }
}

if (import.meta.main) await checkFormatter(process.argv[2]);
