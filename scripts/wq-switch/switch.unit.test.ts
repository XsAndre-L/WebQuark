import { afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { setup } from './commands/setup';
import { build } from './commands/build';
import { status } from './commands/status';
import { check } from './commands/check';
import { stage, installed } from './packages';
import { activate, hasJournal, link, linkTarget, locked, readState, recover, restore, within } from './state';
import { consumerRoot, json, manifest, names, packageDirectories, selectedPackages, sourceFor, validateSource, writeJson } from './config';
import { projectPaths } from './paths';

const temporary: string[] = [];
afterEach(() => {
  for (const root of temporary.splice(0)) {
    if (!within(tmpdir(), root) || !root.includes('wq-switch-test-')) throw new Error('Unexpected cleanup path');
    rmSync(root, { recursive: true, force: true });
  }
  process.exitCode = 0;
  vi.restoreAllMocks();
});
function put(file: string, text: string) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); }
function pkg(root: string, name: string, extra = {}) {
  writeJson(join(root, 'package.json'), { name, version: '1.0.0', main: 'dist/index.js', files: ['dist'], ...extra });
  put(join(root, 'dist/index.js'), 'module.exports = {};');
}
function fixture(wrapper: 'angular' | 'react' = 'angular', linked = false, hoisted = false) {
  const base = mkdtempSync(join(tmpdir(), 'wq-switch-test-')); temporary.push(base);
  const app = join(base, 'app'), source = join(base, 'source');
  writeJson(join(app, 'package.json'), { name: 'consumer', dependencies: { '@webquark/core': '1.0.0', [`@webquark/${wrapper}`]: '1.0.0' } });
  put(join(app, 'bun.lock'), 'unchanged lock');
  const installedRoot = hoisted ? base : app;
  for (const name of ['core', 'browser', 'tooling', wrapper]) {
    const slot = join(installedRoot, 'node_modules/@webquark', name);
    const target = linked ? join(installedRoot, `node_modules/.bun/${name}/node_modules/@webquark`, name) : slot;
    pkg(target, `@webquark/${name}`);
    if (linked) {
      mkdirSync(dirname(slot), { recursive: true });
      // Like Bun: preserve relative symlinks by keeping their backup in the same parent.
      symlinkSync(relative(dirname(slot), target), slot, process.platform === 'win32' ? 'junction' : 'dir');
    }
  }
  const framework = wrapper === 'angular' ? '@angular/core' : 'react';
  pkg(join(app, 'node_modules', framework), framework);
  // Deliberately different library-side framework: staging must not use this one.
  pkg(join(source, 'node_modules', framework), framework, { version: '99.0.0' });
  writeJson(join(source, 'package.json'), { name: '@webquark/workspace', private: true, scripts: { 'packages:build': 'bun build-fixture.ts' } });
  const core = join(source, packageDirectories['@webquark/core']);
  pkg(core, '@webquark/core', {
    dependencies: { '@webquark/browser': '1.0.0', '@webquark/tooling': '1.0.0' },
    exports: { './browser/native-content.css': './dist/browser/native-content.css' },
    files: ['dist', 'scripts/wq-switch/dist/index.js'],
    bin: { 'wq-switch': './scripts/wq-switch/dist/index.js' },
  });
  put(join(core, 'scripts/wq-switch/dist/index.js'), '#!/usr/bin/env node\nconsole.log("fixture CLI");');
  put(join(core, 'dist/browser/native-content.css'), 'body {}');
  const browser = join(source, packageDirectories['@webquark/browser']);
  pkg(browser, '@webquark/browser', { exports: { './native-content.css': './dist/webquark/native-content.css' } });
  put(join(browser, 'dist/webquark/native-content.css'), 'body {}');
  pkg(join(source, packageDirectories['@webquark/tooling']), '@webquark/tooling');
  put(join(source, 'build-fixture.ts'), 'console.log("Built all five package fixtures");');
  for (const kind of ['react', 'angular']) pkg(join(source, packageDirectories[`@webquark/${kind}`]), `@webquark/${kind}`, {
    dependencies: { '@webquark/browser': '1.0.0' },
    peerDependencies: { '@webquark/browser': '1.0.0', ...(kind === wrapper ? { [framework]: '*' } : {}) },
  });
  setup(app, source);
  return { app, source, wrapper, framework, installedRoot };
}

