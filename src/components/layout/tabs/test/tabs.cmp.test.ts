import { afterEach, describe, expect, it, vi } from 'vitest';

import '../tabs';

async function nextFrame(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

describe('q-tabs keyboard navigation in Chromium', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it('preserves tab DOM nodes and generated IDs for new arrays and reorder', async () => {
    const element = document.createElement('q-tabs');
    element.value = 'alpha';
    element.items = [
      { label: 'Alpha', value: 'alpha' },
      { label: 'Bravo', value: 'bravo', tabId: 'bravo-tab' },
      { label: 'Charlie', value: 'charlie' },
    ];
    document.body.append(element);
    await customElements.whenDefined('q-tabs');
    await nextFrame();

    const initialTabs = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const [alphaTab, bravoTab, charlieTab] = initialTabs;
    const initialIds = new Map(
      initialTabs.map(tab => [tab.textContent?.trim(), tab.id]),
    );

    element.items = [
      { label: 'Alpha updated', value: 'alpha' },
      { label: 'Bravo', value: 'bravo', tabId: 'bravo-tab' },
      { label: 'Charlie', value: 'charlie' },
    ];
    await nextFrame();

    const updatedTabs = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );

    expect(updatedTabs[0]).toBe(alphaTab);
    expect(updatedTabs[1]).toBe(bravoTab);
    expect(updatedTabs[2]).toBe(charlieTab);
    expect(updatedTabs[0].id).toBe(initialIds.get('Alpha'));
    expect(updatedTabs[1].id).toBe('bravo-tab');
    expect(updatedTabs[2].id).toBe(initialIds.get('Charlie'));

    element.items = [
      { label: 'Charlie', value: 'charlie' },
      { label: 'Alpha updated', value: 'alpha' },
      { label: 'Bravo', value: 'bravo', tabId: 'bravo-tab' },
    ];
    await nextFrame();

    const reorderedTabs = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );

    expect(reorderedTabs).toEqual([charlieTab, alphaTab, bravoTab]);
    expect(reorderedTabs.map(tab => tab.id)).toEqual([
      initialIds.get('Charlie'),
      initialIds.get('Alpha'),
      'bravo-tab',
    ]);
  });

  it('reuses retained tabs while adding and removing items', async () => {
    const element = document.createElement('q-tabs');
    element.items = ['Alpha', 'Bravo', 'Charlie'];
    document.body.append(element);
    await customElements.whenDefined('q-tabs');
    await nextFrame();

    const [alphaTab, bravoTab, charlieTab] = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );

    element.items = ['Charlie', 'Delta', 'Bravo'];
    await nextFrame();

    const [retainedCharlie, deltaTab, retainedBravo] = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );

    expect(retainedCharlie).toBe(charlieTab);
    expect(retainedBravo).toBe(bravoTab);
    expect(deltaTab).not.toBe(alphaTab);
    expect(alphaTab.isConnected).toBe(false);
  });

  it('warns and keeps DOM IDs unique when tab identities are duplicated', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const element = document.createElement('q-tabs');
    element.items = [
      { label: 'Alpha', value: 'alpha', tabId: 'shared-tab' },
      { label: 'Bravo', value: 'bravo', tabId: 'shared-tab' },
    ];
    document.body.append(element);
    await customElements.whenDefined('q-tabs');
    await nextFrame();

    const tabs = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );

    expect(tabs[0].id).toBe('shared-tab');
    expect(tabs[1].id).not.toBe('shared-tab');
    expect(new Set(tabs.map(tab => tab.id)).size).toBe(2);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        '[WebQuark Collection Identity: q-tabs items] Duplicate identity "shared-tab"',
      ),
    );
  });

});
