import type { BrowserCommand } from 'vitest/node';
import type { Page, Route } from 'playwright';
import type {} from '@vitest/browser-playwright';

interface ProbeRequest { url: string; method: string; headers: Record<string, string>; body: string; bodyBase64: string }
const probes = new WeakMap<Page, { requests: ProbeRequest[]; handler: (route: Route) => Promise<void> }>();

const startFormSubmitProbe: BrowserCommand<[string]> = async ({ page }, origin) => {
  const url = new URL(origin);
  if (!['localhost','127.0.0.1','[::1]'].includes(url.hostname) || url.origin !== origin) throw new Error('Only a local test origin is allowed.');
  if (probes.has(page)) throw new Error('Submission probe already active.');
  const requests: ProbeRequest[] = [];
  const handler = async (route: Route) => {
    const request = route.request();
    const target = new URL(request.url());
    if (target.origin !== origin || !target.pathname.startsWith('/__webquark_submit_probe__/')) return route.continue();
    const body = request.postDataBuffer();
    requests.push({ url: request.url(), method: request.method(), headers: request.headers(), body: body?.toString('utf8') ?? '', bodyBase64: body?.toString('base64') ?? '' });
    // No server receives the data, and the runner's browsing context is preserved.
    await route.fulfill({ status: 204, body: '' });
  };
  probes.set(page, { requests, handler });
  await page.route('**/__webquark_submit_probe__/**', handler);
};
const readFormSubmitProbe: BrowserCommand<[]> = async ({ page }) => probes.get(page)?.requests ?? [];
const stopFormSubmitProbe: BrowserCommand<[]> = async ({ page }) => {
  const probe = probes.get(page);
  if (!probe) return;
  await page.unroute('**/__webquark_submit_probe__/**', probe.handler);
  probes.delete(page);
};
export const formSubmitCommands = { startFormSubmitProbe, readFormSubmitProbe, stopFormSubmitProbe };
