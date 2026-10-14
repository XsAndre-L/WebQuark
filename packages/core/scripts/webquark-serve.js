#!/usr/bin/env node
import('@webquark/tooling/sandbox').then(({ startSandbox }) => {
  startSandbox(require('node:path').resolve(__dirname, '../dist/playground'));
}).catch(error => { console.error(error); process.exitCode = 1; });
