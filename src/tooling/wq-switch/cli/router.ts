import { consumerRoot } from '../domains/workspace';
import { recover } from '../workflows';
import { locked } from '../infrastructure/concurrency/process-lock';
import { setup } from '../commands/setup-command';
import { build } from '../commands/build-command';
import { local } from '../commands/local-command';
import { npm } from '../commands/npm-command';
import { status } from '../commands/status-command';
import { check } from '../commands/check-command';
import { setupHelpText, switchHelpText } from './help-text';

/** Parses command line arguments and routes execution to the appropriate wq-switch command handler. */
export async function routeSwitchCommand(args: string[]): Promise<void> {
  const [command, ...rest] = args;
  if (!command || command === '--help' || command === '-h') {
    console.log(switchHelpText);
    return;
  }
  if (!['setup', 'local', 'build', 'npm', 'status', 'check'].includes(command)) {
    throw new Error(`Unknown command: ${command}\n${switchHelpText}`);
  }
  if (command === 'setup' ? rest.length !== 0 && (rest.length !== 2 || rest[0] !== '--source') : rest.length !== 0) {
    throw new Error(switchHelpText);
  }
  const root = consumerRoot();
  if (command === 'check') {
    check(root);
    return;
  }
  if (command === 'status') {
    status(root);
    return;
  }
  await locked(`consumer:${root}`, async () => {
    recover(root);
    switch (command) {
      case 'setup':
        setup(root, rest[1]);
        break;
      case 'local':
        await local(root);
        break;
      case 'build':
        await build(root);
        break;
      case 'npm':
        npm(root);
        break;
    }
  });
}

/** Parses arguments and executes the standalone wq-setup command with recovery under consumer lock. */
export async function routeSetupCommand(args: string[]): Promise<void> {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log(setupHelpText);
    return;
  }
  if (args.length && (args.length !== 2 || args[0] !== '--source')) {
    throw new Error(setupHelpText);
  }
  const root = consumerRoot();
  await locked(`consumer:${root}`, async () => {
    recover(root);
    setup(root, args[1]);
  });
}
