#!/usr/bin/env node
import { routeSetupCommand } from './cli/router';
import { reportFailure } from './cli/feedback';

async function main(): Promise<void> {
  await routeSetupCommand(process.argv.slice(2));
}

main().catch(error => {
  reportFailure(error, process.cwd(), 'WebQuark setup failed');
});
