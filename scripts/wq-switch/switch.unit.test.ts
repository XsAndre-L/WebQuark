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
import { activate, hasJournal, home, link, linkTarget, locked, readState, recover, restore, within } from './state';
import { json, manifest, sourceFor, writeJson } from './config';

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
  for (const name of ['core', wrapper]) {
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
  pkg(source, '@webquark/core', {
    scripts: { 'packages:build': 'bun build-fixture.ts' },
    files: ['dist', 'scripts/wq-switch/dist/index.js'],
    bin: { 'wq-switch': './scripts/wq-switch/dist/index.js' },
  });
  put(join(source, 'scripts/wq-switch/dist/index.js'), '#!/usr/bin/env node\nconsole.log("fixture CLI");');
  put(join(source, 'build-fixture.ts'), 'console.log("Built core, React and Angular fixture");');
  for (const kind of ['react', 'angular']) pkg(join(source, 'packages', kind), `@webquark/${kind}`, {
    peerDependencies: { '@webquark/core': '^1.0.0', ...(kind === wrapper ? { [framework]: '*' } : {}) },
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
      expect(installed(framework, installed(`@webquark/${wrapper}`, app))).toBe(installed(framework, app));
      expect(installed('@webquark/core', installed(`@webquark/${wrapper}`, app))).toBe(installed('@webquark/core', app));
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
    writeJson(join(home(app), 'journal.json'), { previous, next, operations });
    unlinkSync(next.entries[0].slot); link(next.entries[0].target, next.entries[0].slot);
    recover(app);
    expect(installed('@webquark/core', app)).toBe(previous.entries[0].target);
    expect(readState(app)?.generation).toBe(previous.generation);
  });
  it('recovers an interrupted initial switch before continuing', () => {
    const { app, source } = fixture();
    const next = stage(app, source);
    const operations = next.entries.map(e => ({ slot: e.slot, before: null, after: e.target, move: e.backup }));
    writeJson(join(home(app), 'journal.json'), { previous: null, next, operations });
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
    writeJson(join(home(app), 'journal.json'), { previous, next: null, operations });
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
    unlinkSync(join(app, '.webquark.json'));
    const pkg = manifest(app); pkg.dependencies!['@webquark/core'] = '^1.2.3';
    writeJson(join(app, 'package.json'), pkg);
    setup(app);
    const config = json<any>(join(app, '.webquark.json'));
    expect(config).toEqual({ 'wq-switch': { version: 1, source: '', preferredVersion: '^1.2.3' } });
    expect(() => sourceFor(app)).toThrow('Set source');
    expect(manifest(app).scripts).toMatchObject({ 'wq-sandbox': 'wq-sandbox', 'wq-switch': 'wq-switch' });
    config['wq-switch'].preferredVersion = '1.2.4'; writeJson(join(app, '.webquark.json'), config);
    setup(app);
    expect(json<any>(join(app, '.webquark.json'))['wq-switch'].preferredVersion).toBe('1.2.4');
  });
  it('adds switcher settings without losing other WebQuark settings', () => {
    const { app, source } = fixture();
    const previous = json<any>(join(app, '.webquark.json'))['wq-switch'];
    writeJson(join(app, '.webquark.json'), { sandbox: { port: 4444 } });
    expect(() => sourceFor(app)).toThrow('First run');
    setup(app, source);
    expect(json<any>(join(app, '.webquark.json'))).toEqual({ sandbox: { port: 4444 }, 'wq-switch': previous });
    expect(readFileSync(join(app, '.gitignore'), 'utf8')).toContain('/.webquark.json');
    setup(app);
    expect(json<any>(join(app, '.webquark.json')).sandbox).toEqual({ port: 4444 });
  });
  it.each([null, [], { 'wq-switch': null }, { 'wq-switch': { version: 2, source: '' } }])('rejects malformed shared configuration without overwriting it: %j', invalid => {
    const { app } = fixture();
    writeJson(join(app, '.webquark.json'), invalid);
    const before = readFileSync(join(app, '.webquark.json'), 'utf8');
    expect(() => setup(app)).toThrow('Invalid');
    expect(readFileSync(join(app, '.webquark.json'), 'utf8')).toBe(before);
  });
  it('does not overwrite custom scripts or write a partial setup for a script conflict', () => {
    const { app } = fixture();
    const pkg = manifest(app); pkg.scripts!['wq-switch'] = 'custom-command'; writeJson(join(app, 'package.json'), pkg);
    const config = readFileSync(join(app, '.webquark.json'), 'utf8');
    expect(() => setup(app)).toThrow('custom wq-switch');
    expect(readFileSync(join(app, '.webquark.json'), 'utf8')).toBe(config);
    expect(manifest(app).scripts!['wq-switch']).toBe('custom-command');
  });
  it('runs installed wq-setup and generated short scripts through Bun', () => {
    const base = mkdtempSync(join(tmpdir(), 'wq-switch-test-')); temporary.push(base);
    const core = join(base, 'core'), app = join(base, 'app');
    writeJson(join(core, 'package.json'), { name: '@webquark/core', version: '1.2.3', bin: { 'wq-setup': 'scripts/setup.js', 'wq-switch': 'scripts/index.js', 'wq-sandbox': 'scripts/sandbox.js' } });
    mkdirSync(join(core, 'scripts'));
    cpSync(resolve('scripts/wq-switch/dist/index.js'), join(core, 'scripts/index.js'));
    cpSync(resolve('scripts/wq-switch/dist/setup.js'), join(core, 'scripts/setup.js'));
    put(join(core, 'scripts/sandbox.js'), '#!/usr/bin/env node\nconsole.log("sandbox launcher reached");');
    writeJson(join(app, 'package.json'), { name: 'consumer', dependencies: { '@webquark/core': 'file:../core' } });
    const run = (args: string[]) => {
      const result = spawnSync('bun', args, { cwd: app, encoding: 'utf8', timeout: 20000 });
      expect(result.status, result.stderr || String(result.error)).toBe(0); return result.stdout;
    };
    run(['install', '--ignore-scripts', '--no-save']);
    run(['run', 'wq-setup']);
    expect(run(['run', 'wq-switch', 'status'])).toContain('Mode: NPM / UNMANAGED');
    expect(run(['run', 'wq-sandbox'])).toContain('sandbox launcher reached');
  }, 30000);
});


describe('local preflight diagnostics', () => {
  it('reports actual snapshot version separately from preference without writing files', () => {
    const { app, source } = fixture();
    writeJson(join(source, 'package.json'), {
      ...manifest(source), version: '2.0.0',
      exports: { './native-content.css': './dist/webquark/native-content.css' },
    });
    put(join(source, 'dist/webquark/native-content.css'), 'body {}');
    activate(app, stage(app, source));
    const before = readFileSync(join(home(app), 'state.json'), 'utf8');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    check(app);
    const output = log.mock.calls.flat().join('\n');
    expect(output).toContain('Mode: LOCAL');
    expect(output).toContain('Preferred release: 1.0.0');
    expect(output).toContain('@webquark/core@2.0.0');
    expect(output).toContain('not a live source link');
    expect(output).toContain('restart the consumer dev server');
    expect(readFileSync(join(home(app), 'state.json'), 'utf8')).toBe(before);
    expect(process.exitCode ?? 0).toBe(0);
  });

  it('reports a mixed installation even when the core stylesheet resolves', () => {
    const { app, source } = fixture();
    writeJson(join(source, 'package.json'), {
      ...manifest(source), exports: { './native-content.css': './dist/webquark/native-content.css' },
    });
    put(join(source, 'dist/webquark/native-content.css'), 'body {}');
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
