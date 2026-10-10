/** Destination proof is attached to a page by trusted application code. */
export interface CaptureDestination { application: string; route: string; baseUrl: string; query?: ReadonlyMap<string, readonly string[]> }
export interface CapturePage { url(): string }
const destinations = new WeakMap<CapturePage, CaptureDestination>();
export function bindCaptureDestination(page: CapturePage, expected: CaptureDestination): void {
  const url = new URL(expected.baseUrl);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Capture destination requires an owned loopback origin.');
  if (!expected.route.startsWith('/') || /[?#\\]/.test(expected.route)) throw new Error('Capture destination requires a canonical route.');
  destinations.set(page, { ...expected, baseUrl: url.origin });
}
export function assertCaptureDestination(page: CapturePage): string | undefined {
  const expected = destinations.get(page); if (!expected) return undefined;
  const actual = new URL(page.url());
  if (actual.origin !== expected.baseUrl || actual.pathname !== expected.route || actual.hash || actual.username || actual.password) throw new Error(`Capture ended at ${actual.pathname}; expected ${expected.application} ${expected.route}. Login, denied and not-found destinations cannot be captured.`);
  for (const [key, value] of actual.searchParams) if (!expected.query?.get(key)?.includes(value) || actual.searchParams.getAll(key).length !== 1) throw new Error(`Capture destination has an undeclared or unseeded query parameter: ${key}.`);
  return actual.href;
}
