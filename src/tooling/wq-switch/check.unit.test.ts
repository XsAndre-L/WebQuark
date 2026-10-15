import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { check } from './commands/check';
import { within } from './state';

const roots: string[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    if (!within(tmpdir(), root) || !root.includes('wq-check-test-')) throw new Error('Unexpected cleanup path');
    rmSync(root, { recursive: true, force: true });
  }
});
function fixture(exported: boolean, exists: boolean, umbrella = false): string {
  const root = mkdtempSync(join(tmpdir(), 'wq-check-test-')); roots.push(root);
  const name = umbrella ? '@webquark/core' : '@webquark/browser';
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'consumer', dependencies: { [name]: '1.0.0' } }));
  const directory = join(root, 'node_modules', name);
  mkdirSync(join(directory, 'dist/webquark'), { recursive: true });
  const entry = umbrella ? './browser/native-content.css' : './native-content.css';
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name, exports: exported ? { [entry]: './dist/webquark/native-content.css' } : { '.': './index.js' } }));
  if (exists) writeFileSync(join(directory, 'dist/webquark/native-content.css'), 'body {}');
  return root;
}
describe('native-content stylesheet preflight', () => {
  it('catches the dev.6 missing export even when the CSS file exists', () => {
    expect(() => check(fixture(false, true))).toThrow(/Could not resolve.*native-content.css/);
  });
  it('points to setup and activation when the export is absent', () => {
    expect(() => check(fixture(false, false))).toThrow(/wq-setup[\s\S]*wq-switch local/);
  });
  it('rejects an export whose built file was omitted', () => {
    expect(() => check(fixture(true, false))).toThrow(/include its built CSS file/);
  });
  it('accepts a complete published package without local setup', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => check(fixture(true, true))).not.toThrow();
  });
  it('accepts the umbrella browser forwarding stylesheet', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => check(fixture(true, true, true))).not.toThrow();
  });
  it('checks tooling entries without requiring a browser stylesheet', () => {
    const root = fixture(false, false);
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'consumer', dependencies: { '@webquark/tooling': '1.0.0' } }));
    const directory = join(root, 'node_modules/@webquark/tooling'); mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: '@webquark/tooling' }));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => check(root)).not.toThrow();
  });
});
