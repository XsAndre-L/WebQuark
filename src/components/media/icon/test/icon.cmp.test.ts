import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { Braces, Check, Copy, Bell, CircleAlert } from '@lucide/icons';
// @ts-ignore - exercise the regenerated consumer build, not a source transform.
import { defineCustomElements } from '../../../../../dist/loader';
// @ts-ignore
import { configureQIcons, registerQIcons } from '../../../../../dist/index.js';
import { sanitizeIconSvg } from '../internals/sanitize-svg';
import { MAX_ICON_DEPTH, MAX_ICON_NODES, MAX_ICON_SVG_BYTES } from '../internals/policy';
import { REJECTED_SVGS, RESOURCE_ICON, RESOURCE_SVG } from './icon-fixtures';
import type { QIconDefinition } from '../icon.types';

// @ts-ignore - Vite supplies raw repository assets to this browser test.
const localSvgAssets: Record<string, string> = import.meta.glob('/src/assets/icons/*.svg', { query: '?raw', import: 'default', eager: true });

defineCustomElements();

describe('built q-icon strict SVG and image URLs', () => {
  afterEach(() => {
    document.body.replaceChildren(); registerQIcons({}); configureQIcons({ strict: false });
    vi.unstubAllGlobals(); vi.restoreAllMocks();
  });
  async function create(props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement('q-icon'); Object.assign(el, props); document.body.append(el);
    await (el as any).componentOnReady(); return el;
  }
  function svgFetch(svg: string) {
    const fetch = vi.fn().mockImplementation(async () => new Response(svg)); vi.stubGlobal('fetch', fetch); return fetch;
  }
  async function svgReady(el: any): Promise<SVGElement> {
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('[part="svg"] > svg')).not.toBeNull());
    return el.shadowRoot.querySelector('[part="svg"] > svg');
  }

  it.each(Object.entries({ Braces, Check, Copy, Bell, CircleAlert }))('renders actual Lucide %s definition with intact geometry and no metadata/fallback/I/O', async (_name, definition) => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const el = await create({ definition }); const svg = await svgReady(el);
    expect(svg.children.length).toBe(definition.node.length);
    definition.node.forEach(([tag, attributes], index) => {
      const child = svg.children[index]; expect(child.localName).toBe(tag);
      for (const [name, value] of Object.entries(attributes)) {
        if (name === 'key') expect(child.hasAttribute(name)).toBe(false);
        else expect(child.getAttribute(name)).toBe(value);
      }
    });
    expect(el.shadowRoot.querySelector('[part="fallback"]')).toBeNull(); expect(fetch).not.toHaveBeenCalled();
  });
  it('renders the documented real library registry in strict mode without fetching', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    registerQIcons({ bell: Bell, 'circle-alert': CircleAlert, braces: Braces, check: Check, copy: Copy }); configureQIcons({ strict: true });
    for (const name of ['bell', 'circle-alert', 'braces', 'check', 'copy']) {
      const el = await create({ name }); const svg = await svgReady(el);
      expect(svg.children.length).toBeGreaterThan(0); expect(svg.querySelector('[key]')).toBeNull();
      expect(el.shadowRoot.querySelector('[part="fallback"]')).toBeNull();
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['<svg key="metadata"><path d="M1 1"/></svg>', '<svg><path key="metadata" d="M1 1"/></svg>'])('still rejects fetched XML key metadata: %s', async svg => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined); svgFetch(svg);
    expect(sanitizeIconSvg(svg)).toBe(''); const el = await create({ name: 'fetched-key' });
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('[part="fallback"]')).not.toBeNull());
    expect(el.shadowRoot.querySelector('[part="svg"]')).toBeNull();
  });

  it('keeps pinned built-in loading, accessibility and real XML parsing', async () => {
    const fetch = svgFetch('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1"/></svg>');
    const el = await create({ name: 'settings', label: 'Settings' }); const svg = await svgReady(el);
    expect(String(fetch.mock.calls[0][0])).toContain('lucide-static@0.416.0');
    expect(fetch.mock.calls[0][1].signal).toBeDefined(); expect(svg.querySelector('path')?.getAttribute('d')).toBe('M1 1');
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg'); expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false'); expect(el.getAttribute('role')).toBe('img'); expect(el.getAttribute('aria-label')).toBe('Settings');
  });
  it('keeps legacy Font Awesome version overrides', async () => {
    const fetch = svgFetch('<svg><path d="M1 1"/></svg>');
    await svgReady(await create({ lib: 'font-awesome', libVersion: '7.0.0', name: 'heart' }));
    expect(String(fetch.mock.calls[0][0])).toContain('@fortawesome/fontawesome-free@7.0.0');
  });
  it('preserves matching registered/fetched geometry, local masks/gradients/symbols and xlink namespaces', async () => {
    registerQIcons({ resources: RESOURCE_ICON }); const fetch = svgFetch(RESOURCE_SVG);
    const registered = await create({ name: 'resources' }); const fetched = await create({ name: 'fetched' });
    const a = await svgReady(registered); const b = await svgReady(fetched);
    for (const tag of ['path', 'g', 'mask', 'clipPath', 'linearGradient', 'stop', 'symbol', 'use']) {
      expect(a.querySelectorAll(tag).length).toBe(b.querySelectorAll(tag).length);
    }
    expect(a.querySelector('use')?.getAttribute('href')).toBe('#shape');
    expect(b.querySelector('use')?.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#shape');
    expect(b.querySelector('g')?.getAttribute('mask')).toBe('url(#cutout)');
    expect(b.querySelector('use')?.getAttribute('fill')).toBe('url(#paint)'); expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('preserves valid root IDs and child references in registered and fetched icons', async () => {
    registerQIcons({ rooted: { ...RESOURCE_ICON, attributes: { id: 'icon-root' } } });
    svgFetch(RESOURCE_SVG.replace('<svg ', '<svg id="icon-root" '));
    for (const name of ['rooted', 'fetched-rooted']) {
      const svg = await svgReady(await create({ name }));
      expect(svg.id).toBe('icon-root'); expect(svg.querySelector('#shape')).not.toBeNull();
      const use = svg.querySelector('use')!;
      expect(use.getAttribute('href') ?? use.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#shape');
    }
  });

  it.each<[string, string, QIconDefinition]>([
    ['empty', '<svg id=""><path/></svg>', { attributes: { id: '' }, node: [['path', {}]] }],
    ['whitespace', '<svg id="two ids"><path/></svg>', { attributes: { id: 'two ids' }, node: [['path', {}]] }],
    ['fragment delimiter', '<svg id="bad#id"><path/></svg>', { attributes: { id: 'bad#id' }, node: [['path', {}]] }],
    ['duplicate', '<svg id="same"><path id="same"/></svg>', { attributes: { id: 'same' }, node: [['path', { id: 'same' }]] }],
    ['root reference', '<svg id="root"><use href="#root"/></svg>', { attributes: { id: 'root' }, node: [['use', { href: '#root' }]] }],
  ])('rejects %s root IDs/references in both registered data and fetched XML', async (_case, svg, definition) => {
    expect(() => registerQIcons({ rejected: definition })).toThrow();
    vi.spyOn(console, 'error').mockImplementation(() => undefined); svgFetch(svg);
    const el = await create({ name: 'rejected-root' });
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('[part="fallback"]')).not.toBeNull());
    expect(el.shadowRoot.querySelector('[part="svg"]')).toBeNull();
    expect(sanitizeIconSvg(svg)).toBe('');
  });

  it.each(REJECTED_SVGS)('rejects %s before any source-originated SVG is inserted', async (_name, svg) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined); const fetch = svgFetch(svg);
    const el = await create({ name: 'rejected' });
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('[part="fallback"]')).not.toBeNull());
    expect(el.shadowRoot.querySelector('[part="svg"]')).toBeNull(); expect(el.classList.contains('q-icon-error')).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1); expect(sanitizeIconSvg(svg)).toBe('');
  });
  it('rejects node/depth/byte overruns through the real fetch/parser/fallback path', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const tooMany = `<svg>${'<path/>'.repeat(MAX_ICON_NODES + 1)}</svg>`;
    const tooDeep = `<svg>${'<g>'.repeat(MAX_ICON_DEPTH)}<path/>${'</g>'.repeat(MAX_ICON_DEPTH)}</svg>`;
    for (const svg of [tooMany, tooDeep, `<svg>${' '.repeat(MAX_ICON_SVG_BYTES)}</svg>`]) {
      svgFetch(svg); const el = await create({ name: 'over-budget' });
      await vi.waitFor(() => expect(el.shadowRoot.querySelector('[part="fallback"]')).not.toBeNull());
      expect(el.shadowRoot.querySelector('[part="svg"]')).toBeNull(); el.remove();
    }
  });
  it('normalizes unqualified XML without recovering malformed input or retaining comments', () => {
    const serialized = sanitizeIconSvg('<?xml version="1.0"?><svg viewBox="0 0 24 24"><!-- inert --><path d="M1 1"/></svg>');
    const parsed = new DOMParser().parseFromString(serialized, 'image/svg+xml');
    expect(parsed.documentElement.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(parsed.querySelector('path')?.getAttribute('d')).toBe('M1 1'); expect(serialized).not.toContain('<!--');
  });
  it('preserves all sixteen well-formed local SVG assets through native XML validation', () => {
    expect(Object.keys(localSvgAssets)).toHaveLength(16);
    for (const [path, source] of Object.entries(localSvgAssets)) {
      const sanitized = sanitizeIconSvg(source);
      expect(sanitized, path).not.toBe('');
      const before = new DOMParser().parseFromString(source, 'image/svg+xml');
      const after = new DOMParser().parseFromString(sanitized, 'image/svg+xml');
      expect(after.documentElement.getAttribute('viewBox'), path).toBe(before.documentElement.getAttribute('viewBox'));
      expect(after.querySelectorAll('path, circle, rect, line, polygon, polyline, ellipse').length, path)
        .toBe(before.querySelectorAll('path, circle, rect, line, polygon, polyline, ellipse').length);
    }
  });
  it('rejects the pre-existing malformed spinner asset without regex recovery', () => {
    const source = localSvgAssets['/src/assets/icons/spinner.svg'].replace('y2="4.93"></line></svg>', 'y2="4.93"></svg>');
    expect(new DOMParser().parseFromString(source, 'image/svg+xml').querySelector('parsererror')).not.toBeNull();
    expect(sanitizeIconSvg(source)).toBe('');
    // Keep the original malformed bytes as a regression after repairing the asset.
    const proposedRepair = source.replace('y2="4.93"></svg>', 'y2="4.93"></line></svg>');
    expect(sanitizeIconSvg(proposedRepair)).not.toBe('');
    expect(new DOMParser().parseFromString(sanitizeIconSvg(proposedRepair), 'image/svg+xml').querySelectorAll('line')).toHaveLength(8);
  });
  it('keeps the latest SVG when earlier requests finish later', async () => {
    let finishFirst!: (response: Response) => void;
    const first = new Promise<Response>(resolve => { finishFirst = resolve; });
    vi.stubGlobal('fetch', vi.fn((url: string) => url.includes('first') ? first : Promise.resolve(new Response('<svg><path id="second" d="M2 2"/></svg>'))));
    const el = await create({ name: 'first' }); el.name = 'second';
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('#second')).not.toBeNull());
    finishFirst(new Response('<svg><path id="first" d="M1 1"/></svg>'));
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(el.shadowRoot.querySelector('#second')).not.toBeNull(); expect(el.shadowRoot.querySelector('#first')).toBeNull();
  });
  it('loads a real PNG through query/fragment and preserves the original image URL', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const el = await create({ library: 'local', localPath: '/src/assets/icons/', name: 'check-preview.png?v=2#preview', label: 'Local image', size: 64 });
    const img = el.shadowRoot.querySelector('img') as HTMLImageElement;
    await vi.waitFor(() => expect(img.naturalWidth).toBeGreaterThan(0));
    expect(img.getAttribute('src')).toBe('/src/assets/icons/check-preview.png?v=2#preview');
    expect(el.classList.contains('q-icon-binary')).toBe(true); expect(fetch).not.toHaveBeenCalled();
    await page.screenshot({ element: el, path: 'task02-query-image.png' });
  });
  it('infers the local SVG extension before query/fragment and rejects an unsupported source scheme', async () => {
    const fetch = svgFetch('<svg><path d="M1 1"/></svg>');
    await svgReady(await create({ library: 'local', name: 'check?v=1.2#icon' }));
    expect(String(fetch.mock.calls[0][0])).toContain('/assets/icons/check.svg?v=1.2#icon');
    fetch.mockClear(); vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const el = await create({ library: 'javascript:{name}', name: 'inert.png' });
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('[part="fallback"]')).not.toBeNull());
    expect(fetch).not.toHaveBeenCalled(); expect(el.shadowRoot.querySelector('img')).toBeNull();
  });
});
