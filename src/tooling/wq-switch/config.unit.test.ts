import { afterEach, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { consumerRoot, names, packageDirectories, readSwitchConfig, resolveSwitchConfig, sourceFor, workspaceRoot, writeJson } from './config';
import { projectPaths } from './paths';
import { setup } from './commands/setup';
import { status } from './commands/status';

const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); vi.restoreAllMocks(); process.exitCode = 0; });
function fixture(workspaces: string[] | { packages: string[] } = ['frontend', 'backend/libs/*']) {
  const base = mkdtempSync(join(tmpdir(), 'wq-config-test-')); temporary.push(base);
  const root = join(base, 'workspace'), child = join(root, 'frontend'), source = join(base, 'source');
  const consumer = { name: 'consumer', dependencies: { '@webquark/tooling': '1.0.0' } };
  writeJson(join(root, 'package.json'), { ...consumer, workspaces }); writeJson(join(child, 'package.json'), consumer);
  writeJson(join(source, 'package.json'), { name: 'source', private: true, scripts: { 'packages:build': 'build' } });
  for (const name of names) writeJson(join(source, packageDirectories[name], 'package.json'), { name });
  writeJson(projectPaths(root).config, { 'wq-switch': { version: 1, source: relative(root, source), preferredVersion: '1.0.0' }, unrelated: true });
  return { base, root, child, source, consumer };
}

it('shares root source without changing consumer identity, state, or snapshot paths', () => {
  const { root, child, source } = fixture();
  expect(sourceFor(root)).toBe(source); expect(sourceFor(child)).toBe(source);
  expect(resolveSwitchConfig(child)?.file).toBe(projectPaths(root).config);
  expect(consumerRoot(child)).toBe(child);
  expect(projectPaths(child).packages).not.toBe(projectPaths(root).packages);
  expect(projectPaths(child).state).not.toBe(projectPaths(root).state);
});

it('uses the nearest complete override without merging preferences', () => {
  const { root, child, source } = fixture();
  writeJson(projectPaths(child).config, { 'wq-switch': { version: 1, source: relative(child, source) } });
  expect(resolveSwitchConfig(child)?.file).toBe(projectPaths(child).config);
  expect(readSwitchConfig(child)?.preferredVersion).toBeUndefined();
  expect(sourceFor(child)).toBe(source); expect(readSwitchConfig(root)?.preferredVersion).toBe('1.0.0');
});

it('rejects an invalid nearer config instead of using the workspace config', () => {
  const { child } = fixture();
  writeJson(projectPaths(child).config, { 'wq-switch': { version: 2, source: '' } });
  expect(() => resolveSwitchConfig(child)).toThrow('Invalid');
  writeFileSync(projectPaths(child).config, '{');
  expect(() => resolveSwitchConfig(child)).toThrow();
});

it('recognizes object workspace globs and allows an intermediate override within the boundary', () => {
  const { root, source, consumer } = fixture({ packages: ['frontend', 'backend/libs/*'] });
  const nested = join(root, 'backend/libs/shared'); writeJson(join(nested, 'package.json'), consumer);
  expect(workspaceRoot(nested)).toBe(root); expect(sourceFor(nested)).toBe(source);
  const owner = join(root, 'backend');
  writeJson(projectPaths(owner).config, { 'wq-switch': { version: 1, source: relative(owner, source), preferredVersion: 'override' } });
  expect(resolveSwitchConfig(nested)?.root).toBe(owner); expect(sourceFor(nested)).toBe(source);
});

it('does not inherit outside declared workspace membership or through a nested workspace root', () => {
  const { root, consumer } = fixture(['other']);
  const standalone = join(root, 'frontend');
  expect(workspaceRoot(standalone)).toBe(standalone); expect(resolveSwitchConfig(standalone)).toBeUndefined();
  writeJson(join(root, 'package.json'), { ...consumer, workspaces: ['frontend'] });
  writeJson(join(standalone, 'package.json'), { ...consumer, workspaces: [] });
  expect(resolveSwitchConfig(standalone)).toBeUndefined();
});

