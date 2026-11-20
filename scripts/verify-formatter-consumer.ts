import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtempDisposable, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AddressInfo } from 'node:net';
import { chromium, type Page } from 'playwright';
import { startSandbox } from '../src/tooling/sandbox/webquark-serve';
import { languages } from '../src/tooling/formatter/languages';
import { formatJson } from '../src/browser/components/data-display/syntax-box/internals/formatters/json';

async function checkPendingFormat(page: Page, url: string, action: 'edit' | 'reset' | 'load failure') {
  const languageModule = '**/languages/css.mjs';
  const download = Promise.withResolvers<void>();
  await page.route(languageModule, async route => {
    await download.promise;
    if (action === 'load failure') return route.abort();
    // Signal after the real formatter resolves and the editor's continuation has run.
    await route.fulfill({
      contentType: 'text/javascript',
      body: `import { formatSource as formatCss } from './css.mjs?original';
        export async function formatSource(code) {
          const result = await formatCss(code);
          setTimeout(() => document.documentElement.dataset.formatComplete = 'true', 0);
          return result;
        }`,
    });
  });

  await page.goto(url);
  const box = page.locator('q-syntax-box');
  const button = box.locator('.format-btn');
  await button.waitFor();
  await box.evaluate(element => {
    const editor = element as HTMLQSyntaxBoxElement;
    editor.language = 'css';
    editor.code = 'p{color:red}';
    for (const event of ['qInput', 'qChange']) {
      editor.addEventListener(event, () => { editor.dataset.formatEvent = event; });
    }
  });
  await Promise.all([page.waitForRequest(languageModule), button.click()]);

  try {
    if (action === 'edit') await box.evaluate(element => { (element as HTMLQSyntaxBoxElement).value = 'new draft'; });
    if (action === 'reset') await page.locator('form').evaluate(form => (form as HTMLFormElement).reset());
  } finally {
    download.resolve();
  }

  if (action === 'load failure') {
    await box.getByText('Could not load the CSS formatter.', { exact: false }).waitFor();
  } else {
    await page.waitForFunction(() => document.documentElement.dataset.formatComplete === 'true');
  }
  const result = await box.evaluate(element => ({
    code: (element as HTMLQSyntaxBoxElement).code,
    event: (element as HTMLElement).dataset.formatEvent,
  }));
  const expected = { edit: 'new draft', reset: '', 'load failure': 'p{color:red}' };
  assert.equal(result.code, expected[action], action);
  assert.equal(result.event, undefined, action);
}

for (const tag of ['q-syntax-box', 'q-syntax-view']) {
  const spec = await Bun.file(resolve('src/playground/specs', tag + '.sandbox.json')).json();
  assert.deepEqual(spec.props.language.options, Object.keys(languages), tag + ' playground selector');
}

const scratch = resolve('build/.tmp/formatter-consumer');
await mkdir(scratch, { recursive: true });
await using temporary = await mkdtempDisposable(join(scratch, 'run-'));
const root = temporary.path;
assert.equal(dirname(root), scratch);
const packageDir = join(root, 'app', 'node_modules', '@webquark', 'browser');
const packed = Bun.spawnSync([process.platform === 'win32' ? 'npm.cmd' : 'npm', 'pack', '--offline',
  '--silent', '--ignore-scripts', '--pack-destination', root], { cwd: 'packages/browser/components' });
assert.equal(packed.exitCode, 0, packed.stderr.toString());
const tar = (await readdir(root)).find(file => file.endsWith('.tgz'))!;
const archive = await new Bun.Archive(await readFile(join(root, tar))).files();
for (const [name, blob] of archive) {
  assert.ok(!name.includes('/versions/prettier/'));
  if (!(name === 'package/package.json' || name.startsWith('package/dist/'))) continue;
  const target = join(packageDir, name.slice('package/'.length));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, new Uint8Array(await blob.arrayBuffer()));
}

