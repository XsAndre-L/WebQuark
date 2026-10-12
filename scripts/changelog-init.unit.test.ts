import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeChangelog } from '../src/tooling/changelog/init/index.js';
import { runChangelogCli } from '../src/tooling/changelog/index.js';

const roots: string[] = [];
const sourceEntry = pathToFileURL(fileURLToPath(new URL('../src/tooling/changelog/index.ts', import.meta.url))).href;

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    const within = relative(tmpdir(), root);
    if (!within || isAbsolute(within) || within.startsWith('..') || !within.startsWith('wq-changelog-init-')) throw new Error('Unexpected fixture cleanup path.');
    rmSync(root, { recursive: true, force: true });
  }
});

function put(root: string, path: string, text: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

function fixture(overrides: Record<string, unknown> = {}, packageName = '@webquark/tooling'): string {
  const root = mkdtempSync(join(tmpdir(), 'wq-changelog-init-'));
  roots.push(root);
  put(root, 'package.json', JSON.stringify({ name: 'existing-app', private: true, version: '2.3.4',
    scripts: { build: 'existing-build' }, devDependencies: { [packageName]: '1.0.2' }, ...overrides }, null, 2));
  const exportPath = packageName === '@webquark/tooling' ? './changelog' : './tooling/changelog';
  put(root, `node_modules/${packageName}/package.json`, JSON.stringify({ name: packageName, type: 'module', exports: { [exportPath]: './index.js' } }));
  put(root, `node_modules/${packageName}/index.js`, `export * from ${JSON.stringify(sourceEntry)};\n`);
  return root;
}

function snapshot(root: string, base = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const item of readdirSync(join(root, base), { withFileTypes: true })) {
    const path = base ? `${base}/${item.name}` : item.name;
    if (item.isSymbolicLink()) result[path] = '<symlink>';
    else if (item.isDirectory()) Object.assign(result, snapshot(root, path));
    else result[path] = readFileSync(join(root, path), 'utf8');
  }
  return result;
}

