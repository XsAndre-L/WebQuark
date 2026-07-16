import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';
// @ts-ignore
import { QTabs as QTabsElement } from '../../../../../dist/components/q-tabs.js';

defineCustomElements();

describe('q-tabs', () => {
  const waitForUpdate = () => new Promise(resolve => setTimeout(resolve, 10));

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createComponent(props: Record<string, unknown> = {}): Promise<any> {
    const element = document.createElement('q-tabs');
    Object.assign(element, props);
    document.body.appendChild(element);
    if (typeof (element as any).componentOnReady === 'function') {
      await (element as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return element;
  }

  it('renders an accessible selected tab and panel relationship', async () => {
    const element = await createComponent({
      ariaLabel: 'Debug sections',
      value: 'location',
      items: [
        { label: 'Debugging', value: 'debugging', panelId: 'debugging-panel' },
        { label: 'Mock location', value: 'location', tabId: 'location-tab', panelId: 'location-panel' },
      ],
    });
    const list = element.shadowRoot.querySelector('[role="tablist"]') as HTMLElement;
    const tabs = Array.from(element.shadowRoot.querySelectorAll('[role="tab"]')) as HTMLElement[];

    expect(list.getAttribute('aria-label')).toBe('Debug sections');
    expect(tabs.map(tab => tab.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    expect(tabs[1].id).toBe('location-tab');
    expect(tabs[1].getAttribute('aria-controls')).toBe('location-panel');
    expect(tabs.map(tab => tab.getAttribute('tabindex'))).toEqual(['-1', '0']);
  });

  it('emits the selected value when clicked', async () => {
    const element = await createComponent({ items: ['Debugging', 'Permissions'] });
    const handler = vi.fn();
    element.addEventListener('qChange', handler);

    element.shadowRoot.querySelectorAll('button')[1].click();
    await waitForUpdate();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toBe('Permissions');
  });

  it('uses arrow keys with wrapping and skips disabled tabs', () => {
    const instance = new QTabsElement() as any;
    const emit = vi.fn();
    instance.value = 'debugging';
    instance.items = [
      { label: 'Debugging', value: 'debugging' },
      { label: 'Unavailable', value: 'unavailable', disabled: true },
      { label: 'Permissions', value: 'permissions' },
    ];
    instance.qChange = { emit };
    const event = new Event('keydown', { bubbles: true, cancelable: true }) as KeyboardEvent;
    Object.defineProperty(event, 'key', { value: 'ArrowRight' });
    instance.handleKeyDown(event, 0);

    expect(emit).toHaveBeenCalledWith('permissions');
    expect(event.defaultPrevented).toBe(true);
  });
});
