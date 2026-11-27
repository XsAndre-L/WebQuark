#!/usr/bin/env node
import { routeSwitchCommand } from './cli/router';
import { reportFailure } from './cli/feedback';

async function main(): Promise<void> {
  await routeSwitchCommand(process.argv.slice(2));
}

main().catch(error => {
  reportFailure(error, process.cwd(), process.argv[2] === 'check' ? 'WebQuark check failed' : 'WebQuark command failed');
});
