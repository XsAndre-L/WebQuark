#!/usr/bin/env node
import { routeSwitchCommand } from './cli/router';

async function main(): Promise<void> {
  await routeSwitchCommand(process.argv.slice(2));
}

main().catch(error => {
  console.error(`wq-switch: ${error.message}`);
  process.exitCode = 1;
});
