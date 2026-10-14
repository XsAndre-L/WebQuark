import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { readWebQuarkConfig, resolveSwitchConfig, manifest, selectedPackages, validateSource, workspaceMembers, workspaceRoot, writeJson, type SwitchConfig } from '../config';
import { hasJournal, readState } from '../state';
import { projectPaths } from '../paths';

export function setup(root: string, source?: string): void {
  const selected = selectedPackages(root);
  if (hasJournal(root)) throw new Error('Run wq-switch npm to recover the interrupted switch before changing configuration.');
  if (readState(root)) throw new Error('Stop the dev server and run wq-switch npm before changing configuration.');
  const resolved = resolveSwitchConfig(root);
  const inherited = resolved && resolved.root !== root;
  const file = resolved?.file ?? projectPaths(root).config;
  const document = readWebQuarkConfig(root);
  const previous = resolved?.config;
  const pkg = manifest(root);
  const explicitToolingSwitch = 'node node_modules/@webquark/tooling/dist/wq-switch/index.cjs';
  // Bun patches do not add new launchers from a patched package's bin metadata.
  // Preserve this exact installed-package entrypoint when the consumer uses it.
  const directTooling = pkg.scripts?.['wq-switch'] === explicitToolingSwitch;
  const scripts = { 'wq-sandbox': 'wq-sandbox', 'wq-switch': directTooling ? explicitToolingSwitch : 'wq-switch', 'wq-check': directTooling ? 'bun run wq-switch check' : 'wq-switch check' };
  for (const [name, command] of Object.entries(scripts)) {
    if (pkg.scripts?.[name] && pkg.scripts[name] !== command) throw new Error(`package.json already has a custom ${name} script. Rename it before running setup; no files were changed.`);
  }
  const requestedSource = source === undefined ? undefined : validateSource(resolve(root, source));
  if (inherited && requestedSource !== undefined && (!previous!.source || requestedSource !== validateSource(resolve(resolved.root, previous!.source)))) {
    throw new Error(`Configuration is inherited from ${file}. Run setup in ${resolved.root} to change its source; no files were changed.`);
  }
  const config: SwitchConfig = inherited ? previous! : {
    ...previous,
    version: 1,
    source: requestedSource ?? previous?.source ?? '',
    preferredVersion: previous?.preferredVersion ?? selected.map(name => pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]).find(Boolean),
  };
  if (!inherited && JSON.stringify(previous) !== JSON.stringify(config)) {
    for (const member of workspaceMembers(workspaceRoot(root))) {
      const memberConfig = resolveSwitchConfig(member);
      const descendant = relative(root, member);
      const wouldInherit = !memberConfig && descendant !== '' && !descendant.startsWith('..') && !isAbsolute(descendant);
      if ((wouldInherit || memberConfig?.file === file) && (hasJournal(member) || readState(member))) {
        throw new Error(`Shared configuration is used by active or interrupted consumer ${member}. Restore its npm connections before changing ${file}; no files were changed.`);
      }
    }
    writeJson(file, { ...document, 'wq-switch': config });
  }
  writeJson(join(root, 'package.json'), { ...pkg, scripts: { ...pkg.scripts, ...scripts } });
  const ignore = join(root, '.gitignore');
  const current = existsSync(ignore) ? readFileSync(ignore, 'utf8') : '';
  const missing = ['/.webquark/', '/node_modules/'].filter(line => !current.split(/\r?\n/).includes(line));
  if (missing.length) appendFileSync(ignore, '\n# Local WebQuark development\n' + missing.join('\n') + '\n');
  console.log(`${inherited ? 'Reusing inherited configuration' : 'Configuration'}: ${file}\nUpdated consumer package scripts.\nPreferred release: ${config.preferredVersion}\n${config.source ? `Source: ${config.source}\nNext: bun run wq-switch local` : `Next: fill in wq-switch.source in ${file} before switching locally.`}\nSandbox: bun run wq-sandbox\nStatus: bun run wq-switch status`);
}
