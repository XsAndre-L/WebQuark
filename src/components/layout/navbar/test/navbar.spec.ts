import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-navbar', () => {
  const waitForUpdate = () => new Promise(resolve => setTimeout(resolve, 10));

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-navbar');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('renders configured navigation items', async () => {
    const el = await createComponent({
      items: [{ label: 'Docs', value: 'docs' }],
    });
    expect(el.shadowRoot.textContent).toContain('Docs');
  });

  it('normalizes string items into matching labels and values', async () => {
    const el = await createComponent({ items: ['Home', 'Docs'] });
    const handler = vi.fn();
    el.addEventListener('qSelect', handler);

    const items = Array.from(el.shadowRoot.querySelectorAll('.desktop-nav .nav-item')) as HTMLElement[];
    items[1].click();
    await waitForUpdate();

    expect(items.map(item => item.textContent?.trim())).toEqual(['Home', 'Docs']);
    expect(handler.mock.calls[0][0].detail.value).toBe('Docs');
  });

  it('preserves item nodes when a new array keeps the same values', async () => {
    const items = [
      { label: 'Home', value: 'home' },
      { label: 'Docs', value: 'docs' },
    ];
    const el = await createComponent({ items });
    const desktopBefore = Array.from(el.shadowRoot.querySelectorAll('.desktop-nav .nav-item')) as HTMLElement[];

    el.items = items.map(item => ({ ...item }));
    await waitForUpdate();

    const desktopAfter = Array.from(el.shadowRoot.querySelectorAll('.desktop-nav .nav-item')) as HTMLElement[];
    expect(desktopAfter[0]).toBe(desktopBefore[0]);
    expect(desktopAfter[1]).toBe(desktopBefore[1]);
  });

  it('reuses reordered items while adding and removing only changed values', async () => {
    const el = await createComponent({
      items: [
        { label: 'Alpha', value: 'a' },
        { label: 'Bravo', value: 'b' },
        { label: 'Charlie', value: 'c' },
      ],
    });
    const before = Array.from(el.shadowRoot.querySelectorAll('.desktop-nav .nav-item')) as HTMLElement[];

    el.items = [
      { label: 'Charlie updated', value: 'c' },
      { label: 'Alpha', value: 'a' },
      { label: 'Delta', value: 'd' },
    ];
    await waitForUpdate();

    const after = Array.from(el.shadowRoot.querySelectorAll('.desktop-nav .nav-item')) as HTMLElement[];
    expect(after.map(item => item.textContent?.trim())).toEqual(['Charlie updated', 'Alpha', 'Delta']);
    expect(after[0]).toBe(before[2]);
    expect(after[1]).toBe(before[0]);
    expect(after[2]).not.toBe(before[1]);
    expect(before[1].isConnected).toBe(false);
  });

  it('warns and keeps rendering when item values are missing or duplicated', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const el = await createComponent({
      items: [
        { label: 'First', value: 'same' },
        { label: 'Duplicate', value: 'same' },
        { label: 'Missing' },
      ],
    });

    const rendered = Array.from(el.shadowRoot.querySelectorAll('.desktop-nav .nav-item')) as HTMLElement[];
    const messages = warn.mock.calls.map(([message]) => String(message));

    expect(rendered.map(item => item.textContent?.trim())).toEqual(['First', 'Duplicate', 'Missing']);
    expect(messages.some(message => message.includes('Duplicate identity "same"'))).toBe(true);
    expect(messages.some(message => message.includes('index 2 returned undefined'))).toBe(true);
  });

  it('uses a custom aria-label for both responsive navigation regions', async () => {
    const el = await createComponent({ ariaLabel: 'Product sections' });
    const navs = Array.from(el.shadowRoot.querySelectorAll('nav')) as HTMLElement[];

    expect(navs.map(nav => nav.getAttribute('aria-label'))).toEqual(['Product sections', 'Product sections']);
  });

  it('renders configured item icons', async () => {
    const el = await createComponent({
      items: [{ label: 'Home', value: 'home', icon: 'house', iconSize: 26 }],
    });

    const icon = el.shadowRoot.querySelector('.desktop-nav .nav-item q-icon') as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('name')).toBe('house');
    expect(icon.getAttribute('lib')).toBe('lucide');
    expect(icon.getAttribute('size')).toBe('26');
  });

  it('supports icon-only navigation items with an accessible label', async () => {
    const el = await createComponent({
      items: [{ label: 'Home', value: 'home', icon: 'house', iconOnly: true }],
    });

    const item = el.shadowRoot.querySelector('.desktop-nav .nav-item') as HTMLElement;
    const label = item.querySelector('.nav-item__label') as HTMLElement;

    expect(item.classList.contains('is-icon-only')).toBe(true);
    expect(item.getAttribute('aria-label')).toBe('Home');
    expect(label.getAttribute('aria-hidden')).toBe('true');
  });

  it('reflects inline mobile mode for non-collapsing navigation', async () => {
    const el = await createComponent({
      mobileMode: 'inline',
      items: [{ label: 'Home', value: 'home', icon: 'house', iconOnly: true }],
    });

    expect(el.getAttribute('mobile-mode')).toBe('inline');
  });

  it('reflects the configured navbar edge', async () => {
    const el = await createComponent({
      edge: 'bottom',
      items: [{ label: 'Home', value: 'home' }],
    });

    expect(el.getAttribute('edge')).toBe('bottom');
  });

  it('emits qSelect when an item is clicked', async () => {
    const el = await createComponent({
      items: [{ label: 'Docs', value: 'docs' }],
    });
    const handler = vi.fn();
    el.addEventListener('qSelect', handler);

    const item = el.shadowRoot.querySelector('.nav-item') as HTMLElement;
    item.click();
    await waitForUpdate();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.value).toBe('docs');
  });

  it('does not emit qSelect for disabled items', async () => {
    const el = await createComponent({
      items: [{ label: 'Disabled', value: 'disabled', disabled: true }],
    });
    const handler = vi.fn();
    el.addEventListener('qSelect', handler);

    const item = el.shadowRoot.querySelector('.nav-item') as HTMLElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });
    item.dispatchEvent(event);
    await waitForUpdate();

    expect(event.defaultPrevented).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it('marks the item matching activeValue as current', async () => {
    const el = await createComponent({
      activeValue: 'docs',
      items: [
        { label: 'Home', value: 'home' },
        { label: 'Docs', value: 'docs' },
      ],
    });

    const items = Array.from(el.shadowRoot.querySelectorAll('.desktop-nav .nav-item')) as HTMLElement[];
    expect(items[1].classList.contains('is-active')).toBe(true);
    expect(items[1].getAttribute('aria-current')).toBe('page');
  });

  it('wires and toggles the mobile menu', async () => {
    const el = await createComponent({
      items: [{ label: 'Docs', value: 'docs' }],
    });
    const handler = vi.fn();
    el.addEventListener('qMenuToggle', handler);

    const button = el.shadowRoot.querySelector('.menu-button') as HTMLButtonElement;
    const panel = el.shadowRoot.querySelector('.mobile-panel') as HTMLElement;
    const primaryNav = el.shadowRoot.querySelector('.desktop-nav') as HTMLElement;

    expect(panel.id).toMatch(/^q-navbar-mobile-panel-/);
    expect(button.getAttribute('aria-controls')).toBe(`${primaryNav.id} ${panel.id}`);
    expect(button.getAttribute('aria-haspopup')).toBe('true');

    button.click();
    await waitForUpdate();

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(handler).toHaveBeenLastCalledWith(expect.objectContaining({ detail: true }));

    button.click();
    await waitForUpdate();

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(handler).toHaveBeenLastCalledWith(expect.objectContaining({ detail: false }));
  });

  it('closes the mobile menu on Escape and outside click', async () => {
    const el = await createComponent({
      items: [{ label: 'Docs', value: 'docs' }],
    });
    const button = el.shadowRoot.querySelector('.menu-button') as HTMLButtonElement;

    button.click();
    await waitForUpdate();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await waitForUpdate();
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    await waitForUpdate();
    expect(button.getAttribute('aria-expanded')).toBe('true');

    window.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await waitForUpdate();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the mobile menu after selecting an item', async () => {
    const el = await createComponent({
      items: [{ label: 'Docs', value: 'docs' }],
    });
    const button = el.shadowRoot.querySelector('.menu-button') as HTMLButtonElement;

    button.click();
    await waitForUpdate();

    const item = el.shadowRoot.querySelector('.desktop-nav .nav-item') as HTMLElement;
    item.click();
    await waitForUpdate();

    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps logo-only brand links named by default', async () => {
    const el = await createComponent({
      logoSrc: '/logo.svg',
    });

    const logo = el.shadowRoot.querySelector('.brand-logo') as HTMLImageElement;
    expect(logo.getAttribute('alt')).toBe('Brand');
  });
});
