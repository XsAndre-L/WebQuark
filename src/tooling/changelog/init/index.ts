import { constants } from 'node:fs';
import { access, lstat, mkdir, readFile, realpath, rename, rmdir, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { parseStableVersion } from '../versioning/stable-version.js';
import { starterFiles } from './templates.js';

const scripts = {
  'changelog:generate': 'bun scripts/generate-changelog.ts',
  'changelog:preview': 'bun scripts/generate-changelog.ts --preview',
};
const ignored = ['/public/changelog/generated/', '/public/changelog/feed-url.js'];

/** Initialize only an unconfigured changelog workspace; never merge authored release content. */
export async function initializeChangelog(root: string, options: { dryRun?: boolean } = {}): Promise<{ files: string[]; dryRun: boolean }> {
  root = resolve(root);
  const manifestPath = join(root, 'package.json');
  const originalManifest = await readRegularFile(root, 'package.json', true);
  const manifest = JSON.parse(originalManifest!) as Record<string, unknown>;
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('package.json must contain a JSON object.');
  parseStableVersion(manifest.version, 'package.json version (set an explicit stable X.Y.Z before init)');
  const dependencies = [manifest.dependencies, manifest.devDependencies, manifest.optionalDependencies]
    .filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value));
  const declared = (name: string) => dependencies.some(group => typeof group[name] === 'string' && Boolean(group[name]));
  const entry = declared('@webquark/tooling') ? '@webquark/tooling/changelog'
    : declared('@webquark/core') ? '@webquark/core/tooling/changelog' : undefined;
  if (!entry) throw new Error('Declare and install @webquark/tooling or @webquark/core in this package.json before init.');
  try { createRequire(manifestPath).resolve(entry); }
  catch { throw new Error(`Install the declared dependency providing ${entry} before init. No files were changed.`); }
  if (manifest.scripts !== undefined && (!manifest.scripts || typeof manifest.scripts !== 'object' || Array.isArray(manifest.scripts))) {
    throw new Error('package.json scripts must be a JSON object.');
  }
  const existingScripts = (manifest.scripts ?? {}) as Record<string, unknown>;
  const files = starterFiles(entry);
  const conflicts: string[] = [];
  for (const path of [...Object.keys(files), 'docs/changelog', 'public/changelog']) {
    await assertLocalPath(root, path);
    if (await statIfPresent(join(root, path))) conflicts.push(path);
  }
  for (const [name, command] of Object.entries(scripts)) {
    if (Object.hasOwn(existingScripts, name) && existingScripts[name] !== command) conflicts.push(`package.json scripts.${name}`);
  }
  const originalIgnore = await readRegularFile(root, '.gitignore');
  if (conflicts.length) throw new Error(`Changelog init conflicts: ${[...new Set(conflicts)].join(', ')}. No files were changed. Existing changelog integrations must use their reviewed config.`);
  for (const file of ['package.json', '.gitignore']) {
    const path = join(root, file);
    await access(await statIfPresent(path) ? path : root, constants.W_OK);
  }
  const ignore = originalIgnore ?? '';
  const missing = ignored.filter(line => !ignore.split(/\r?\n/).includes(line));
  const updates = new Map<string, { before: string | undefined; after: string }>([
    ['package.json', { before: originalManifest, after: preserveEol(`${JSON.stringify({ ...manifest, scripts: { ...existingScripts, ...scripts } }, null, 2)}\n`, originalManifest!) }],
    ...(missing.length ? [['.gitignore', { before: originalIgnore, after: `${ignore}${ignore && !ignore.endsWith('\n') ? '\n' : ''}\n# Generated changelog viewer data\n${missing.join('\n')}\n` }] as const] : []),
  ]);
  const planned = [...Object.keys(files), ...updates.keys()];
  if (options.dryRun) return { files: planned, dryRun: true };

  const createdFiles: string[] = [], createdDirectories: string[] = [];
  const appliedUpdates: string[] = [];
  try {
    for (const [path, contents] of Object.entries(files)) {
      await makeParents(root, dirname(join(root, path)), createdDirectories);
      await writeFile(join(root, path), contents, { encoding: 'utf8', flag: 'wx' });
      createdFiles.push(path);
    }
    for (const [path, change] of updates) {
      if (await readRegularFile(root, path, path === 'package.json') !== change.before) throw new Error(`${path} changed during init. Retry after reviewing the project files.`);
      if (change.before === undefined) {
        await writeFile(join(root, path), change.after, { encoding: 'utf8', flag: 'wx' });
      } else await replaceFile(join(root, path), change.after);
      appliedUpdates.push(path);
    }
  } catch (error) {
    // Remove only paths created by this invocation; restore shared files only if they still contain our bytes.
    for (const path of appliedUpdates.reverse()) {
      const change = updates.get(path)!;
      if (await readFile(join(root, path), 'utf8') === change.after) {
        if (change.before === undefined) await unlink(join(root, path));
        else await replaceFile(join(root, path), change.before);
      }
    }
    for (const path of createdFiles.reverse()) await unlink(join(root, path));
    for (const path of createdDirectories.reverse()) await rmdir(path);
    throw error;
  }
  return { files: planned, dryRun: false };
}

async function statIfPresent(path: string) {
  return lstat(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  });
}

async function assertLocalPath(root: string, path: string): Promise<void> {
  let ancestor = join(root, path);
  while (!(await statIfPresent(ancestor))) ancestor = dirname(ancestor);
  const canonical = await realpath(ancestor);
  const expected = resolve(await realpath(root), relative(root, ancestor));
  const key = (value: string) => process.platform === 'win32' ? value.toLowerCase() : value;
  if (key(canonical) !== key(expected)) throw new Error(`Changelog init path aliases another location: ${path}. No files were changed.`);
  if (ancestor !== join(root, path) && !(await lstat(ancestor)).isDirectory()) throw new Error(`Changelog init parent is not a directory: ${path}. No files were changed.`);
  await access((await lstat(ancestor)).isDirectory() ? ancestor : dirname(ancestor), constants.W_OK);
}

async function readRegularFile(root: string, path: string, required = false): Promise<string | undefined> {
  await assertLocalPath(root, path);
  const stat = await statIfPresent(join(root, path));
  if (!stat) {
    if (required) throw new Error(`${path} is required. Run changelog init from the package root.`);
    return undefined;
  }
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${path} must be a regular project file. No files were changed.`);
  return readFile(join(root, path), 'utf8');
}

async function makeParents(root: string, path: string, created: string[]): Promise<void> {
  if (path === root || await statIfPresent(path)) return;
  await makeParents(root, dirname(path), created);
  await mkdir(path);
  created.push(path);
}

async function replaceFile(path: string, contents: string): Promise<void> {
  const temporary = `${path}.changelog-init-${randomUUID()}`;
  await writeFile(temporary, contents, { encoding: 'utf8', flag: 'wx' });
  try { await rename(temporary, path); }
  finally { await unlink(temporary).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; }); }
}

function preserveEol(contents: string, original: string): string { return original.includes('\r\n') ? contents.replaceAll('\n', '\r\n') : contents; }
