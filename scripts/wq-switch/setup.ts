#!/usr/bin/env node
import { consumerRoot } from './config';
import { setup } from './commands/setup';
import { locked, recover } from './state';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const help = 'wq-setup [--source <path>]\nCreates .wq-switch.json and wq-sandbox/wq-switch package scripts in the consuming project.';
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) { console.log(help); return; }
  if (args.length && (args.length !== 2 || args[0] !== '--source')) throw new Error(help);
  const root = consumerRoot();
  await locked(`consumer:${root}`, async () => { recover(root); setup(root, args[1]); });
}
main().catch(error => { console.error(`wq-setup: ${error.message}`); process.exitCode = 1; });
