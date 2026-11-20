import assert from 'node:assert/strict';
import { chromium, type Page } from 'playwright';
import { servePlayground } from './static-site';

async function verifyButton(page: Page) {
  const output = page.locator('.sandbox-main > q-syntax-box');
  const preview = page.locator('.stage-container q-button');
  const label = 'Pages verification';
  await page.locator('[data-prop="ariaLabel"] input').fill(label);
  await preview.getByRole('button', { name: label }).click();

  const code = output.locator('[view-key="html"] code');
  await code.filter({ hasText: label }).waitFor();
  const displayed = await code.textContent();
  assert.match(displayed!, /\n\s+aria-label="Pages verification"/, 'HTML formatter should indent the updated markup');

  await output.getByRole('button', { name: 'Copy', exact: true }).click();
  const copied = await page.evaluate(async () => (await navigator.clipboard.readText()).replaceAll('\r\n', '\n'));
  assert.equal(copied, displayed);

  await output.getByRole('tab', { name: 'Events' }).click();
  await output.getByRole('log').getByText(/qClick/).first().waitFor();

  for (const name of ['Variants', 'Edge Cases']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await page.locator('.variant-card .example-fixture q-button').first().waitFor();
  }
}

async function verifyMedia(page: Page) {
  const nav = page.locator('#sidebarNav');
  await nav.getByRole('button', { name: 'Icon', exact: true }).click();
  const icon = page.locator('.stage-container q-icon');
  await icon.locator('[part="svg"] svg').waitFor();
  await page.locator('[data-prop="name"] input').fill('check-preview.png');
  const image = icon.locator('img');
  await image.waitFor();
  await image.evaluate((element: HTMLImageElement) => element.decode());

  await nav.getByRole('button', { name: 'Reel', exact: true }).click();
  await page.locator('.stage-container q-reel q-thumbnail').first().waitFor();
  await page.getByRole('tab', { name: 'Variants', exact: true }).click();
  const video = page.locator('variant-card').filter({ has: page.getByRole('heading', { name: 'Video in the lightbox' }) });
  await video.locator('[view-key="html"] code').filter({ hasText: 'data:video/webm;base64,' }).waitFor();
}

async function verifyGuides(page: Page, site: URL) {
  for (const [link, path] of [
    ['Design presets', 'presets.html'],
    ['Changelog Tooling', 'views/tooling/tooling.html'],
    ['', 'playground/consumer.html'],
  ]) {
    const url = new URL(path, site).href;
    if (link) await page.getByRole('link', { name: link, exact: true }).click();
    else await page.goto(url);

    await page.waitForURL(url);
    await page.reload();
    await page.getByRole('link', { name: /Component playground/ }).click();
    await page.locator('.stage-container q-button').waitFor();
  }
}

async function verifySite(page: Page, site: URL) {
  const responses = new Map<string, number>();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin !== site.origin) return;
    responses.set(url.pathname, response.status());
    if (response.status() >= 400) errors.push(response.status() + ' ' + url.pathname);
  });

  await page.goto(site.href);
  await verifyButton(page);
  await verifyMedia(page);
  await verifyGuides(page, site);

  for (const file of [
    'build/webquark.css', 'logo.svg', 'playground/components.manifest.json',
    'playground/specs/q-button.sandbox.json', 'playground/specs/q-icon.sandbox.json',
    'formatters/prettier/runtime.mjs', 'assets/icons/check.svg', 'assets/icons/check-preview.png',
    'assets/comparison-before.svg', 'assets/comparison-after.svg', 'assets/reel-motion.webm',
  ]) {
    const status = responses.get(new URL(file, site).pathname);
    assert.ok(status && status < 400, 'Expected the playground to load ' + file);
  }
  assert.deepEqual(errors, [], 'First-party resources and browser errors');
}

const hostedSite = process.argv[2];
const basePath = process.env.PAGES_BASE_PATH ?? '/WebQuark';
const browser = await chromium.launch();
try {
  for (const path of hostedSite ? [new URL(hostedSite).pathname] : new Set([basePath, '/'])) {
    const server = hostedSite ? undefined : servePlayground(path);
    const site = hostedSite ? new URL(hostedSite) : new URL(path.replace(/\/?$/, '/'), server!.url);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: site.origin });
      await verifySite(page, site);
      console.log('Playground verified at ' + site.href);
    } finally {
      await page.close();
      await server?.stop(true);
    }
  }
} finally {
  await browser.close();
}
