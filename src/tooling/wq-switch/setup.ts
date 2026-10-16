#!/usr/bin/env node
import { routeSetupCommand } from './cli/router';

async function main(): Promise<void> {
  await routeSetupCommand(process.argv.slice(2));
}

main().catch(error => {
  console.error(`wq-setup: ${error.message}`);
  process.exitCode = 1;
});
