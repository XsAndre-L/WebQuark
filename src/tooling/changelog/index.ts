import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { generateWhatsNew } from './notes/feed.js';
import { checkVersions, prepareRelease, versionStatus } from './versioning/index.js';
import { captureCommandHelp } from './captures/config.js';
import type { ChangelogConfig } from './config/index.js';
import { initializeChangelog } from './init/index.js';
export * from './config/index.js';
export * from './notes/index.js';
export * from './versioning/index.js';
export * from './shared/capture-format.js';
export * from './shared/release-content-lock.js';
export * from './captures/index.js';

export async function runChangelogCli(args: readonly string[]): Promise<number> {
  if (!args.length || args.includes('--help') || args.includes('-h')) {
    console.log(changelogCommandHelp(args));
    return 0;
  }
  try {
    if (args[0] === 'init') {
      if (args.slice(1).some(token => token !== '--dry-run') || args.length > 2) throw new Error('Init accepts only --dry-run; run it from the package root.');
      const result = await initializeChangelog(process.cwd(), { dryRun: args.includes('--dry-run') });
      console.log(`${result.dryRun ? 'Would create/update' : 'Created/updated'}:\n${result.files.join('\n')}`);
      console.log(result.dryRun ? 'No files were changed. Next: wq-changelog init' : 'Next: bun run changelog:preview');
      return 0;
    }
    const tokens = [...args], position = tokens.indexOf('--config');
    const modulePath = position >= 0 ? tokens[position + 1] : undefined;
    if (!modulePath || modulePath.startsWith('--')) throw new Error('An explicit reviewed project config module is required.');
    tokens.splice(position, 2);
    // This is explicit trusted project code. Content JSON cannot select imports.
    const loaded = await import(pathToFileURL(resolve(modulePath)).href);
    const config = (loaded.default ?? loaded.changelogConfig) as ChangelogConfig;
    if (!config?.root) throw new Error('Config module must export changelogConfig or a default config.');
    if (tokens[0] === 'notes') {
      if (tokens.slice(1).some(token => token !== '--include-unreleased') || tokens.length > 2) throw new Error('Notes accepts only --include-unreleased.');
      const result = await generateWhatsNew(config, { includeUnreleased: tokens.includes('--include-unreleased'), environmentType: process.env.ENVIRONMENT_TYPE });
      console.log(`Generated ${result.releases} entries in ${result.outputDirectory}.`);
      console.log(`Feed URL: ${result.feedUrl}`);
    } else if (tokens[0] === 'capture') {
      const adapter = loaded.captureAdapter ?? await loaded.loadCaptureAdapter?.();
      if (!adapter) throw new Error('Capture requires a reviewed captureAdapter or loadCaptureAdapter export.');
      const { runCaptureCommand } = await import('./captures/index.js');
      await runCaptureCommand(config, adapter, tokens.slice(1));
    } else if (tokens.join(' ') === 'version check') {
      const result = await checkVersions(config);
      if (result.errors.length) { console.error(result.errors.join('\n')); return 1; }
      console.log(`Version check passed: ${result.sourceVersion}.`);
    } else if (tokens.join(' ') === 'version status') console.log(await versionStatus(config));
    else if (tokens.join(' ') === 'release') console.log(`Prepared v${(await prepareRelease(config)).version}.`);
    else throw new Error(`Unknown changelog command: ${tokens.join(' ')}.`);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function changelogCommandHelp(args: readonly string[]): string {
  const config = '--config <project-config-module>';
  if (args[0] === 'init') return [
    'Usage: wq-changelog init [--dry-run]',
    'Run from a package root with a stable X.Y.Z version and a declared, installed @webquark/tooling or @webquark/core dependency.',
    'Create changelog config, an empty Unreleased workspace, generation/preview scripts, and a basic static viewer.',
    'Preflight all conflicts; existing authored files and custom scripts are never overwritten. Repeated init refuses existing setup without changing files.',
    '--dry-run shows the planned paths without writing files. Setup does not install packages, change the version, or prepare a release.',
  ].join('\n');
  if (args[0] === 'notes') return [
    `Usage: wq-changelog notes ${config} [--include-unreleased]`,
    'Generate the release feed and copied visual assets in the configured output directory.',
    'Requires feedOutputDirectory and feedPublicPrefix. Text and ordinary manual visuals need no metadata adapter.',
    '--include-unreleased enables a development preview; prod and prod-rehearsal always omit Unreleased.',
  ].join('\n');
  if (args[0] === 'capture') return captureCommandHelp(args[1]);
  if (args[0] === 'release') return [
    `Usage: wq-changelog release ${config}`,
    'Synchronize configured version mirrors, archive active Unreleased notes, and create a fresh Unreleased folder.',
    'Run only when the release owner explicitly requests release preparation.',
  ].join('\n');
  if (args[0] === 'version') return [
    `Usage: wq-changelog version check ${config}`,
    `       wq-changelog version status ${config}`,
    'Inspect configured version consistency or status without changing files.',
  ].join('\n');
  return [
    'Usage: wq-changelog init [--dry-run]',
    `Usage: wq-changelog <command> ${config}`,
    'Commands: init, notes, version check, version status, release, capture stage, capture publish <run-id>.',
    'Use <command> --help for its options. The config module exports a default config or changelogConfig.',
  ].join('\n');
}
