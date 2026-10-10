import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore - consumer integration uses regenerated package output.
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
// @ts-ignore
import { configureQIcons, registerQIcons } from '../../../../../../packages/browser/components/dist/index.js';

defineCustomElements();

describe('q-icon registered/non-browser behavior', () => {
  async function create(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('q-icon');
    Object.assign(el, props); document.body.append(el);
    await (el as any).componentOnReady();
    return el;
  }
  afterEach(() => {
    document.body.innerHTML = ''; registerQIcons({}); configureQIcons({ strict: false });
    vi.unstubAllGlobals(); vi.restoreAllMocks();
  });
  it('renders registered data synchronously with sizes, color and no fetch', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    registerQIcons({ settings: { size: 24, node: [['path', { d: 'M2 12h20', 'data-registered': 'settings' }]] } });
    const el = await create({ name: 'settings', size: 32, color: 'rebeccapurple' });
    expect(el.shadowRoot.querySelector('path[data-registered="settings"]')).not.toBeNull();
    expect(fetch).not.toHaveBeenCalled(); expect(el.style.width).toBe('32px'); expect(el.style.height).toBe('32px');
    expect(el.style.color).toBe('rebeccapurple'); expect(el.shadowRoot.querySelector('svg').getAttribute('stroke')).toBe('currentColor');
  });
  it('prioritizes explicit data over registry even in strict mode', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    registerQIcons({ status: { node: [['path', { d: 'M1 1', 'data-icon': 'registered' }]] } }); configureQIcons({ strict: true });
    const el = await create({ name: 'status', definition: { node: [['circle', { r: '3', 'data-icon': 'direct' }]] } });
    expect(el.shadowRoot.querySelector('[data-icon="direct"]')).not.toBeNull();
    expect(el.shadowRoot.querySelector('[data-icon="registered"]')).toBeNull(); expect(fetch).not.toHaveBeenCalled();
  });
  it('uses the existing strict unknown-name fallback without I/O', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); configureQIcons({ strict: true });
    const el = await create({ name: 'unknown' });
    expect(el.shadowRoot.querySelector('[part="fallback"]')).not.toBeNull(); expect(el.classList.contains('q-icon-error')).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('updates registered names without fetching and preserves host accessibility', async () => {
    registerQIcons({ first: { node: [['path', { d: 'M1 1', 'data-icon': 'first' }]] }, second: { node: [['circle', { r: '4', 'data-icon': 'second' }]] } });
    const el = await create({ name: 'first', label: 'Important alert' }); el.name = 'second';
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('[data-icon="second"]')).not.toBeNull());
    expect(el.shadowRoot.querySelector('[data-icon="first"]')).toBeNull(); expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Important alert'); expect(el.getAttribute('aria-hidden')).toBe('false');
    expect(el.shadowRoot.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(el.shadowRoot.querySelector('svg').getAttribute('focusable')).toBe('false');
  });
  it('renders query/fragment image URLs as images without SVG fetch', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const el = await create({ lib: 'local', name: 'logo.PNG?v=2#mark', label: 'Logo' });
    const img = el.shadowRoot.querySelector('img');
    expect(img.getAttribute('src')).toBe('/assets/icons/logo.PNG?v=2#mark'); expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true'); expect(fetch).not.toHaveBeenCalled();
  });
  it('does not delay hydration while awaiting SVG I/O', async () => {
    let finish!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
    const el = await create({ name: 'settings' });
    expect(el.classList.contains('hydrated')).toBe(true); expect(el.shadowRoot.querySelector('[part="svg"]').innerHTML).toBe('');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    finish(new Response('<svg><path d="M1 1"/></svg>'));
    // Real XML parsing/rendered-positive and stale-response tests live in icon.cmp.test.ts.
  });
  it('keeps the timeout/error contract for a stalled request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));
    const el = await create({ name: 'settings', fetchTimeout: 1 });
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('[part="fallback"]')).not.toBeNull());
    expect(el.classList.contains('q-icon-error')).toBe(true);
  });
});
