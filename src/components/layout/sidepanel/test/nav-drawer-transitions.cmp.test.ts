import { afterEach, describe, expect, it } from 'vitest';
// @ts-ignore Production consumer package.
import { defineCustomElements } from '../../../../../dist/loader';
// @ts-ignore
import '../../../../../dist/webquark/webquark.css';
defineCustomElements();
afterEach(() => document.body.replaceChildren());
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
async function frames() {
  for (let index = 0; index < 4; index++) {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
}
async function mount(options: Partial<HTMLQSidepanelElement>) {
  const el = document.createElement('q-sidepanel');
  Object.assign(el, options);
  el.style.setProperty('--q-transition-normal', '250ms linear');
  el.style.height = '320px';
  el.innerHTML = '<button slot="header">Header action</button><input value="draft"><button slot="footer">Footer action</button>';
  document.body.append(el);
  await el.componentOnReady();
  await frames();
  return el;
}
describe('navigation collapse', () => {
  it('fades stable hidden content, making all content inert while keeping its edge control usable', async () => {
    const el = await mount({ variant: 'nav', collapsible: true, collapseMode: 'hidden', collapseControl: 'edge', items: [{ value: 'reports', label: 'Reports and dashboards', icon: 'users' }] });
    const surface = el.shadowRoot!.querySelector<HTMLElement>('.nav-surface')!;
    const initial = surface.getBoundingClientRect().width;
    const item = el.shadowRoot!.querySelector<HTMLElement>('.nav-item')!;
    item.focus();
    el.collapsed = true;
    await delay(100);
    expect(surface.getBoundingClientRect().width).toBe(initial);
    expect(Number(getComputedStyle(surface).opacity)).toBeGreaterThan(0);
    expect(Number(getComputedStyle(surface).opacity)).toBeLessThan(1);
    expect(el.shadowRoot!.querySelector<HTMLElement>('.nav-body')!.inert).toBe(true);
    expect(el.shadowRoot!.querySelector<HTMLElement>('.nav-header > span')!.inert).toBe(true);
    expect(el.shadowRoot!.activeElement).toBe(el.shadowRoot!.querySelector('.collapse-control'));
    el.collapsed = false;
    await delay(350);
    expect(surface.getBoundingClientRect().width).toBe(initial);
    expect(el.shadowRoot!.querySelector('.nav-item')).toBe(item);
  });
  it('retains usable rail icons while labels fade', async () => {
    const el = await mount({ variant: 'nav', collapsible: true, collapseMode: 'rail', items: [{ value: 'reports', label: 'Reports', icon: 'users', badgeCount: 3 }] });
    const item = el.shadowRoot!.querySelector<HTMLElement>('.nav-item')!;
    const label = item.querySelector<HTMLElement>('.nav-item__label')!;
    const icon = item.querySelector<HTMLElement>('.nav-item__icon')!;
    el.collapsed = true;
    await delay(100);
    expect(Number(getComputedStyle(label).opacity)).toBeGreaterThan(0);
    expect(Number(getComputedStyle(label).opacity)).toBeLessThan(1);
    expect(getComputedStyle(icon).visibility).toBe('visible');
    const padding = Number.parseFloat(getComputedStyle(item).paddingLeft);
    expect(padding).toBeGreaterThan(0);
    expect(padding).toBeLessThan(16);
    await delay(220);
    expect(el.getBoundingClientRect().width).toBe(65);
    item.focus();
    expect(el.shadowRoot!.activeElement).toBe(item);
    expect(item.getAttribute('aria-label')).toContain('Reports');
    expect(getComputedStyle(label).opacity).toBe('0');
  });
});
describe('drawer transitions', () => {
  it.each(['left', 'right', 'top', 'bottom'] as const)('slides and fades the %s drawer with mounted stable content', async (side) => {
    const el = await mount({ variant: 'drawer', side, drawerSize: '300px' });
    const drawer = el.shadowRoot!.querySelector<HTMLElement>('.sidepanel-drawer')!;
    const body = el.shadowRoot!.querySelector<HTMLElement>('.drawer-body')!;
    const size = drawer.getBoundingClientRect().width;
    const input = el.querySelector('input')!;
    input.value = 'Retained draft';
    expect(getComputedStyle(drawer).transitionDuration).toBe('0.25s');
    el.open = true;
    await delay(130);
    expect(Number(getComputedStyle(body).opacity)).toBeGreaterThan(0);
    expect(Number(getComputedStyle(body).opacity)).toBeLessThan(1);
    expect(drawer.getBoundingClientRect().width).toBe(size);
    await delay(260);
    el.open = false;
    await delay(350);
    expect(el.querySelector('input')).toBe(input);
    expect(input.value).toBe('Retained draft');
    expect(el.shadowRoot!.querySelector('.sidepanel-wrapper')!.classList.contains('is-visible')).toBe(false);
  });
  it('ignores bubbled fades and other properties while preserving the opener through reversal', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const el = await mount({ variant: 'drawer' });
    opener.focus();
    el.open = true;
    await delay(350);
    const drawer = el.shadowRoot!.querySelector<HTMLElement>('.sidepanel-drawer')!;
    const body = el.shadowRoot!.querySelector<HTMLElement>('.drawer-body')!;
    el.open = false;
    await frames();
    body.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }));
    drawer.dispatchEvent(new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' }));
    await frames();
    expect(el.shadowRoot!.querySelector('.sidepanel-wrapper')!.classList.contains('is-visible')).toBe(true);
    el.open = true;
    await delay(350);
    el.open = false;
    await delay(350);
    expect(document.activeElement).toBe(opener);
  });
  it('settles zero-duration closing without the legacy fallback delay and accepts a duration override', async () => {
    const el = await mount({ variant: 'drawer' });
    el.style.setProperty('--q-panel-transition-duration', '0ms');
    el.open = true;
    await frames();
    el.open = false;
    await frames();
    expect(el.shadowRoot!.querySelector('.sidepanel-wrapper')!.classList.contains('is-visible')).toBe(false);
    el.style.setProperty('--q-panel-transition-duration', '600ms');
    expect(getComputedStyle(el.shadowRoot!.querySelector('.sidepanel-drawer')!).transitionDuration).toBe('0.6s');
  });
});
