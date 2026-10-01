import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readWebQuarkConfig, readSwitchConfig, manifest, selectedPackages, validateSource, writeJson, type SwitchConfig } from '../config';
import { hasJournal, readState } from '../state';
import { projectPaths } from '../paths';

export function setup(root: string, source?: string): void {
  selectedPackages(root);
  if (hasJournal(root)) throw new Error('Run wq-switch npm to recover the interrupted switch before changing configuration.');
  if (readState(root)) throw new Error('Stop the dev server and run wq-switch npm before changing configuration.');
  const file = projectPaths(root).config;
  const document = readWebQuarkConfig(root);
  const previous = readSwitchConfig(root);
  const pkg = manifest(root);
  const scripts = { 'wq-sandbox': 'wq-sandbox', 'wq-switch': 'wq-switch', 'wq-check': 'wq-switch check' };
  for (const [name, command] of Object.entries(scripts)) {
    if (pkg.scripts?.[name] && pkg.scripts[name] !== command) throw new Error(`package.json already has a custom ${name} script. Rename it before running setup; no files were changed.`);
  }
  const config: SwitchConfig = {
    ...previous,
    version: 1,
    source: source === undefined ? previous?.source ?? '' : validateSource(resolve(root, source)),
    preferredVersion: previous?.preferredVersion ?? pkg.dependencies?.['@webquark/core'] ?? pkg.devDependencies!['@webquark/core'],
  };
  writeJson(file, { ...document, 'wq-switch': config });
  writeJson(join(root, 'package.json'), { ...pkg, scripts: { ...pkg.scripts, ...scripts } });
  const ignore = join(root, '.gitignore');
  const current = existsSync(ignore) ? readFileSync(ignore, 'utf8') : '';
  const missing = ['/.webquark/', '/node_modules/'].filter(line => !current.split(/\r?\n/).includes(line));
  if (missing.length) appendFileSync(ignore, '\n# Local WebQuark development\n' + missing.join('\n') + '\n');
  console.log(`Created/updated .webquark/.webquark.json and package scripts.\nPreferred release: ${config.preferredVersion}\n${config.source ? `Source: ${config.source}\nNext: bun run wq-switch local` : 'Next: fill in wq-switch.source in .webquark/.webquark.json before switching locally.'}\nSandbox: bun run wq-sandbox\nStatus: bun run wq-switch status`);
}
