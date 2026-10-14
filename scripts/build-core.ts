import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';

const root = resolve(import.meta.dir, '..');
const core = resolve(root, 'packages/core');
const browser = resolve(root, 'packages/browser/components');

function ownedPath(path: string): string {
  const resolved = resolve(core, path);
  if (!resolved.startsWith(core + sep)) throw new Error(`Output is outside the umbrella package: ${resolved}`);
  return resolved;
}

function write(path: string, contents: string): void {
  const output = ownedPath(path);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, contents);
}

function forward(path: string, entry: string, commonjs = false): void {
  write(`${path}.js`, `export * from '${entry}';\n`);
  write(`${path}.d.ts`, `export * from '${entry}';\n`);
  if (commonjs) write(`${path}.cjs`, `module.exports = require('${entry}');\n`);
}

// Only package-owned generated artifacts are cleared; .stencil/.build is untouched.
rmSync(ownedPath('dist'), { recursive: true, force: true });
rmSync(ownedPath('scripts'), { recursive: true, force: true });
forward('dist/browser/index', '@webquark/browser', true);
forward('dist/browser/loader/index', '@webquark/browser/loader', true);
for (const file of readdirSync(resolve(browser, 'dist/components'))) {
  if (file.endsWith('.d.ts')) {
    const name = file.slice(0, -5);
    forward(`dist/browser/components/${name}`, name === 'index' ? '@webquark/browser/components' : `@webquark/browser/components/${name}.js`);
  }
}
forward('dist/tooling/changelog/index', '@webquark/tooling/changelog');
for (const file of ['webquark.css', 'native-content.css']) {
  cpSync(resolve(browser, 'dist/webquark', file), ownedPath(`dist/browser/${file}`));
}
cpSync(resolve(root, '.stencil/dist/playground'), ownedPath('dist/playground'), { recursive: true });
write('scripts/package.json', '{ "type": "commonjs" }\n');
write('scripts/webquark-serve.js', `#!/usr/bin/env node
import('@webquark/tooling/sandbox').then(({ startSandbox }) => {
  startSandbox(require('node:path').resolve(__dirname, '../dist/playground'));
}).catch(error => { console.error(error); process.exitCode = 1; });
`);
write('scripts/wq-switch/dist/index.js', "#!/usr/bin/env node\nrequire('@webquark/tooling/wq-switch');\n");
write('scripts/wq-switch/dist/setup.js', "#!/usr/bin/env node\nrequire('@webquark/tooling/wq-setup');\n");
cpSync(resolve(root, 'src/tooling/wq-switch/README.md'), ownedPath('scripts/wq-switch/README.md'));
write('scripts/wq-changelog.js', `#!/usr/bin/env bun
import('@webquark/tooling/changelog').then(async ({ runChangelogCli }) => {
  process.exitCode = await runChangelogCli(process.argv.slice(2));
}).catch(error => { console.error(error); process.exitCode = 1; });
`);
console.log('Staged umbrella browser/tooling forwards, CLI binaries and the single playground build.');
