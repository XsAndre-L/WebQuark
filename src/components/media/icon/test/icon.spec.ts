import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';
// @ts-ignore - integration tests exercise the built package entry point used by consumers.
import { configureQIcons, registerQIcons } from '../../../../../dist/index.js';

defineCustomElements();

describe('q-icon', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-icon');
    Object.assign(el, props);
    document.body.appendChild(el);

    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await wait(50);
    }

    return el;
  }

  async function wait(ms = 20): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  function mockSvgFetch(svg: string) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => svg,
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  afterEach(() => {
    document.body.innerHTML = '';
    registerQIcons({});
    configureQIcons({ strict: false });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders registered icon data synchronously without fetching', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    registerQIcons({
      settings: {
        size: 24,
        node: [['path', { d: 'M2 12h20', 'data-registered': 'settings' }]],
      },
    });

    const el = await createComponent({ name: 'settings', size: 32, color: 'rebeccapurple' });
    const path = el.shadowRoot.querySelector('path[data-registered="settings"]');

    expect(path).not.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(el.classList.contains('q-icon-svg')).toBe(true);
    expect(el.style.width).toBe('32px');
    expect(el.style.height).toBe('32px');
    expect(el.style.color).toBe('rebeccapurple');
    expect(el.shadowRoot.querySelector('svg')?.getAttribute('stroke')).toBe('currentColor');
  });

  it('prioritizes an explicit definition over registry lookup in strict mode', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    registerQIcons({
      status: { size: 24, node: [['path', { d: 'M1 1', 'data-icon': 'registered' }]] },
    });
    configureQIcons({ strict: true });

    const el = await createComponent({
      name: 'status',
      definition: { size: 24, node: [['circle', { cx: '12', cy: '12', r: '3', 'data-icon': 'direct' }]] },
    });

    expect(el.shadowRoot.querySelector('[data-icon="direct"]')).not.toBeNull();
    expect(el.shadowRoot.querySelector('[data-icon="registered"]')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses a deterministic local fallback and never fetches unknown names in strict mode', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    configureQIcons({ strict: true });

    const el = await createComponent({ name: 'not-registered' });

    expect(el.shadowRoot.querySelector('.icon-fallback')).not.toBeNull();
    expect(el.classList.contains('q-icon-error')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('updates synchronously when a registered icon name changes', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    registerQIcons({
      first: { size: 24, node: [['path', { d: 'M1 1', 'data-icon': 'first' }]] },
      second: { size: 24, node: [['circle', { cx: '12', cy: '12', r: '4', 'data-icon': 'second' }]] },
    });
    configureQIcons({ strict: true });

    const el = await createComponent({ name: 'first' });
    expect(el.shadowRoot.querySelector('[data-icon="first"]')).not.toBeNull();

    el.name = 'second';
    await wait();

    expect(el.shadowRoot.querySelector('[data-icon="first"]')).toBeNull();
    expect(el.shadowRoot.querySelector('[data-icon="second"]')).not.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserves host accessibility semantics for registered icons', async () => {
    registerQIcons({
      alert: { size: 24, node: [['path', { d: 'M12 2 2 22h20Z' }]] },
    });

    const el = await createComponent({ name: 'alert', label: 'Important alert' });
    const svg = el.shadowRoot.querySelector('.svg-container svg') as SVGElement;

    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Important alert');
    expect(el.getAttribute('aria-hidden')).toBe('false');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
  });

  it('fetches built-in Lucide icons from a pinned version and sanitizes inline SVG', async () => {
    const fetchMock = mockSvgFetch(`
      <svg viewBox="0 0 24 24" onload="alert(1)">
        <script>alert(1)</script>
        <foreignObject><div>unsafe</div></foreignObject>
        <path d="M1 1" onmouseover="alert(2)" />
        <use href="https://example.com/icon.svg#x"></use>
      </svg>
    `);

    const el = await createComponent({ name: 'settings' });
    await vi.waitFor(() => {
      expect(el.shadowRoot.querySelector('.svg-container')?.innerHTML).toContain('<svg');
    });
    const url = String(fetchMock.mock.calls[0][0]);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const html = (el.shadowRoot.querySelector('.svg-container') as HTMLElement).innerHTML.toLowerCase();

    expect(url).toContain('lucide-static@0.416.0');
    expect(url).not.toContain('@latest');
    expect(init.signal).toBeDefined();
    expect(html).toContain('<svg');
    expect(html).not.toMatch(/script|foreignobject|onload|onmouseover|https:\/\/example\.com|javascript:/);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('supports explicit library version overrides for Font Awesome', async () => {
    const fetchMock = mockSvgFetch('<svg viewBox="0 0 24 24"><path d="M1 1" /></svg>');

    await createComponent({ lib: 'font-awesome', libVersion: '7.0.0', name: 'heart' });
    const url = String(fetchMock.mock.calls[0][0]);

    expect(url).toContain('@fortawesome/fontawesome-free@7.0.0');
    expect(url).not.toContain('@latest');
  });

  it('uses label as the host accessible name for meaningful icons', async () => {
    mockSvgFetch('<svg viewBox="0 0 24 24"><path d="M1 1" /></svg>');

    const el = await createComponent({ name: 'settings', label: 'Settings' });
    await vi.waitFor(() => {
      expect(el.shadowRoot.querySelector('.svg-container svg')).not.toBeNull();
    });
    const svg = el.shadowRoot.querySelector('.svg-container svg') as SVGElement;

    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Settings');
    expect(el.getAttribute('aria-hidden')).toBe('false');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('hydrates without waiting for the SVG request to finish', async () => {
    let resolveFetch!: (response: { ok: boolean; text: () => Promise<string> }) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => {
      resolveFetch = resolve;
    })));

    const el = await createComponent({ name: 'settings' });

    expect(el.classList.contains('hydrated')).toBe(true);
    expect(el.shadowRoot.querySelector('.svg-container')?.innerHTML).toBe('');

    resolveFetch({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"><path d="M1 1" /></svg>',
    });
    await vi.waitFor(() => {
      expect(el.shadowRoot.querySelector('.svg-container')?.innerHTML).toContain('<svg');
    });
  });

  it('renders binary local assets without fetching SVG content', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const el = await createComponent({ lib: 'local', name: 'logo.png', label: 'Logo' });
    const img = el.shadowRoot.querySelector('img') as HTMLImageElement;

    expect(fetchMock).not.toHaveBeenCalled();
    expect(el.classList.contains('q-icon-binary')).toBe(true);
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Logo');
    expect(img.getAttribute('src')).toBe('/assets/icons/logo.png');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
  });

  it('sets the error fallback when SVG fetches exceed the timeout', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const el = await createComponent({ fetchTimeout: 1 });
    el.name = 'settings';
    await wait(40);

    expect(el.classList.contains('q-icon-error')).toBe(true);
    expect(el.shadowRoot.querySelector('.icon-fallback')).not.toBeNull();
  });

  it('keeps the latest fetched SVG when earlier requests resolve later', async () => {
    let resolveFirst!: (response: any) => void;
    const firstResponse = new Promise(resolve => {
      resolveFirst = resolve;
    });
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('first')) {
        return firstResponse;
      }
      return Promise.resolve({
        ok: true,
        text: async () => '<svg viewBox="0 0 24 24"><path id="second" d="M2 2" /></svg>',
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const el = await createComponent();
    el.name = 'first';
    await wait();
    el.name = 'second';
    await wait(40);

    resolveFirst!({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"><path id="first" d="M1 1" /></svg>',
    });
    await wait(40);

    const html = (el.shadowRoot.querySelector('.svg-container') as HTMLElement).innerHTML;
    expect(html).toContain('id="second"');
    expect(html).not.toContain('id="first"');
  });
});
