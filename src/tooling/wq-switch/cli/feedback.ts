import { relative } from 'node:path';
import { LauncherMismatchError } from '../domains/launchers/launcher-transaction';

function style(text: string, codes: string, stream: NodeJS.WriteStream): string {
  const enabled =
    process.env.NO_COLOR === undefined &&
    process.env.TERM !== 'dumb' &&
    (process.env.FORCE_COLOR !== undefined ? process.env.FORCE_COLOR !== '0' : stream.isTTY);

  return enabled ? `\x1b[${codes}m${text}\x1b[0m` : text;
}

export function reportFailure(
  error: unknown,
  root: string,
  heading = 'WebQuark command failed',
  showStatusHint = true,
): void {
  const bold = (text: string) => style(text, '1', process.stderr);
  const lines = [
    style(heading, '1;31', process.stderr),
    '',
    error instanceof Error ? error.message : String(error),
  ];

  if (error instanceof LauncherMismatchError) {
    const file = relative(root, error.file) || error.file;

    lines.push(
      '',
      `File    ${bold(file)}`,
      style('Record  .webquark/state/state.json', '2', process.stderr),
      '',
      style('The check cannot identify which process changed this launcher.', '2;3', process.stderr),
    );
  }

  if (showStatusHint) {
    lines.push(
      '',
      bold('Next step'),
      'Inspect the installed packages and saved setup from this project folder.',
      style('  bun run wq-switch status', '1;36', process.stderr),
    );
  }

  if (error instanceof LauncherMismatchError) {
    lines.push(
      '',
      'Automatic recovery for this mismatch is unavailable.',
      'The saved setup and installed files need manual reconciliation before retrying.',
      style('Keep the saved state and package backups until recovery is complete.', '2', process.stderr),
    );
  }

  console.error(lines.join('\n'));
  process.exitCode = 1;
}

export function reportSuccess(): void {
  console.log(style('WebQuark check passed', '1;32', process.stdout));
}
