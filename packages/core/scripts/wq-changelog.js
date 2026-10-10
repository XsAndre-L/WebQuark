#!/usr/bin/env bun
import('@webquark/tooling/changelog').then(async ({ runChangelogCli }) => {
  process.exitCode = await runChangelogCli(process.argv.slice(2));
}).catch(error => { console.error(error); process.exitCode = 1; });
