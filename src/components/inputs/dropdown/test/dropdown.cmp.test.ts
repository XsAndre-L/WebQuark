import { afterEach, describe, expect, it } from 'vitest';

import '../dropdown';

async function nextFrame(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function createDropdown(options: Array<{ label: string; value: string }>): Promise<HTMLQDropdownElement> {
  const element = document.createElement('q-dropdown');
  element.options = options;
  element.style.width = '220px';
  document.body.append(element);
  await customElements.whenDefined('q-dropdown');
  await nextFrame();
  return element;
}

describe('q-dropdown floating menu in Chromium', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('keeps focus and scroll position on the trigger while opening', async () => {
    const scroller = document.createElement('div');
    scroller.style.cssText = 'position:fixed;left:20px;top:20px;width:280px;height:140px;overflow:auto;';
    const spacer = document.createElement('div');
    spacer.style.height = '180px';
    const element = document.createElement('q-dropdown');
    element.options = Array.from({ length: 12 }, (_, index) => ({
      label: `Option ${index + 1}`,
      value: `option-${index + 1}`,
    }));
    element.style.width = '220px';
    scroller.append(spacer, element);
    document.body.append(scroller);
    await customElements.whenDefined('q-dropdown');
    await nextFrame();
    scroller.scrollTop = 100;

    const trigger = element.shadowRoot?.querySelector<HTMLButtonElement>('.dropdown-trigger');
    trigger?.focus();
    const initialScrollTop = scroller.scrollTop;
    trigger?.click();
    await nextFrame();
    await nextFrame();

    expect(scroller.scrollTop).toBe(initialScrollTop);
    expect(element.shadowRoot?.activeElement).toBe(trigger);
  });

  it('flips above near the viewport bottom and remains inside the viewport', async () => {
    const element = await createDropdown(
      Array.from({ length: 12 }, (_, index) => ({
        label: `Option ${index + 1}`,
        value: `option-${index + 1}`,
      })),
    );
    element.style.cssText = 'position:fixed;right:2px;bottom:2px;width:220px;';
    await nextFrame();

    element.shadowRoot?.querySelector<HTMLButtonElement>('.dropdown-trigger')?.click();
    await nextFrame();
    await nextFrame();

    const menu = element.shadowRoot?.querySelector<HTMLElement>('.dropdown-menu');
    const bounds = menu?.getBoundingClientRect();
    expect(menu?.dataset['placement']).toBe('top');
    expect(bounds?.left).toBeGreaterThanOrEqual(8);
    expect(bounds?.right).toBeLessThanOrEqual(window.innerWidth - 8);
    expect(bounds?.top).toBeGreaterThanOrEqual(8);
    expect(bounds?.bottom).toBeLessThanOrEqual(window.innerHeight - 8);
  });
});
