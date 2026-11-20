import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';

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
        { label: 'Reports', value: 'reports', badgeCount: 123, badgeLabel: '123 unread reports' },
      ],
    });

    const body = el.shadowRoot.querySelector('.nav-body') as HTMLElement;
    const roles = Array.from(el.shadowRoot.querySelectorAll('.nav-item'))
      .map((item: Element) => item.getAttribute('role'));
    const activeItem = el.shadowRoot.querySelector('[aria-current="page"]') as HTMLElement;

    expect(body.hasAttribute('role')).toBe(false);
    expect(roles.every(role => role === 'button')).toBe(true);
    for (const label of ['Admin', 'Users']) {
      expect(el.shadowRoot.querySelector(`.nav-item[aria-label="${label}"]`).hasAttribute('title')).toBe(false);
    }
    expect(activeItem.textContent).toContain('Reports');
    expect(activeItem.getAttribute('aria-label')).toBe('Reports, 123 unread reports');
    expect(activeItem.title).toBe('Reports, 123 unread reports');
    expect(activeItem.querySelector('[part="item-badge"]')?.textContent).toBe('99+');
    expect(activeItem.querySelector('[part="item-badge"]')?.getAttribute('aria-hidden')).toBe('true');

    el.collapsible = true;
    el.collapsed = true;
    el.collapseMode = 'rail';
    el.items = [{ label: 'Reports', value: 'reports', badgeCount: 2, badgeLabel: '2 unread reports' }];
    await wait();
    expect(el.shadowRoot.querySelector('[part="item-badge"]')?.textContent).toBe('2');
    expect(el.shadowRoot.querySelector('.nav-sidebar').classList.contains('is-collapsed')).toBe(true);
    expect(el.shadowRoot.querySelector('.nav-item').getAttribute('aria-label')).toBe('Reports, 2 unread reports');

    el.items = [{ label: 'Reports', value: 'reports', badgeCount: 0 }];
    await wait();
    expect(el.shadowRoot.querySelector('[part="item-badge"]')).toBeNull();
    expect(el.shadowRoot.querySelector('.nav-item').getAttribute('aria-label')).toBe('Reports');
    expect(el.shadowRoot.querySelector('.nav-item').getAttribute('title')).toBe('Reports');
  });

  it('normalizes string navigation items into matching labels and values', async () => {
    const el = await createComponent({ variant: 'nav', items: ['Home', 'Reports'] });
    const handler = vi.fn();
    el.addEventListener('qSelect', handler);

    const items = Array.from(el.shadowRoot.querySelectorAll('.nav-item')) as HTMLElement[];
    items[1].click();
    await wait();

    expect(items.map(item => item.textContent?.trim())).toEqual(['Home', 'Reports']);
    expect(handler.mock.calls[0][0].detail.value).toBe('Reports');
  });

  it('preserves navigation item DOM identity through replacement and reorder', async () => {
    const items = [
      { label: 'Home', value: 'home' },
      { label: 'Reports', value: 'reports' },
    ];
    const el = await createComponent({ variant: 'nav', items });
    const initialGroups = Array.from(
      el.shadowRoot.querySelectorAll('.nav-item-group'),
    ) as HTMLElement[];

    el.items = [
      { label: 'Reports updated', value: 'reports' },
      { label: 'Home', value: 'home' },
    ];
    await wait(50);

    const reorderedGroups = Array.from(
      el.shadowRoot.querySelectorAll('.nav-item-group'),
    ) as HTMLElement[];

    expect(reorderedGroups[0]).toBe(initialGroups[1]);
    expect(reorderedGroups[1]).toBe(initialGroups[0]);
    expect(reorderedGroups[0].textContent).toContain('Reports updated');
  });

  it('warns and keeps duplicate navigation identities distinct', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const el = await createComponent({
      variant: 'nav',
      items: [
        { label: 'First', value: 'duplicate' },
        { label: 'Second', value: 'duplicate' },
      ],
    });

    const groups = el.shadowRoot.querySelectorAll('.nav-item-group');

    expect(groups).toHaveLength(2);
    expect(groups[0]).not.toBe(groups[1]);
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate identity "duplicate"'),
    );
  });

  it('forwards aria-label to navigation, panel, and drawer regions', async () => {
    const nav = await createComponent({ variant: 'nav', ariaLabel: 'Account sections' });
    const panel = await createComponent({ variant: 'panel', ariaLabel: 'Filters' });
    const drawer = await createComponent({ variant: 'drawer', ariaLabel: 'Cart' });

    expect(nav.shadowRoot.querySelector('[role="navigation"]').getAttribute('aria-label')).toBe('Account sections');
    expect(panel.shadowRoot.querySelector('[role="region"]').getAttribute('aria-label')).toBe('Filters');
    expect(drawer.shadowRoot.querySelector('[role="dialog"]').getAttribute('aria-label')).toBe('Cart');
  });

  it('keeps empty nav header and footer regions hidden', async () => {
    const el = await createComponent({
      variant: 'nav',
      items: [{ label: 'Reports', value: 'reports' }],
    });

    const header = el.shadowRoot.querySelector('.nav-header') as HTMLElement;
    const footer = el.shadowRoot.querySelector('.nav-footer') as HTMLElement;

    expect(header.classList.contains('is-hidden')).toBe(true);
    expect(footer.classList.contains('is-hidden')).toBe(true);
  });

  it('renders nav footer when footer content is slotted', async () => {
    const el = document.createElement('q-sidepanel');
    Object.assign(el, {
      variant: 'nav',
      items: [{ label: 'Reports', value: 'reports' }],
    });

    const footer = document.createElement('div');
    footer.setAttribute('slot', 'footer');
    footer.textContent = 'Footer action';
    el.appendChild(footer);
    document.body.appendChild(el);

    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await wait(50);
    }

    const slot = el.shadowRoot?.querySelector('.nav-footer slot[name="footer"]') as HTMLSlotElement;

    expect(el.shadowRoot?.querySelector('.nav-footer')).toBeTruthy();
    expect(slot.assignedElements()).toContain(footer);
  });

  it('renders persistent panel mode with slotted content and no drawer backdrop', async () => {
    const el = await createComponent({ variant: 'panel', side: 'right' });
    const content = document.createElement('span');
    content.textContent = 'Panel content';
    el.appendChild(content);
    await wait();

    const slot = el.shadowRoot.querySelector('.panel-body slot') as HTMLSlotElement;

    expect(el.shadowRoot.querySelector('.panel-shell')).toBeTruthy();
    expect(el.shadowRoot.querySelector('.sidepanel-backdrop')).toBeNull();
    expect(slot.assignedNodes()).toContain(content);
  });

  it('uses the primary tone for links and top-level groups while muting nested groups', async () => {
    const el = await createComponent({
      variant: 'nav',
      items: [
        {
          label: 'Admin',
          value: 'admin',
          children: [
            {
              label: 'Users',
              value: 'users',
              children: [{ label: 'Invites', value: 'invites' }],
            },
          ],
        },
        { label: 'Dashboard', value: 'dashboard' },
        {
          label: 'Reports',
          value: 'reports',
          children: [{ label: 'Overview', value: 'overview' }],
        },
      ],
    });

    const items = Array.from(el.shadowRoot.querySelectorAll('.nav-item')) as HTMLElement[];

    expect(items.map(item => item.textContent?.trim())).toEqual([
      'Admin',
      'Users',
      'Invites',
      'Dashboard',
      'Reports',
      'Overview',
    ]);
    expect(items.map(item => item.dataset.depth)).toEqual(['0', '1', '2', '0', '0', '1']);
    expect(items.map(item => item.dataset.depthTone)).toEqual([
      'primary',
      'secondary',
      'primary',
      'primary',
      'primary',
      'primary',
    ]);
  });

  it('keeps designated navigation categories expanded and non-collapsible', async () => {
    const el = await createComponent({
      variant: 'nav',
      expanded: false,
      items: [
        {
          label: 'Analytics',
          value: 'analytics',
          alwaysExpanded: true,
          children: [
            {
              label: 'Store Analytics',
              value: 'store-analytics',
              alwaysExpanded: true,
              children: [{ label: 'Stock on Hand', value: 'stock-on-hand' }],
            },
          ],
        },
      ],
    });

    const categories = Array.from(
      el.shadowRoot.querySelectorAll('.nav-item--always-expanded'),
    ) as HTMLElement[];

    expect(categories).toHaveLength(2);
    expect(categories.map(category => category.getAttribute('role'))).toEqual([
      'heading',
      'heading',
    ]);
    expect(categories.map(category => category.getAttribute('tabindex'))).toEqual([null, null]);
    expect(el.shadowRoot.querySelectorAll('.nav-item__chevron')).toHaveLength(0);
    expect(el.shadowRoot.textContent).toContain('Stock on Hand');

    categories[0].click();
    categories[1].click();
    await wait();

    expect(el.shadowRoot.textContent).toContain('Stock on Hand');
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
    const icon = control.querySelector('q-icon') as HTMLElement;

    expect(control.getAttribute('aria-label')).toBe('Collapse sidebar');
    expect(control.getAttribute('title')).toBe('Collapse sidebar');
    expect((icon as any).name).toBe('panel-right-close');

    control.click();
    await wait();

    expect(el.collapsed).toBe(true);
    expect(collapsedHandler).toHaveBeenCalledTimes(1);
    expect(collapsedHandler.mock.calls[0][0].detail.collapsed).toBe(true);
    expect(control.getAttribute('aria-label')).toBe('Expand sidebar');
    expect(control.getAttribute('title')).toBe('Expand sidebar');
    expect((control.querySelector('q-icon') as any).name).toBe('panel-right-open');
  });
});
