import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore Tests exercise the generated consumer API.
import { defineCustomElements } from '../../../../../packages/browser/components/dist/loader';

defineCustomElements();
const update = () => new Promise(resolve => setTimeout(resolve, 50));
async function mount(tag: string, props: Record<string, unknown>, html = ''): Promise<any> {
  const el = document.createElement(tag) as any;
  Object.assign(el, props);
  el.innerHTML = html;
  document.body.appendChild(el);
  await el.componentOnReady();
  await update();
  return el;
}
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });

describe('canonical property names and compatibility aliases', () => {
  it.each([
    ['q-quantity-selector', 'variant', '.quantity-selector'],
    ['q-step-diagram', 'layout', '.step-diagram'],
    ['q-step-diagram-item', 'layout', '.step-item'],
  ])('%s prioritizes orientation and supports restoring the alias', async (tag, alias, selector) => {
    const el = await mount(tag, { orientation: 'horizontal', [alias]: 'vertical' });
    const surface = () => el.shadowRoot.querySelector(selector);
    expect(surface().classList.contains('orientation-horizontal')).toBe(true);
    el.orientation = 'vertical';
    await update();
    expect(surface().classList.contains('orientation-vertical')).toBe(true);
    el[alias] = 'horizontal';
    await update();
    expect(surface().classList.contains('orientation-vertical')).toBe(true);
    el.orientation = undefined;
    await update();
    expect(surface().classList.contains('orientation-horizontal')).toBe(true);
  });

  it('propagates parent orientation to existing and newly slotted steps', async () => {
    const el = await mount('q-step-diagram', { orientation: 'horizontal' }, '<q-step-diagram-item></q-step-diagram-item>');
    expect(el.firstElementChild.orientation).toBe('horizontal');
    el.orientation = 'vertical';
    await update();
    expect(el.firstElementChild.orientation).toBe('vertical');
    const child = document.createElement('q-step-diagram-item') as any;
    el.appendChild(child);
    el.shadowRoot.querySelector('slot').dispatchEvent(new Event('slotchange'));
    await update();
    expect(child.orientation).toBe('vertical');
  });

  it('uses navbar value over activeValue, including an empty value', async () => {
    const el = await mount('q-navbar', { items: [{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }], value: 'two', activeValue: 'one' });
    expect(el.shadowRoot.querySelector('[aria-current="page"]').textContent).toContain('Two');
    el.value = '';
    await update();
    expect(el.shadowRoot.querySelector('[aria-current="page"]')).toBeNull();
    el.value = undefined;
    await update();
    expect(el.shadowRoot.querySelector('[aria-current="page"]').textContent).toContain('One');
  });

  it('allows borderless=false to override noBorders=true', async () => {
    const el = await mount('q-panel', { borderless: false, noBorders: true });
    expect(el.shadowRoot.querySelector('.panel').classList.contains('has-no-borders')).toBe(false);
    el.borderless = undefined;
    await update();
    expect(el.shadowRoot.querySelector('.panel').classList.contains('has-no-borders')).toBe(true);
  });

  it('uses dialog heading, backdrop and explicit false dismissal controls', async () => {
    const el = await mount('q-dialog', { heading: 'New heading', dialogTitle: 'Old heading', backdrop: 'none', closeOnEscape: false, closeOnBackdropClick: false });
    await el.show();
    expect(el.shadowRoot.textContent).toContain('New heading');
    expect(el.shadowRoot.textContent).not.toContain('Old heading');
    expect(el.shadowRoot.querySelector('.dialog-backdrop').classList.contains('effect-none')).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    el.shadowRoot.querySelector('[part="backdrop"]').click();
    await update();
    expect(el.open).toBe(true);
    el.closeOnEscape = true;
    await update();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await update();
    expect(el.open).toBe(false);
  });

  it('uses drawerSize over panelSize', async () => {
    const el = await mount('q-sidepanel', { variant: 'drawer', drawerSize: '480px', panelSize: '200px' });
    expect(el.shadowRoot.querySelector('[part="drawer"]').style.getPropertyValue('--q-panel-width')).toBe('480px');
  });

  it('uses defaultGroupsExpanded and collapseControlStyle in navigation', async () => {
    const el = await mount('q-sidepanel', {
      mode: 'tree', defaultGroupsExpanded: false, expanded: true,
      items: [{ label: 'Group', value: 'group', children: [{ label: 'Child', value: 'child' }] }],
      collapsible: true, collapseControl: 'edge', collapseControlStyle: 'edge-tab', collapseControlAppearance: 'icon-button',
    });
    expect(el.shadowRoot.querySelector('.nav-item[aria-expanded]').getAttribute('aria-expanded')).toBe('false');
    expect(el.shadowRoot.querySelector('.collapse-control--edge-tab')).not.toBeNull();
    el.shadowRoot.querySelector('.nav-item[aria-expanded]').click();
    await update();
    expect(el.shadowRoot.querySelector('.nav-item[aria-expanded]').getAttribute('aria-expanded')).toBe('true');
  });

  it('reloads icons when library and libraryVersion change', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h1"/></svg>' });
    vi.stubGlobal('fetch', fetch);
    const el = await mount('q-icon', { name: 'alias-test', library: 'https://example.com/new/{name}.svg', lib: 'https://example.com/old/{name}.svg' });
    expect(String(fetch.mock.calls[0][0])).toContain('/new/alias-test.svg');
    el.library = 'lucide';
    el.libraryVersion = '0.400.0';
    await update();
    expect(fetch.mock.calls.some(call => String(call[0]).includes('0.400.0'))).toBe(true);
  });
});