const manifest = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'));
const reference = await import(pathToFileURL(resolve('src/tooling/formatter/build/runtime.mjs')).href);
const moduleUrl = (entry: string) => './node_modules/@webquark/browser/' + manifest.exports[entry].import.slice(2);
const pages = {
  loader: `import { defineCustomElements } from '${moduleUrl('./loader')}'; await defineCustomElements();`,
  elements: "import './node_modules/@webquark/browser/dist/components/q-syntax-box.js'; import './node_modules/@webquark/browser/dist/components/q-syntax-view.js';",
};
for (const [entry, imports] of Object.entries(pages)) {
  await writeFile(join(root, 'app', entry + '.html'), '<!doctype html><script type="module">' + imports + '</script><form><q-syntax-box editable></q-syntax-box><q-syntax-view editable></q-syntax-view></form>');
}

const browser = await chromium.launch(process.env.FORMATTER_CHROME_CHANNEL ? { channel: process.env.FORMATTER_CHROME_CHANNEL } : {});
await using server = startSandbox(root, 0);
await once(server, 'listening');
const origin = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
try {
  const runtime = origin + '/app/node_modules/@webquark/browser/dist/formatters/prettier/runtime.mjs';
  for (const encoding of ['gzip', 'gzip;q=0, *;q=1', 'identity']) {
    const response = await fetch(runtime, { headers: { 'Accept-Encoding': encoding } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-encoding'), encoding === 'gzip' ? 'gzip' : null);
    assert.equal(response.headers.get('vary'), 'Accept-Encoding');
    assert.match(response.headers.get('content-type')!, /javascript/);
    assert.match(await response.text(), /formatSource/);
  }
  assert.equal((await fetch(runtime + '.missing.mjs')).status, 404);
  assert.equal((await fetch(origin + '/missing-page')).status, 404);

  for (const entry of Object.keys(pages)) {
    const page = await browser.newPage();
    const requested: string[] = [];
    const external: string[] = [];
    await page.route('**/*', route => {
      const url = route.request().url();
      if (!url.startsWith(origin + '/')) { external.push(url); return route.abort(); }
      if (url.includes('/formatters/')) requested.push(url);
      return route.continue();
    });
    await page.goto(origin + '/app/' + entry + '.html');
    const tag = entry === 'loader' ? 'q-syntax-box' : 'q-syntax-view';
    const box = page.locator(tag);
    await box.locator('.format-btn').waitFor();
    assert.equal(requested.length, 0);

    for (const [language, spec] of Object.entries(languages)) {
      const result = await box.evaluate(async (element, { language, source }) => {
        const editor = element as HTMLQSyntaxBoxElement;
        editor.language = language as HTMLQSyntaxBoxElement['language'];
        editor.code = source;
        await new Promise(requestAnimationFrame);
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(Error('Format failed: ' + language + ' ' + editor.shadowRoot?.textContent?.slice(-240))), 8000);
          editor.addEventListener('qChange', () => { clearTimeout(timer); resolve(); }, { once: true });
          editor.shadowRoot!.querySelector<HTMLElement>('.format-btn')!.click();
        });
        return { code: editor.code, message: editor.shadowRoot!.querySelector('.format-feedback')?.textContent };
      }, { language, source: spec.sample });
      const expected = language === 'json' ? formatJson(spec.sample) : await reference.formatSource(spec.sample, language);
      assert.notEqual(expected, spec.sample, language + ' fixture must exercise formatting');
      assert.equal(result.code, expected, language);
      assert.ok(!result.message, result.message ?? language);
      if (language === 'html') {
        assert.ok(requested.some(url => url.endsWith('/plugins/html.mjs')));
        assert.ok(!requested.some(url => url.includes('/plugins/') && !url.endsWith('/html.mjs')));
      }
    }
    assert.deepEqual(external, []);
    await page.close();
    console.log(entry, 'passed', Object.keys(languages).length, 'language modes');
  }
  for (const action of ['edit', 'reset', 'load failure'] as const) {
    const page = await browser.newPage();
    await checkPendingFormat(page, origin + '/app/loader.html', action);
    await page.close();
  }
  console.log('Pending edit, form reset, and language download failure passed');
} finally {
  await browser.close();
}
