import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-alert', () => {
  const waitForUpdate = () => new Promise(resolve => setTimeout(resolve, 10));

  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createComponent(
    props: Record<string, unknown> = {},
    content = 'Something needs attention.',
  ): Promise<any> {
    const element = document.createElement('q-alert');
    Object.assign(element, props);
    element.textContent = content;
    document.body.appendChild(element);
    if (typeof (element as any).componentOnReady === 'function') {
      await (element as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return element;
  }

  it('does not create a live region unless announcements are requested', async () => {
    const element = await createComponent();
    const container = element.shadowRoot.querySelector(
      '[part="container"]',
    ) as HTMLElement;

    expect(container.hasAttribute('role')).toBe(false);
    expect(container.hasAttribute('aria-live')).toBe(false);
    expect(element.getAttribute('variant')).toBe('info');
  });

  it.each([
    ['polite', 'status', 'polite'],
    ['assertive', 'alert', 'assertive'],
  ] as const)(
    'maps %s announcements to an accessible live region',
    async (announcement, role, ariaLive) => {
      const element = await createComponent({ announcement });
      const container = element.shadowRoot.querySelector(
        '[part="container"]',
      ) as HTMLElement;

      expect(container.getAttribute('role')).toBe(role);
      expect(container.getAttribute('aria-live')).toBe(ariaLive);
      expect(container.getAttribute('aria-atomic')).toBe('true');
    },
  );

  it('renders heading, message, and action content in separate regions', async () => {
    const element = document.createElement('q-alert') as any;
    element.heading = 'Could not save';
    element.textContent = 'Check your connection and try again.';
    const action = document.createElement('button');
    action.setAttribute('slot', 'actions');
    action.textContent = 'Retry';
    element.appendChild(action);
    document.body.appendChild(element);
    await element.componentOnReady();

    expect(element.shadowRoot.querySelector('.heading')?.textContent).toBe(
      'Could not save',
    );
    expect(
      element.shadowRoot
        .querySelector('slot:not([name])')
        ?.assignedNodes()
        .map((node: Node) => node.textContent)
        .join(''),
    ).toContain('Check your connection');
    expect(
      element.shadowRoot
        .querySelector('slot[name="actions"]')
        ?.assignedElements(),
    ).toEqual([action]);
  });

  it('emits a controlled dismiss request with the configured label', async () => {
    const element = await createComponent({
      dismissible: true,
      dismissLabel: 'Close network warning',
    });
    const handler = vi.fn();
    element.addEventListener('qDismiss', handler);
    const button = element.shadowRoot.querySelector(
      '[part="dismiss-button"]',
    ) as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Close network warning');
    button.click();
    await waitForUpdate();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(element.isConnected).toBe(true);
  });

  it.each(['success', 'warning', 'danger'] as const)(
    'reflects the %s visual variant',
    async variant => {
      const element = await createComponent({ variant });
      const container = element.shadowRoot.querySelector(
        '[part="container"]',
      ) as HTMLElement;

      expect(element.getAttribute('variant')).toBe(variant);
      expect(container.classList.contains(`variant-${variant}`)).toBe(true);
    },
  );
});
