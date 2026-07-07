import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-sidepanel', () => {
  async function wait(ms = 30): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-sidepanel');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await wait(50);
    }
    return el;
  }

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('closes drawer mode from the backdrop and emits qClose', async () => {
    const el = await createComponent({ variant: 'drawer', open: true });
    const closeHandler = vi.fn();
    el.addEventListener('qClose', closeHandler);

    const backdrop = el.shadowRoot.querySelector('.sidepanel-backdrop') as HTMLElement;
    backdrop.click();
    await wait();

    expect(el.open).toBe(false);
    expect(closeHandler).toHaveBeenCalledTimes(1);
  });

  it('closes drawer mode on Escape and emits qClose', async () => {
    const el = await createComponent({ variant: 'drawer', open: true });
    const closeHandler = vi.fn();
    el.addEventListener('qClose', closeHandler);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wait();

    expect(el.open).toBe(false);
    expect(closeHandler).toHaveBeenCalledTimes(1);
  });

  it('renders navigation items with consistent button roles', async () => {
    const el = await createComponent({
      variant: 'nav',
      value: 'reports',
      items: [
        {
          label: 'Admin',
          value: 'admin',
          children: [{ label: 'Users', value: 'users' }],
        },
        { label: 'Reports', value: 'reports' },
      ],
    });

    const body = el.shadowRoot.querySelector('.nav-body') as HTMLElement;
    const roles = Array.from(el.shadowRoot.querySelectorAll('.nav-item'))
      .map((item: Element) => item.getAttribute('role'));
    const activeItem = el.shadowRoot.querySelector('[aria-current="page"]') as HTMLElement;

    expect(body.hasAttribute('role')).toBe(false);
    expect(roles.every(role => role === 'button')).toBe(true);
    expect(activeItem.textContent).toContain('Reports');
  });

  it('preserves user-collapsed groups when items update', async () => {
    const items = [
      {
        label: 'Admin',
        value: 'admin',
        children: [{ label: 'Users', value: 'users' }],
      },
    ];
    const el = await createComponent({ variant: 'nav', items });

    expect(el.shadowRoot.textContent).toContain('Users');

    const groupButton = el.shadowRoot.querySelector('.nav-item') as HTMLElement;
    groupButton.click();
    await wait();

    expect(el.shadowRoot.textContent).not.toContain('Users');

    el.items = [
      {
        label: 'Admin',
        value: 'admin',
        children: [{ label: 'Users', value: 'users' }],
      },
    ];
    await wait(50);

    expect(el.shadowRoot.textContent).not.toContain('Users');
  });

  it('toggles collapsed state from the built-in collapse control', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<svg viewBox="0 0 24 24"></svg>',
    }));
    const el = await createComponent({
      variant: 'nav',
      collapsible: true,
      collapseControl: 'edge',
    });
    const collapsedHandler = vi.fn();
    el.addEventListener('qCollapsedChange', collapsedHandler);

    const control = el.shadowRoot.querySelector('.collapse-control') as HTMLButtonElement;
    control.click();
    await wait();

    expect(el.collapsed).toBe(true);
    expect(collapsedHandler).toHaveBeenCalledTimes(1);
    expect(collapsedHandler.mock.calls[0][0].detail.collapsed).toBe(true);
  });
});
