import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

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
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
    const url = String(fetchMock.mock.calls[0][0]);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const html = (el.shadowRoot.querySelector('.svg-container') as HTMLElement).innerHTML.toLowerCase();

    expect(url).toContain('lucide-static@0.400.0');
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
    const svg = el.shadowRoot.querySelector('.svg-container svg') as SVGElement;

    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Settings');
    expect(el.getAttribute('aria-hidden')).toBe('false');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
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
