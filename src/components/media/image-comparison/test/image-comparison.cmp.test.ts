import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
// @ts-ignore - validate the generated package used by consumers.
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();
const image = (color: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="${color}"/></svg>`)}`;

describe('built q-image-comparison', () => {
  afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
  async function create(props: Record<string, unknown> = {}, waitReady = true): Promise<any> {
    const el = document.createElement('q-image-comparison') as any;
    Object.assign(el, { beforeSrc: image('red'), afterSrc: image('blue'), beforeAlt: 'Red before', afterAlt: 'Blue after', ...props });
    el.style.width = '640px';
    document.body.append(el);
    await el.componentOnReady();
    if (waitReady) await vi.waitFor(() => expect(control(el).disabled).toBe(false));
    return el;
  }
  const control = (el: any): HTMLInputElement => el.shadowRoot.querySelector('input');
  const frame = (el: any): HTMLDivElement => el.shadowRoot.querySelector('[part="frame"]');
  function pointer(el: any, type: string, x: number, y = 100, pointerType = 'mouse', id = 1) {
    frame(el).dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id, clientX: x, clientY: y, pointerType, isPrimary: true, button: 0 }));
  }

  it('clamps initial and external positions without emitting user events', async () => {
    const el = await create({ position: 200 });
    const change = vi.fn(); el.addEventListener('qChange', change);
    expect(el.position).toBe(100);
    el.position = -10;
    await vi.waitFor(() => expect(el.position).toBe(0));
    el.position = Number.NaN;
    await vi.waitFor(() => expect(el.position).toBe(50));
    el.position = 37;
    await vi.waitFor(() => expect(control(el).value).toBe('37'));
    expect(change).not.toHaveBeenCalled();
  });

  it('retains complete, contained images at identical dimensions while only clipping Before', async () => {
    const el = await create();
    const before = el.shadowRoot.querySelector('[part="before-image"]') as HTMLImageElement;
    const after = el.shadowRoot.querySelector('[part="after-image"]') as HTMLImageElement;
    const reveal = el.shadowRoot.querySelector('[part="before-layer"]') as HTMLDivElement;
    const initial = frame(el).getBoundingClientRect();
    expect(initial.width).toBe(640); expect(initial.height).toBe(360);
    for (const position of [0, 25, 50, 100]) {
      el.position = position;
      await vi.waitFor(() => expect(reveal.style.clipPath).toBe(`inset(0px ${100 - position}% 0px 0px)`));
      expect(before.style.clipPath).toBe('');
      for (const img of [before, after]) {
        expect(img.getBoundingClientRect().width).toBe(initial.width);
        expect(img.getBoundingClientRect().height).toBe(initial.height);
        expect(getComputedStyle(img).objectFit).toBe('contain');
      }
    }
    expect(before.alt).toBe('Red before'); expect(after.alt).toBe('Blue after');
  });

  it('derives one common frame from After, then Before, while explicit ratios and full crops retain legacy behavior', async () => {
    const partial = { x: 50, y: 0, width: 50, height: 100 };
    const el = await create({ beforeCrop: partial });
    expect(frame(el).getBoundingClientRect().height).toBe(720);
    el.beforeCrop = undefined;
    el.afterCrop = { x: 0, y: 50, width: 100, height: 50 };
    await vi.waitFor(() => expect(frame(el).getBoundingClientRect().height).toBe(180));
    el.aspectRatio = 2;
    await vi.waitFor(() => expect(frame(el).getBoundingClientRect().height).toBe(320));
    el.beforeCrop = undefined; el.afterCrop = { x: 0, y: 0, width: 100, height: 100 }; el.aspectRatio = undefined;
    await vi.waitFor(() => expect(frame(el).getBoundingClientRect().height).toBe(360));
    expect(getComputedStyle(el.shadowRoot.querySelector('[part="after-image"]')).objectFit).toBe('contain');
  });

  it('contains independent regions without distortion and keeps the reveal at the frame midpoint', async () => {
    const el = await create({
      beforeCrop: { x: 0, y: 50, width: 50, height: 50 },
      afterCrop: { x: 50, y: 0, width: 50, height: 100 },
    });
    const outer = frame(el).getBoundingClientRect();
    const beforeViewport = el.shadowRoot.querySelector('[part="before-viewport"]') as HTMLDivElement;
    const afterViewport = el.shadowRoot.querySelector('[part="after-viewport"]') as HTMLDivElement;
    const before = el.shadowRoot.querySelector('[part="before-image"]') as HTMLImageElement;
    const after = el.shadowRoot.querySelector('[part="after-image"]') as HTMLImageElement;
    const reveal = el.shadowRoot.querySelector('[part="before-layer"]') as HTMLDivElement;
    expect(outer.width).toBe(640); expect(outer.height).toBe(720);
    expect(beforeViewport.getBoundingClientRect().height).toBe(360);
    expect(beforeViewport.getBoundingClientRect().top - outer.top).toBe(180);
    expect(afterViewport.getBoundingClientRect().height).toBe(720);
    for (const img of [before, after]) {
      const rect = img.getBoundingClientRect();
      expect(rect.width / rect.height).toBeCloseTo(img.naturalWidth / img.naturalHeight);
      expect(img.style.clipPath).toBe('');
    }
    for (const viewport of [beforeViewport, afterViewport]) expect(getComputedStyle(viewport).overflow).toBe('hidden');
    expect(before.getBoundingClientRect().top - beforeViewport.getBoundingClientRect().top).toBe(-360);
    expect(after.getBoundingClientRect().left - afterViewport.getBoundingClientRect().left).toBe(-640);
    expect(reveal.style.clipPath).toBe('inset(0px 50% 0px 0px)');
    expect(reveal.getBoundingClientRect().width).toBe(outer.width);
    const divider = el.shadowRoot.querySelector('[part="divider"]');
    expect(divider.getBoundingClientRect().left + 1 - outer.left).toBe(320);
    el.position = 25;
    await vi.waitFor(() => expect(reveal.style.clipPath).toBe('inset(0px 75% 0px 0px)'));
    expect(before.getBoundingClientRect().width).toBe(1280);
    expect(after.getBoundingClientRect().width).toBe(1280);
  });

  it('recomputes crop-only changes without replacing loaded images and handles invalid or unusable crop dimensions', async () => {
    const el = await create();
    const before = el.shadowRoot.querySelector('[part="before-image"]') as HTMLImageElement;
    el.beforeCrop = { x: 60, y: 0, width: 40, height: 100 };
    await vi.waitFor(() => expect(frame(el).getBoundingClientRect().height).toBe(900));
    expect(el.shadowRoot.querySelector('[part="before-image"]')).toBe(before);
    expect(control(el).disabled).toBe(false);
    el.beforeCrop = { x: 60, y: 0, width: 41, height: 100 };
    await vi.waitFor(() => expect(control(el).disabled).toBe(true));
    expect(el.shadowRoot.querySelector('[role="status"]').textContent).toBe('Comparison unavailable');
    el.beforeCrop = undefined;
    await vi.waitFor(() => expect(control(el).disabled).toBe(false));
    vi.spyOn(before, 'naturalWidth', 'get').mockReturnValue(0);
    before.dispatchEvent(new Event('load'));
    el.beforeCrop = { x: 0, y: 0, width: 50, height: 100 };
    await vi.waitFor(() => expect(control(el).disabled).toBe(true));
    expect(el.shadowRoot.querySelector('[role="status"]').textContent).toBe('Comparison unavailable');
    el.beforeCrop = undefined;
    await vi.waitFor(() => expect(control(el).disabled).toBe(false));
  });

  it('uses one native range for keyboard, accessible value text and continuous numeric events', async () => {
    const el = await create({ ariaLabel: 'Compare screens' });
    const change = vi.fn(); el.addEventListener('qChange', change);
    const range = control(el);
    expect(el.shadowRoot.querySelectorAll('input[type="range"]')).toHaveLength(1);
    expect(range.getAttribute('aria-label')).toBe('Compare screens');
    range.focus();
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => expect(el.position).toBe(51));
    expect(change.mock.calls[0][0].detail).toBe(51);
    expect(range.getAttribute('aria-valuetext')).toBe('51% Before revealed');
    await userEvent.keyboard('{End}');
    await vi.waitFor(() => expect(el.position).toBe(100));
    await userEvent.keyboard('{Home}');
    await vi.waitFor(() => expect(el.position).toBe(0));
    expect(el.shadowRoot.activeElement).toBe(range);
  });

  it('supports real pointer capture, clamping outside the frame and cancellation', async () => {
    const el = await create(); const change = vi.fn(); el.addEventListener('qChange', change);
    await userEvent.click(page.getByRole('slider', { name: 'Image comparison' }).element().parentElement!);
    expect(el.shadowRoot.activeElement).toBe(control(el));
    // Synthetic events cannot create an active browser pointer; exercise lifecycle after capture through a shim.
    vi.spyOn(frame(el), 'setPointerCapture').mockImplementation(() => undefined);
    vi.spyOn(frame(el), 'hasPointerCapture').mockReturnValue(false);
    const left = frame(el).getBoundingClientRect().left;
    pointer(el, 'pointerdown', left + 160);
    expect(el.position).toBe(25);
    pointer(el, 'pointermove', left + 800);
    expect(el.position).toBe(100);
    pointer(el, 'pointermove', left - 50);
    expect(el.position).toBe(0);
    pointer(el, 'pointercancel', left);
    const count = change.mock.calls.length;
    pointer(el, 'pointermove', left + 320);
    expect(el.position).toBe(0); expect(change).toHaveBeenCalledTimes(count);
  });

  it('allows vertical touch gestures and claims horizontal gestures after intent is known', async () => {
    const el = await create();
    vi.spyOn(frame(el), 'setPointerCapture').mockImplementation(() => undefined);
    vi.spyOn(frame(el), 'hasPointerCapture').mockReturnValue(false);
    const left = frame(el).getBoundingClientRect().left;
    expect(getComputedStyle(frame(el)).touchAction).toBe('pan-y');
    pointer(el, 'pointerdown', left + 100, 100, 'touch');
    pointer(el, 'pointermove', left + 102, 160, 'touch');
    expect(el.position).toBe(50);
    pointer(el, 'pointermove', left + 500, 160, 'touch');
    expect(el.position).toBe(50);
    pointer(el, 'pointerdown', left + 100, 100, 'touch', 2);
    pointer(el, 'pointermove', left + 103, 101, 'touch', 2);
    expect(el.position).toBe(50);
    pointer(el, 'pointermove', left + 160, 102, 'touch', 2);
    expect(el.position).toBe(25);
    pointer(el, 'pointerup', left + 160, 102, 'touch', 2);
    expect(el.shadowRoot.activeElement).toBe(control(el));
  });

  it('preserves configured dimensions across missing sources, image failures and replacements', async () => {
    const el = await create({ beforeSrc: '', afterSrc: '', aspectRatio: 2 }, false);
    expect(control(el).disabled).toBe(true);
    expect(frame(el).getBoundingClientRect().height).toBe(320);
    expect(el.shadowRoot.querySelector('[role="status"]').textContent).toBe('Comparison unavailable');
    el.beforeSrc = image('red'); el.afterSrc = 'data:image/png;base64,bm90YW5pbWFnZQ==';
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('[role="status"]').textContent).toBe('Comparison unavailable'));
    expect(frame(el).getBoundingClientRect().height).toBe(320); expect(control(el).disabled).toBe(true);
    el.afterSrc = image('blue');
    await vi.waitFor(() => expect(control(el).disabled).toBe(false));
    expect(frame(el).getBoundingClientRect().height).toBe(320);
    el.aspectRatio = 0;
    await vi.waitFor(() => expect(frame(el).getBoundingClientRect().height).toBe(360));
  });

  it('rejects detached stale load/error events and waits for both current images', async () => {
    const el = await create();
    const oldBefore = el.shadowRoot.querySelector('[part="before-image"]');
    const oldAfter = el.shadowRoot.querySelector('[part="after-image"]');
    el.beforeSrc = ''; el.afterSrc = '';
    await vi.waitFor(() => expect(control(el).disabled).toBe(true));
    oldBefore.dispatchEvent(new Event('load')); oldAfter.dispatchEvent(new Event('load'));
    expect(control(el).disabled).toBe(true);
    el.beforeSrc = image('green');
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('[part="before-image"]')).not.toBeNull());
    expect(control(el).disabled).toBe(true);
    el.afterSrc = image('yellow');
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('[part="before-image"]')).not.toBe(oldBefore));
    await vi.waitFor(() => expect(control(el).disabled).toBe(false));
    oldBefore.dispatchEvent(new Event('error')); oldAfter.dispatchEvent(new Event('error'));
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(control(el).disabled).toBe(false);
  });

  it('captures the registered permanent illustration example', async () => {
    await page.viewport(800, 600);
    const el = await create({
      beforeSrc: '/src/playground/assets/comparison-before.svg',
      afterSrc: '/src/playground/assets/comparison-after.svg',
      beforeAlt: 'Illustrated workspace with a dark blue background',
      afterAlt: 'Illustrated workspace with a green background',
    });
    el.style.width = '480px';
    await page.screenshot({ element: el, path: 'C:/Dev/PurelyIT/WebQuark/docs/components/assets/q-image-comparison-half.png' });
  });
});
