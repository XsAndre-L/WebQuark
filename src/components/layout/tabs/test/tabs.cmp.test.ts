import { afterEach, describe, expect, it, vi } from 'vitest';

import '../tabs';

async function nextFrame(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

describe('q-tabs keyboard navigation in Chromium', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('moves focus, wraps, skips disabled tabs, and emits the activated value', async () => {
    const element = document.createElement('q-tabs');
    element.value = 'debugging';
    element.items = [
      { label: 'Debugging', value: 'debugging' },
      { label: 'Unavailable', value: 'unavailable', disabled: true },
      { label: 'Permissions', value: 'permissions' },
    ];
    const handler = vi.fn();
    element.addEventListener('qChange', handler);
    document.body.append(element);
    await customElements.whenDefined('q-tabs');
    await nextFrame();

    const firstTab = element.shadowRoot?.querySelector<HTMLButtonElement>('button');
    firstTab?.focus();
    firstTab?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
        composed: true,
      }),
    );
    await nextFrame();

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ detail: 'permissions' }));
    expect(element.shadowRoot?.activeElement?.textContent?.trim()).toBe('Permissions');
  });

  it('accepts every visual variant through the HTML attribute API', async () => {
    for (const variant of ['underline', 'enclosed', 'pills', 'button']) {
      const element = document.createElement('q-tabs');
      element.setAttribute('variant', variant);
      element.items = ['First', 'Second'];
      document.body.append(element);
      await customElements.whenDefined('q-tabs');
      await nextFrame();

      expect(element.shadowRoot?.querySelector('.tab-list')?.classList.contains(`variant-${variant}`)).toBe(
        true,
      );
    }
  });

  it('caps tab buttons at the shared 94px maximum width', async () => {
    const element = document.createElement('q-tabs');
    element.items = ['A deliberately long tab label'];
    document.body.append(element);
    await customElements.whenDefined('q-tabs');
    await nextFrame();

    const tab = element.shadowRoot?.querySelector<HTMLButtonElement>('.tab');

    expect(getComputedStyle(tab!).maxWidth).toBe('94px');
  });

});
