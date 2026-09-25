#!/usr/bin/env node
import { consumerRoot } from './config';
import { locked, recover } from './state';
import { setup } from './commands/setup';
import { build } from './commands/build';
import { local } from './commands/local';
import { npm } from './commands/npm';
import { status } from './commands/status';

const help = `wq-switch — run inside the consuming project

  setup [--source <path>] Create configuration and package scripts (also: wq-setup)
  local                  Build all packages and activate local snapshots
  build                  Build all packages; refresh snapshots if already local
  npm                    Restore original installed packages (no upgrade)
  status                 Inspect actual package connections
`;
async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h') { console.log(help); return; }
  if (!['setup', 'local', 'build', 'npm', 'status'].includes(command)) throw new Error(`Unknown command: ${command}\n${help}`);
  if (command === 'setup' ? args.length !== 0 && (args.length !== 2 || args[0] !== '--source') : args.length !== 0) throw new Error(help);
  const root = consumerRoot();
  if (command === 'status') { status(root); return; }
  await locked(`consumer:${root}`, async () => {
    recover(root);
    switch (command) {
      case 'setup': setup(root, args[1]); break;
      case 'local': await local(root); break;
      case 'build': await build(root); break;
      case 'npm': npm(root); break;
    }
  });
}
main().catch(error => { console.error(`wq-switch: ${error.message}`); process.exitCode = 1; });
