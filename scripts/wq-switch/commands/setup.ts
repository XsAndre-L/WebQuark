import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { json, manifest, selectedPackages, validateSource, writeJson, type SwitchConfig } from '../config';
import { readState } from '../state';

export function setup(root: string, source?: string): void {
  selectedPackages(root);
  if (readState(root)) throw new Error('Run wq-switch npm before changing configuration.');
  const file = join(root, '.wq-switch.json');
  const previous = existsSync(file) ? json<SwitchConfig>(file) : undefined;
  if (previous && (previous.version !== 1 || typeof previous.source !== 'string' || (previous.preferredVersion !== undefined && typeof previous.preferredVersion !== 'string'))) throw new Error('Invalid .wq-switch.json; existing configuration was not overwritten.');
  const pkg = manifest(root);
  const scripts = { 'wq-sandbox': 'wq-sandbox', 'wq-switch': 'wq-switch' };
  for (const [name, command] of Object.entries(scripts)) {
    if (pkg.scripts?.[name] && pkg.scripts[name] !== command) throw new Error(`package.json already has a custom ${name} script. Rename it before running setup; no files were changed.`);
  }
  const config: SwitchConfig = {
    ...previous,
    version: 1,
    source: source === undefined ? previous?.source ?? '' : validateSource(resolve(root, source)),
    preferredVersion: previous?.preferredVersion ?? pkg.dependencies?.['@webquark/core'] ?? pkg.devDependencies!['@webquark/core'],
  };
  writeJson(file, config);
  writeJson(join(root, 'package.json'), { ...pkg, scripts: { ...pkg.scripts, ...scripts } });
  const ignore = join(root, '.gitignore');
  const current = existsSync(ignore) ? readFileSync(ignore, 'utf8') : '';
  const missing = ['/.wq-switch.json', '/.wq-switch/', '/node_modules/'].filter(line => !current.split(/\r?\n/).includes(line));
  if (missing.length) appendFileSync(ignore, '\n# Local WebQuark development\n' + missing.join('\n') + '\n');
  console.log(`Created/updated .wq-switch.json and package scripts.\nPreferred release: ${config.preferredVersion}\n${config.source ? `Source: ${config.source}\nNext: bun run wq-switch local` : 'Next: fill in source in .wq-switch.json before switching locally.'}\nSandbox: bun run wq-sandbox\nStatus: bun run wq-switch status`);
}
