#!/usr/bin/env bun
import { runChangelogCli } from '../index.js';

process.exitCode = await runChangelogCli(process.argv.slice(2));
