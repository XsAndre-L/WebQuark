import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = resolve('packages/browser/angular/scripts/verify-angular-drift.ts');

function checkHost(wrapper: string, angular: string) {
  const directory = mkdtempSync(join(tmpdir(), 'webquark-drift-test-'));
  try {
    const manifest = join(directory, 'package.json');
    writeFileSync(manifest, JSON.stringify({
      dependencies: { '@webquark/angular': wrapper, '@angular/core': angular },
    }));
    return spawnSync('bun', [script], {
      encoding: 'utf8',
      env: { ...process.env, INSTOREFOCUS_FRONTEND_PATH: manifest },
    });
  } finally {
    if (!resolve(directory).startsWith(resolve(tmpdir(), 'webquark-drift-test-'))) {
      throw new Error(`Unexpected test directory: ${directory}`);
    }
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('Angular sibling drift check', () => {
  it('allows a published wrapper consumer to use a different Angular build version', () => {
    const result = checkHost('1.1.0-dev.2', '^22.0.7');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('does not locally link');
  });

  it.each(['file:../../WebQuark/packages/browser/angular', 'link:../../WebQuark/packages/browser/angular', 'workspace:*'])(
    'retains the drift guard for %s', wrapper => {
      const result = checkHost(wrapper, '^22.0.7');
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Angular version drift detected');
    },
  );

  it('allows a local link with aligned Angular versions', () => {
    const result = checkHost('file:../../WebQuark/packages/browser/angular', '21.2.20');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Verified Angular version alignment');
  });
});