describe('wq-switch transactions', () => {
  for (const wrapper of ['angular', 'react'] as const) {
    it(`stages ${wrapper} with consumer peers, refreshes and restores without changing dependency files`, () => {
      const { app, source, framework } = fixture(wrapper);
      const before = readFileSync(join(app, 'package.json'), 'utf8');
      const original = installed('@webquark/core', app);
      const first = stage(app, source); activate(app, first);
      expect(within(projectPaths(app).packages, first.generation)).toBe(true);
      expect(existsSync(projectPaths(app).state)).toBe(true);
      expect(installed(framework, installed(`@webquark/${wrapper}`, app))).toBe(installed(framework, app));
      expect(first.entries.map(entry => entry.name)).toEqual(['@webquark/core', '@webquark/browser', '@webquark/tooling', `@webquark/${wrapper}`]);
      expect(installed('@webquark/browser', installed(`@webquark/${wrapper}`, app))).toBe(installed('@webquark/browser', app));
      expect(installed('@webquark/browser', installed('@webquark/core', app))).toBe(installed('@webquark/browser', app));
      expect(installed('@webquark/tooling', installed('@webquark/core', app))).toBe(installed('@webquark/tooling', app));
      const second = stage(app, source); activate(app, second);
      expect(second.generation).not.toBe(first.generation);
      expect(existsSync(join(first.entries[0].target, 'dist/index.js'))).toBe(true);
      restore(app);
      expect(installed('@webquark/core', app)).toBe(original);
      expect(lstatSync(join(app, 'node_modules/@webquark/core')).isSymbolicLink()).toBe(false);
      expect(readState(app)).toBeNull();
      expect(readFileSync(join(app, 'package.json'), 'utf8')).toBe(before);
      expect(readFileSync(join(app, 'bun.lock'), 'utf8')).toBe('unchanged lock');
    });
  }
  it('restores Bun package-store links', () => {
    const { app, source } = fixture('angular', true);
    const slot = join(app, 'node_modules/@webquark/core');
    const before = linkTarget(slot);
    activate(app, stage(app, source)); restore(app);
    expect(linkTarget(slot)).toBe(before);
    expect(existsSync(join(slot, 'package.json'))).toBe(true);
  });
  it('shadows hoisted packages locally and removes the shadow on restore', () => {
    const { app, source } = fixture('react', false, true);
    const original = installed('@webquark/core', app);
    activate(app, stage(app, source)); restore(app);
    expect(existsSync(join(app, 'node_modules/@webquark/core'))).toBe(false);
    expect(installed('@webquark/core', app)).toBe(original);
  });
  it.each(['@webquark/browser', '@webquark/tooling', '@webquark/angular'] as const)('supports a standalone %s consumer and restores all identities', name => {
    const { app, source } = fixture();
    const pkg = manifest(app); pkg.dependencies = { [name]: '1.0.0' }; writeJson(join(app, 'package.json'), pkg);
    const selected = selectedPackages(app);
    const originals = selected.map(selectedName => installed(selectedName, app));
    const next = stage(app, source); activate(app, next);
    expect(next.entries.map(entry => entry.name)).toEqual(name === '@webquark/angular' ? ['@webquark/browser', name] : [name]);
    expect(next.entries.some(entry => entry.name === '@webquark/core')).toBe(false);
    restore(app);
    expect(selected.map(selectedName => installed(selectedName, app))).toEqual(originals);
  });
  it('stages nested umbrella dependencies and removes their temporary top-level shadows on restore', () => {
    const { app, source } = fixture();
    const pkg = manifest(app); pkg.dependencies = { '@webquark/core': '1.0.0' }; writeJson(join(app, 'package.json'), pkg);
    mkdirSync(join(app, 'node_modules/@webquark/core/node_modules/@webquark'), { recursive: true });
    for (const name of ['browser', 'tooling']) {
      renameSync(join(app, 'node_modules/@webquark', name), join(app, 'node_modules/@webquark/core/node_modules/@webquark', name));
    }
    const next = stage(app, source); activate(app, next);
    expect(next.entries.filter(entry => entry.name !== '@webquark/core').every(entry => !entry.identity && entry.original.includes('core'))).toBe(true);
    expect(installed('@webquark/browser', installed('@webquark/core', app))).toBe(installed('@webquark/browser', app));
    activate(app, stage(app, source));
    restore(app);
    expect(existsSync(join(app, 'node_modules/@webquark/browser'))).toBe(false);
    expect(existsSync(join(app, 'node_modules/@webquark/tooling'))).toBe(false);
    expect(manifest(installed('@webquark/browser', installed('@webquark/core', app))).name).toBe('@webquark/browser');
  });
  it('rejects unexpected internal edges instead of mixing local snapshots with registry WebQuark packages', () => {
    const { app, source } = fixture();
    const tooling = join(source, packageDirectories['@webquark/tooling']);
    writeJson(join(tooling, 'package.json'), { ...manifest(tooling), dependencies: { '@webquark/react': '1.0.0' } });
    expect(() => stage(app, source)).toThrow('Unexpected local WebQuark dependency');
    expect(readState(app)).toBeNull();
  });
  it('migrates an older umbrella runtime graph into the extracted browser and restores its identity', () => {
    const { app, source } = fixture();
    for (const name of ['browser', 'tooling']) {
      const slot = join(app, 'node_modules/@webquark', name);
      expect(within(app, slot)).toBe(true);
      rmSync(slot, { recursive: true });
    }
    const original = installed('@webquark/core', app);
    const runtime = join(original, 'node_modules/fixture-runtime');
    pkg(runtime, 'fixture-runtime');
    const browser = join(source, packageDirectories['@webquark/browser']);
    writeJson(join(browser, 'package.json'), { ...manifest(browser), dependencies: { 'fixture-runtime': '1.0.0' } });
    const before = readFileSync(join(app, 'package.json'), 'utf8');
    activate(app, stage(app, source));
    const stagedRuntime = installed('fixture-runtime', installed('@webquark/browser', app));
    expect(stagedRuntime).toContain('.wq-original-');
    activate(app, stage(app, source));
    expect(installed('fixture-runtime', installed('@webquark/browser', app))).toBe(stagedRuntime);
    restore(app);
    expect(installed('@webquark/core', app)).toBe(original);
    expect(installed('fixture-runtime', original)).toBe(runtime);
    expect(existsSync(join(app, 'node_modules/@webquark/browser'))).toBe(false);
    expect(existsSync(join(app, 'node_modules/@webquark/tooling'))).toBe(false);
    expect(readFileSync(join(app, 'package.json'), 'utf8')).toBe(before);
    expect(readFileSync(join(app, 'bun.lock'), 'utf8')).toBe('unchanged lock');
  });
  it('validates the private orchestration root and rejects running inside it', () => {
    const { source } = fixture();
    expect(validateSource(source)).toBe(source);
    expect(() => consumerRoot(source)).toThrow('consuming app');
    writeJson(join(source, 'package.json'), { ...manifest(source), private: false });
    expect(() => validateSource(source)).toThrow('private WebQuark repository');
  });
  it('leaves the active snapshot intact when rebuilding fails', async () => {
    const { app, source } = fixture();
    activate(app, stage(app, source));
    const before = installed('@webquark/core', app);
    put(join(source, 'build-fixture.ts'), 'process.exit(9);');
    await expect(build(app)).rejects.toThrow('build failed');
    expect(installed('@webquark/core', app)).toBe(before);
    expect(existsSync(join(before, 'dist/index.js'))).toBe(true);
  });
  it('refreshes an active snapshot after a successful build', async () => {
    const { app, source } = fixture();
    activate(app, stage(app, source));
    const before = installed('@webquark/core', app);
    await build(app);
    expect(installed('@webquark/core', app)).not.toBe(before);
  });
  it('does not switch npm connections when only build is requested', async () => {
    const { app } = fixture();
    const before = installed('@webquark/core', app);
    await build(app);
    expect(installed('@webquark/core', app)).toBe(before);
    expect(readState(app)).toBeNull();
  });
  it('reports missing local outputs without mutating the connection', () => {
    const { app, source } = fixture();
    const state = stage(app, source); activate(app, state);
    unlinkSync(join(state.entries[0].target, 'dist/index.js'));
    const output = vi.spyOn(console, 'log').mockImplementation(() => {});
    status(app);
    expect(output.mock.calls.flat().join('\n')).toContain('BROKEN');
    expect(linkTarget(state.entries[0].slot)).toBe(state.entries[0].target);
    expect(process.exitCode).toBe(1);
  });
  it('recovers an interrupted refresh to the previous snapshot', () => {
    const { app, source } = fixture();
    const previous = stage(app, source); activate(app, previous);
    const next = stage(app, source);
    const operations = next.entries.map(e => ({ slot: e.slot, before: previous.entries.find(old => old.name === e.name)!.target, after: e.target }));
    writeJson(projectPaths(app).journal, { previous, next, operations });
    unlinkSync(next.entries[0].slot); link(next.entries[0].target, next.entries[0].slot);
    recover(app);
    expect(installed('@webquark/core', app)).toBe(previous.entries[0].target);
    expect(readState(app)?.generation).toBe(previous.generation);
  });
  it('recovers an interrupted initial switch before continuing', () => {
    const { app, source } = fixture();
    const next = stage(app, source);
    const operations = next.entries.map(e => ({ slot: e.slot, before: null, after: e.target, move: e.backup }));
    writeJson(projectPaths(app).journal, { previous: null, next, operations });
    renameSync(next.entries[0].slot, next.entries[0].backup);
    recover(app);
    expect(hasJournal(app)).toBe(false);
    expect(manifest(next.entries[0].slot).name).toBe('@webquark/core');
    expect(readState(app)).toBeNull();
  });
  it('recovers an interrupted restore to the previously active local set', () => {
    const { app, source } = fixture();
    const previous = stage(app, source); activate(app, previous);
    const operations = previous.entries.map(e => ({ slot: e.slot, before: e.target, after: null }));
    writeJson(projectPaths(app).journal, { previous, next: null, operations });
    const first = previous.entries[0]; unlinkSync(first.slot); renameSync(first.backup, first.slot);
    recover(app);
    expect(installed('@webquark/core', app)).toBe(first.target);
    restore(app);
  });
  it('refuses to overwrite a connection changed by a package install', () => {
    const { app, source } = fixture();
    const state = stage(app, source); activate(app, state);
    unlinkSync(state.entries[0].slot); link(source, state.entries[0].slot);
    expect(() => restore(app)).toThrow('another install');
    expect(linkTarget(state.entries[0].slot)).toBe(source);
  });
  it('rejects overlapping operations using a live lock', async () => {
    const { app } = fixture();
    await locked(app, async () => { await expect(locked(app, async () => {})).rejects.toThrow('Another switch/build'); });
  });
  it('ships a self-contained CLI that runs from outside the source repository', () => {
    const { app } = fixture();
    const entry = resolve('scripts/wq-switch/dist/index.js');
    const copy = join(app, 'switch.cjs'); cpSync(entry, copy);
    const result = spawnSync('node', [copy, '--help'], { cwd: app, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('setup [--source');
  });
  it('creates a blank source, captures the declared release, and preserves settings on repeat setup', () => {
    const { app } = fixture();
    unlinkSync(projectPaths(app).config);
    const pkg = manifest(app); pkg.dependencies!['@webquark/core'] = '^1.2.3';
    writeJson(join(app, 'package.json'), pkg);
    setup(app);
    const config = json<any>(projectPaths(app).config);
    expect(config).toEqual({ 'wq-switch': { version: 1, source: '', preferredVersion: '^1.2.3' } });
    expect(() => sourceFor(app)).toThrow('Set source');
    expect(manifest(app).scripts).toMatchObject({ 'wq-sandbox': 'wq-sandbox', 'wq-switch': 'wq-switch' });
    config['wq-switch'].preferredVersion = '1.2.4'; writeJson(projectPaths(app).config, config);
    setup(app);
    expect(json<any>(projectPaths(app).config)['wq-switch'].preferredVersion).toBe('1.2.4');
  });
  it('adds switcher settings without losing other WebQuark settings', () => {
    const { app, source } = fixture();
    const previous = json<any>(projectPaths(app).config)['wq-switch'];
    writeJson(projectPaths(app).config, { sandbox: { port: 4444 } });
    expect(() => sourceFor(app)).toThrow('First run');
    setup(app, source);
    expect(json<any>(projectPaths(app).config)).toEqual({ sandbox: { port: 4444 }, 'wq-switch': previous });
    expect(readFileSync(join(app, '.gitignore'), 'utf8')).toContain('/.webquark/');
    setup(app);
    expect(json<any>(projectPaths(app).config).sandbox).toEqual({ port: 4444 });
  });
  it.each([null, [], { 'wq-switch': null }, { 'wq-switch': { version: 2, source: '' } }])('rejects malformed shared configuration without overwriting it: %j', invalid => {
    const { app } = fixture();
    writeJson(projectPaths(app).config, invalid);
    const before = readFileSync(projectPaths(app).config, 'utf8');
    expect(() => setup(app)).toThrow('Invalid');
    expect(readFileSync(projectPaths(app).config, 'utf8')).toBe(before);
  });
  it('does not overwrite custom scripts or write a partial setup for a script conflict', () => {
    const { app } = fixture();
    const pkg = manifest(app); pkg.scripts!['wq-switch'] = 'custom-command'; writeJson(join(app, 'package.json'), pkg);
    const config = readFileSync(projectPaths(app).config, 'utf8');
    expect(() => setup(app)).toThrow('custom wq-switch');
    expect(readFileSync(projectPaths(app).config, 'utf8')).toBe(config);
    expect(manifest(app).scripts!['wq-switch']).toBe('custom-command');
  });
  it('runs installed wq-setup and generated short scripts through Bun', () => {
    const base = mkdtempSync(join(tmpdir(), 'wq-switch-test-')); temporary.push(base);
    const core = join(base, 'core'), app = join(base, 'app');
    const fixtureVersion = `1.2.3-fixture.${Date.now()}`;
    for (const name of ['browser', 'tooling']) pkg(join(base, name), `@webquark/${name}`, { version: fixtureVersion });
    writeJson(join(core, 'package.json'), { name: '@webquark/core', version: fixtureVersion, bin: { 'wq-setup': 'scripts/setup.js', 'wq-switch': 'scripts/index.js', 'wq-sandbox': 'scripts/sandbox.js' } });
    mkdirSync(join(core, 'scripts'));
    cpSync(resolve('scripts/wq-switch/dist/index.js'), join(core, 'scripts/index.js'));
    cpSync(resolve('scripts/wq-switch/dist/setup.js'), join(core, 'scripts/setup.js'));
    writeFileSync(join(core, 'scripts/sandbox.js'), '#!/usr/bin/env node\nconsole.log("sandbox launcher reached");', { mode: 0o755 });
    writeJson(join(app, 'package.json'), { name: 'consumer', dependencies: { '@webquark/core': 'file:../core', '@webquark/browser': 'file:../browser', '@webquark/tooling': 'file:../tooling' } });
    const run = (args: string[]) => {
      const result = spawnSync('bun', args, { cwd: app, env: { ...process.env, BUN_INSTALL_CACHE_DIR: join(base, 'bun-cache') }, encoding: 'utf8', timeout: 20000 });
      expect(result.status, result.stderr || String(result.error)).toBe(0); return result.stdout;
    };
    run(['install', '--ignore-scripts', '--no-save']);
    run(['run', 'wq-setup']);
    expect(existsSync(projectPaths(app).config)).toBe(true);
    expect(run(['run', 'wq-switch', 'status'])).toContain('Mode: NPM / UNMANAGED');
    expect(run(['run', 'wq-sandbox'])).toContain('sandbox launcher reached');
  }, 30000);
});

describe('WebQuark consumer paths', () => {
  it('creates a single ignored configuration directory and resolves source from the consumer root', () => {
    const { app, source } = fixture();
    const paths = projectPaths(app);
    expect(paths.config).toBe(join(app, '.webquark', '.webquark.json'));
    expect(paths.packages).toBe(join(app, '.webquark', 'generated', 'packages'));
    expect(paths.state).toBe(join(app, '.webquark', 'state', 'state.json'));
    expect(paths.journal).toBe(join(app, '.webquark', 'state', 'journal.json'));
    expect(readFileSync(join(app, '.gitignore'), 'utf8')).toContain('/.webquark/');
    const document = {
      sandbox: { port: 4444 },
      'wq-switch': { version: 1, source: relative(app, source), preferredVersion: '^9.1.0' },
    };
    writeJson(paths.config, document);
    setup(app);
    expect(json(paths.config)).toEqual(document);
    expect(sourceFor(app)).toBe(source);
  });

  it('rejects snapshot state outside generated packages before changing connections', () => {
    const { app, source } = fixture();
    const state = stage(app, source);
    activate(app, state);
    const target = state.entries[0].target;
    state.generation = source;
    writeJson(projectPaths(app).state, state);
    expect(() => restore(app)).toThrow('Invalid switch generation path');
    expect(linkTarget(state.entries[0].slot)).toBe(target);
  });

  it('rejects targets outside their snapshot generation before changing connections', () => {
    const { app, source } = fixture();
    const state = stage(app, source);
    activate(app, state);
    const target = state.entries[0].target;
    state.entries[0].target = source;
    writeJson(projectPaths(app).state, state);
    expect(() => restore(app)).toThrow('Invalid switch state paths');
    expect(linkTarget(state.entries[0].slot)).toBe(target);
  });
});

describe('local preflight diagnostics', () => {
  it('reports actual snapshot version separately from preference without writing files', () => {
    const { app, source } = fixture();
    for (const name of names) {
      const directory = join(source, packageDirectories[name]);
      const pkg = manifest(directory); pkg.version = '2.0.0';
      for (const field of [pkg.dependencies, pkg.peerDependencies]) for (const dependency of Object.keys(field ?? {})) if (names.includes(dependency as typeof name)) field![dependency] = '2.0.0';
      writeJson(join(directory, 'package.json'), pkg);
    }
    activate(app, stage(app, source));
    const before = readFileSync(projectPaths(app).state, 'utf8');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    check(app);
    const output = log.mock.calls.flat().join('\n');
    expect(output).toContain('Mode: LOCAL');
    expect(output).toContain('Preferred release: 1.0.0');
    expect(output).toContain('@webquark/core@2.0.0');
    expect(output).toContain('not a live source link');
    expect(output).toContain('restart the consumer dev server');
    expect(readFileSync(projectPaths(app).state, 'utf8')).toBe(before);
    expect(process.exitCode ?? 0).toBe(0);
  });

  it('reports a mixed installation even when the browser stylesheet resolves', () => {
    const { app, source } = fixture();
    const state = stage(app, source);
    activate(app, state);
    const wrapper = state.entries.find(entry => entry.name === '@webquark/angular')!;
    unlinkSync(wrapper.slot);
    pkg(wrapper.slot, '@webquark/angular');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    check(app);
    expect(log.mock.calls.flat().join('\n')).toContain('Mode: MIXED');
    expect(process.exitCode).toBe(1);
    expect(linkTarget(state.entries[0].slot)).toBe(state.entries[0].target);
  });
});