describe('changelog starter initialization', () => {
  it('previews all planned writes without creating files', async () => {
    const root = fixture(), before = snapshot(root);
    expect(await initializeChangelog(root, { dryRun: true })).toMatchObject({ dryRun: true,
      files: expect.arrayContaining(['changelog.config.ts', 'public/changelog/viewer.js', 'scripts/generate-changelog.ts', 'package.json', '.gitignore']) });
    expect(snapshot(root)).toEqual(before);
  });

  it.each(['@webquark/tooling', '@webquark/core'])('creates a useful starter using the declared %s import', async packageName => {
    const root = fixture({}, packageName);
    put(root, '.gitignore', '/existing-output/\n');
    put(root, 'public/existing.txt', 'Existing application asset');
    await initializeChangelog(root);
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg).toMatchObject({ name: 'existing-app', private: true, version: '2.3.4',
      scripts: { build: 'existing-build', 'changelog:generate': 'bun scripts/generate-changelog.ts',
        'changelog:preview': 'bun scripts/generate-changelog.ts --preview' } });
    const entry = packageName === '@webquark/tooling' ? '@webquark/tooling/changelog' : '@webquark/core/tooling/changelog';
    expect(readFileSync(join(root, 'changelog.config.ts'), 'utf8')).toContain(`from '${entry}'`);
    expect(readFileSync(join(root, 'scripts/generate-changelog.ts'), 'utf8')).toContain(`from '${entry}'`);
    expect(readFileSync(join(root, 'CHANGELOG.md'), 'utf8')).not.toMatch(/^## v|\d{4}-\d{2}-\d{2}/m);
    expect(readFileSync(join(root, 'docs/changelog/unreleased/visuals.json'), 'utf8')).toBe('[]\n');
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toContain('/existing-output/\n');
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toContain('/public/changelog/generated/\n/public/changelog/feed-url.js\n');
    expect(readFileSync(join(root, 'public/existing.txt'), 'utf8')).toBe('Existing application asset');
    // Parsing the generated plain browser script catches template escaping errors.
    const syntax = spawnSync('bun', ['build', join(root, 'public/changelog/viewer.js'), '--target', 'browser', '--outfile', join(root, 'viewer-check.js')], { encoding: 'utf8' });
    expect(syntax.status, syntax.stderr).toBe(0);
  });

  it('refuses repeat setup without modifying any existing bytes', async () => {
    const root = fixture();
    await initializeChangelog(root);
    const before = snapshot(root);
    await expect(initializeChangelog(root)).rejects.toThrow(/conflicts.*No files were changed/);
    expect(snapshot(root)).toEqual(before);
  });

  it.each(['CHANGELOG.md', 'changelog.config.ts', 'scripts/generate-changelog.ts', 'public/changelog/custom-viewer.html',
    'docs/changelog/v2.0.0/README.md'])('rejects existing %s before creating any starter files', async path => {
    const root = fixture();
    put(root, path, 'User-authored content');
    const before = snapshot(root);
    await expect(initializeChangelog(root)).rejects.toThrow(/conflicts/);
    expect(snapshot(root)).toEqual(before);
  });

  it('rejects a custom script even when its value is empty', async () => {
    const root = fixture({ scripts: { 'changelog:preview': '' } }), before = snapshot(root);
    await expect(initializeChangelog(root)).rejects.toThrow(/scripts.changelog:preview/);
    expect(snapshot(root)).toEqual(before);
  });

  it.each([undefined, '1.0.0-beta.1', 'invalid'])('refuses missing or invalid version %s without changing it', async version => {
    const root = fixture({ version }), before = snapshot(root);
    await expect(initializeChangelog(root)).rejects.toThrow(/set an explicit stable X.Y.Z/);
    expect(snapshot(root)).toEqual(before);
  });

  it('requires a declared and installed provider without adding a dependency', async () => {
    const root = fixture({ devDependencies: {} }), before = snapshot(root);
    await expect(initializeChangelog(root)).rejects.toThrow(/Declare and install/);
    expect(snapshot(root)).toEqual(before);
    put(root, 'package.json', JSON.stringify({ version: '1.0.0', devDependencies: { '@webquark/core': '1.0.2' } }));
    const uninstalled = snapshot(root);
    await expect(initializeChangelog(root)).rejects.toThrow(/Install the declared dependency/);
    expect(snapshot(root)).toEqual(uninstalled);
  });

  it('refuses a linked script parent without writing into either directory', async () => {
    const root = fixture(), outside = fixture();
    symlinkSync(outside, join(root, 'scripts'), process.platform === 'win32' ? 'junction' : 'dir');
    const before = snapshot(root), external = snapshot(outside);
    await expect(initializeChangelog(root)).rejects.toThrow(/aliases another location/);
    expect(snapshot(root)).toEqual(before);
    expect(snapshot(outside)).toEqual(external);
  });

  it('generates published-only by default from a different cwd and keeps the viewer outside replaced output', async () => {
    const root = fixture();
    await initializeChangelog(root);
    const script = join(root, 'scripts/generate-changelog.ts');
    const viewer = readFileSync(join(root, 'public/changelog/viewer.js'), 'utf8');
    const environment = { ...process.env };
    delete environment.ENVIRONMENT_TYPE;
    const result = spawnSync('bun', [script], { cwd: tmpdir(), encoding: 'utf8', env: environment });
    expect(result.status, result.stderr).toBe(0);
    const output = join(root, 'public/changelog/generated');
    const feed = readdirSync(output).find(name => /^releases\..*\.json$/.test(name))!;
    expect(JSON.parse(readFileSync(join(output, feed), 'utf8'))).toEqual({ releases: [] });
    expect(readFileSync(join(root, 'public/changelog/feed-url.js'), 'utf8')).toContain(`generated/${feed}`);
    expect(readFileSync(join(root, 'public/changelog/viewer.js'), 'utf8')).toBe(viewer);
  });

  it('shows inert init help and rejects unsupported options before configuration import', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await runChangelogCli(['init', '--help', '--config', 'must-not-load.mjs'])).toBe(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('wq-changelog init [--dry-run]'));
    expect(await runChangelogCli(['init', '--version', '1.2.3'])).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Init accepts only --dry-run'));
  });
});
