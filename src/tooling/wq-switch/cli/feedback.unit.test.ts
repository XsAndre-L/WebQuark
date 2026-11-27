import { afterEach, describe, expect, it, vi } from 'vitest';
import { join } from 'node:path';
import { LauncherMismatchError } from '../domains/launchers/launcher-transaction';
import { reportFailure } from './feedback';

afterEach(() => {
  process.exitCode = 0;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('WebQuark failure feedback', () => {
  it('shows the cause, relative path and available diagnostic command without inventing a repair', () => {
    vi.stubEnv('NO_COLOR', '1');
    const output = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = process.cwd();

    reportFailure(new LauncherMismatchError(join(root, 'node_modules/.bin/wq-sandbox.exe')), root, 'WebQuark check failed');

    const message = output.mock.calls[0][0] as string;
    expect(message).toContain('WebQuark check failed');
    expect(message).toContain('wq-sandbox.exe');
    expect(message).toContain('.webquark/state/state.json');
    expect(message).toContain('bun run wq-switch status');
    expect(message).toContain('Automatic recovery for this mismatch is unavailable.');
    expect(message).not.toContain(root);
    expect(message).not.toContain('repair --npm');
    expect(message).not.toContain('changed by another install');
    expect(message).not.toContain('\x1b');
    expect(process.exitCode).toBe(1);
  });

  it('uses color hierarchy when explicitly enabled', () => {
    vi.stubEnv('NO_COLOR', undefined);
    vi.stubEnv('TERM', 'xterm');
    vi.stubEnv('FORCE_COLOR', '1');
    const output = vi.spyOn(console, 'error').mockImplementation(() => {});

    reportFailure(new LauncherMismatchError(join(process.cwd(), 'node_modules/.bin/wq-sandbox.exe')), process.cwd());

    const message = output.mock.calls[0][0] as string;
    expect(message).toContain('\x1b[1;31m');
    expect(message).toContain('\x1b[1;36m');
    expect(message).toContain('\x1b[2;3m');
  });

  it.each([
    { NO_COLOR: '1', FORCE_COLOR: '1', TERM: 'xterm' },
    { NO_COLOR: undefined, FORCE_COLOR: '0', TERM: 'xterm' },
    { NO_COLOR: undefined, FORCE_COLOR: '1', TERM: 'dumb' },
  ])('respects plain-output settings %j', environment => {
    for (const [name, value] of Object.entries(environment))
      vi.stubEnv(name, value);

    const output = vi.spyOn(console, 'error').mockImplementation(() => {});
    reportFailure(new Error('Package unavailable'), process.cwd());

    expect(output.mock.calls[0][0]).not.toContain('\x1b');
  });
});