it('reuses inherited config during setup without creating a duplicate or changing root bytes', () => {
  const { root, child, source } = fixture();
  const before = readFileSync(projectPaths(root).config, 'utf8');
  setup(child); setup(child, source);
  expect(readFileSync(projectPaths(root).config, 'utf8')).toBe(before);
  expect(existsSync(projectPaths(child).config)).toBe(false);
  expect(JSON.parse(readFileSync(join(child, 'package.json'), 'utf8')).scripts['wq-switch']).toBe('wq-switch');
});

it('refuses changing inherited settings and shared settings used by an interrupted sibling', () => {
  const { base, root, child, source } = fixture();
  const other = join(base, 'other-source');
  writeJson(join(other, 'package.json'), { private: true, scripts: { 'packages:build': 'build' } });
  for (const name of names) writeJson(join(other, packageDirectories[name], 'package.json'), { name });
  const rootBefore = readFileSync(projectPaths(root).config, 'utf8');
  const childBefore = readFileSync(join(child, 'package.json'), 'utf8');
  expect(() => setup(child, other)).toThrow('inherited');
  expect(readFileSync(join(child, 'package.json'), 'utf8')).toBe(childBefore);
  writeJson(projectPaths(child).journal, {});
  expect(() => setup(root, other)).toThrow('active or interrupted consumer');
  expect(readFileSync(projectPaths(root).config, 'utf8')).toBe(rootBefore);
  expect(sourceFor(child)).toBe(source);
});

it('preserves standalone and no-config setup behavior', () => {
  const { root, child } = fixture();
  rmSync(projectPaths(root).config);
  expect(resolveSwitchConfig(child)).toBeUndefined(); expect(() => sourceFor(child)).toThrow('First run');
  setup(child);
  expect(existsSync(projectPaths(child).config)).toBe(true);
  expect(existsSync(projectPaths(root).config)).toBe(false);
  expect(() => sourceFor(child)).toThrow('Set source');
  const standalone = join(dirname(root), 'standalone'); writeJson(join(standalone, 'package.json'), { name: 'standalone', dependencies: { '@webquark/tooling': '1' } });
  setup(standalone); expect(resolveSwitchConfig(standalone)?.root).toBe(standalone);
});

it('protects an active descendant when an intermediate configuration owner changes settings', () => {
  const { root, source, consumer } = fixture(['frontend', 'backend', 'backend/libs/*']);
  const owner = join(root, 'backend'), member = join(owner, 'libs/shared');
  writeJson(join(owner, 'package.json'), consumer); writeJson(join(member, 'package.json'), consumer);
  writeJson(projectPaths(owner).config, { 'wq-switch': { version: 1, source: relative(owner, source), preferredVersion: '1' } });
  writeJson(projectPaths(member).journal, {});
  const before = readFileSync(projectPaths(owner).config, 'utf8');
  expect(() => setup(owner, source)).toThrow('active or interrupted consumer');
  expect(readFileSync(projectPaths(owner).config, 'utf8')).toBe(before);
});

it('reports the exact shared configuration path and resolved source', () => {
  const { root, child, source } = fixture();
  writeJson(join(child, 'node_modules/@webquark/tooling/package.json'), { name: '@webquark/tooling', version: '1' });
  const output = vi.spyOn(console, 'log').mockImplementation(() => {}); status(child);
  expect(output.mock.calls.flat().join('\n')).toContain(`Configuration: ${projectPaths(root).config}`);
  expect(output.mock.calls.flat().join('\n')).toContain(`Source: ${source}`);
});

it('preserves the explicit installed tooling command used by patched consumers', () => {
  const { root } = fixture();
  const file = join(root, 'package.json'), pkg = JSON.parse(readFileSync(file, 'utf8'));
  pkg.scripts = { 'wq-switch': 'node node_modules/@webquark/tooling/dist/wq-switch/index.cjs', 'wq-setup': 'node node_modules/@webquark/tooling/dist/wq-switch/setup.cjs' };
  writeJson(file, pkg); setup(root);
  const scripts = JSON.parse(readFileSync(file, 'utf8')).scripts;
  expect(scripts['wq-switch']).toBe(pkg.scripts['wq-switch']);
  expect(scripts['wq-setup']).toBe(pkg.scripts['wq-setup']);
  expect(scripts['wq-check']).toBe('bun run wq-switch check');
  setup(root);
});
