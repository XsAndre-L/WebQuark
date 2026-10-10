import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { generateWhatsNew } from './notes/feed.js';
import { checkVersions, prepareRelease, versionStatus } from './versioning/index.js';
import type { ChangelogConfig } from './config/index.js';
export * from './config/index.js';
export * from './notes/index.js';
export * from './versioning/index.js';
export * from './shared/capture-format.js';
export * from './shared/release-content-lock.js';
export * from './captures/index.js';

export async function runChangelogCli(args: readonly string[]): Promise<number> {
  if (!args.length || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: wq-changelog notes|version check|version status|release|capture --config <reviewed-config-module> [--include-unreleased]');
    return 0;
  }
  try {
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
