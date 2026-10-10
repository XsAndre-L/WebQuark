import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchIconSvg } from './fetch-icon';
import { MAX_ICON_SVG_BYTES } from './policy';
import { sanitizeIconSvg } from './sanitize-svg';

describe('bounded icon SVG loading', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('decodes split UTF-8 chunks without changing valid source', async () => {
    const source = '<svg><!-- caf\u00e9 --></svg>';
    const bytes = new TextEncoder().encode(source);
    const body = new ReadableStream({ start(controller) {
      const split = bytes.indexOf(0xc3) + 1;
      controller.enqueue(bytes.slice(0, split)); controller.enqueue(bytes.slice(split)); controller.close();
    } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));
    await expect(fetchIconSvg('/icon.svg', 1000)).resolves.toBe(source);
  });

  it('cancels an oversized stream even when Content-Length is absent or understates the body', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(MAX_ICON_SVG_BYTES + 1)); }, cancel,
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { headers: { 'Content-Length': '1' } })));
    await expect(fetchIconSvg('/icon.svg', 1000)).rejects.toThrow(/exceeds/);
    expect(cancel).toHaveBeenCalled();
  });

  it('rejects oversized declared bodies without consuming content', async () => {
    const cancel = vi.fn();
    const response = new Response(new ReadableStream({ cancel }), {
      headers: { 'Content-Length': String(MAX_ICON_SVG_BYTES + 1) },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(fetchIconSvg('/icon.svg', 1000)).rejects.toThrow(/exceeds/);
    expect(cancel).toHaveBeenCalled();
  });

  it('accepts the byte boundary, rejects invalid UTF-8 and requires a bounded stream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x'.repeat(MAX_ICON_SVG_BYTES))));
    expect((await fetchIconSvg('/icon.svg', 1000)).length).toBe(MAX_ICON_SVG_BYTES);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array([0xff]))));
    await expect(fetchIconSvg('/icon.svg', 1000)).rejects.toThrow();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: vi.fn() }));
    await expect(fetchIconSvg('/icon.svg', 1000)).rejects.toThrow(/bounded streaming/);
  });

  it('keeps module import safe without browser XML globals and fails closed when parsing is unavailable', () => {
    vi.stubGlobal('DOMParser', undefined); vi.stubGlobal('XMLSerializer', undefined);
    expect(sanitizeIconSvg('<svg><path d="M1 1"/></svg>')).toBe('');
    expect(sanitizeIconSvg('<svg><path></svg>')).toBe('');
  });
});
