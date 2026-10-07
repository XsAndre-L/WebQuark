import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
// @ts-ignore Verify the production consumer API and styles.
import { defineCustomElements } from '../../../../../dist/loader';
// @ts-ignore
import '../../../../../dist/webquark/webquark.css';
defineCustomElements();
afterEach(() => document.body.replaceChildren());
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
async function frames() {
  for (let index = 0; index < 3; index++) {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
}
async function panel(options: Partial<HTMLQSidepanelElement> = {}, width = '360px') {
  const parent = document.createElement('div');
  parent.style.cssText = 'display:flex;width:800px;height:320px;container-type:inline-size';
  const el = document.createElement('q-sidepanel');
  Object.assign(el, { variant: 'panel', collapsible: true, collapseMode: 'hidden', collapseControl: 'edge', ...options });
  el.style.setProperty('--q-sidepanel-panel-width', width);
  el.style.setProperty('--q-transition-normal', '300ms linear');
  el.innerHTML = '<div slot="header">Header</div><textarea>Persistent draft</textarea><p>Text that would wrap differently in a shrinking content container.</p><div slot="footer">Footer</div>';
  parent.append(el);
  document.body.append(parent);
  await el.componentOnReady();
  await frames();
  return {
    el,
    parent,
    surface: el.shadowRoot!.querySelector<HTMLElement>('.panel-surface')!,
    viewport: el.shadowRoot!.querySelector<HTMLElement>('.panel-content')!,
    control: el.shadowRoot!.querySelector<HTMLButtonElement>('.collapse-control')!,
  };
}
describe('persistent sidebar transition contract', () => {
  it('clips and fades stable content at intermediate frames, preserving draft and scroll', async () => {
    const { el, surface, viewport, control } = await panel();
    const textarea = el.querySelector('textarea')!;
    textarea.value = 'An edited draft';
    const expanded = surface.getBoundingClientRect().width;
    const body = el.shadowRoot!.querySelector<HTMLElement>('.panel-body')!;
    body.style.overflow = 'scroll';
    body.style.height = '40px';
    body.style.flex = '0 0 40px';
    body.scrollTop = 15;
    const scroll = body.scrollTop;
    el.collapsed = true;
    await delay(100);
    const width = viewport.getBoundingClientRect().width;
    const opacity = Number(getComputedStyle(surface).opacity);
    expect(width).toBeGreaterThan(0);
    expect(width).toBeLessThan(expanded);
    expect(surface.getBoundingClientRect().width).toBe(expanded);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
    expect(getComputedStyle(control).opacity).toBe('1');
    expect(viewport.inert).toBe(true);
    await delay(260);
    el.collapsed = false;
    await delay(360);
    expect(el.querySelector('textarea')).toBe(textarea);
    expect(textarea.value).toBe('An edited draft');
    expect(body.scrollTop).toBe(scroll);
    expect(viewport.inert).toBe(false);
  });
  it('reverses without unmounting or jumping to the final size', async () => {
    const { el, surface } = await panel();
    el.collapsed = true;
    await delay(100);
    const before = el.getBoundingClientRect().width;
    el.collapsed = false;
    await frames();
    const after = el.getBoundingClientRect().width;
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThan(360);
    expect(surface.getBoundingClientRect().width).toBe(359);
    await delay(360);
    expect(el.getBoundingClientRect().width).toBe(360);
  });
  it('resolves percentage widths when initially closed, resized and reconnected', async () => {
    const { el, parent, surface } = await panel({ collapsed: true }, '50%');
    expect(surface.getBoundingClientRect().width).toBe(399);
    parent.style.width = '640px';
    await frames();
    expect(surface.getBoundingClientRect().width).toBe(319);
    el.remove();
    parent.style.width = '600px';
    parent.append(el);
    await frames();
    expect(surface.getBoundingClientRect().width).toBe(299);
    el.collapsed = false;
    await delay(110);
    expect(surface.getBoundingClientRect().width).toBe(299);
    expect(el.getBoundingClientRect().width).toBeLessThan(300);
  });
  it('accounts for custom host and shell borders and padding', async () => {
    const { el, surface } = await panel();
    el.style.border = '3px solid red';
    el.style.padding = '0 5px';
    const shell = el.shadowRoot!.querySelector<HTMLElement>('.panel-shell')!;
    shell.style.border = '2px solid blue';
    shell.style.padding = '0 7px';
    el.collapsed = true;
    await frames();
    expect(surface.getBoundingClientRect().width).toBe(326);
    el.collapsed = false;
    await delay(350);
    expect(surface.getBoundingClientRect().width).toBe(326);
  });
  it.each(['edge', 'header', 'footer'] as const)('moves focus to the reachable %s control before making content inert', async (collapseControl) => {
    const { el, viewport, control } = await panel({ collapseControl });
    el.querySelector('textarea')!.focus();
    el.collapsed = true;
    await delay(350);
    expect(el.shadowRoot!.activeElement).toBe(control);
    expect(viewport.inert).toBe(true);
    expect(viewport.contains(control)).toBe(false);
    expect(control.getBoundingClientRect().width).toBe(32);
    control.click();
    await frames();
    expect(el.collapsed).toBe(false);
  });
  it('supports stable full-width content during consumer-owned vertical collapse', async () => {
    const { el, parent, surface } = await panel();
    parent.style.flexDirection = 'column';
    el.style.setProperty('--q-sidepanel-panel-width', '100cqw');
    el.style.setProperty('--q-sidepanel-hidden-width', '100cqw');
    el.style.setProperty('--q-sidepanel-panel-height', '300px');
    el.style.setProperty('--q-sidepanel-panel-content-height', '300px');
    el.style.setProperty('--q-sidepanel-hidden-height', '0px');
    await frames();
    el.collapsed = true;
    await delay(100);
    expect(el.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(el.getBoundingClientRect().height).toBeLessThan(300);
    expect(surface.getBoundingClientRect().height).toBe(300);
    expect(surface.getBoundingClientRect().width).toBe(799);
  });
  it('can settle immediately with zero motion while content becomes inert', async () => {
    const { el, surface, viewport } = await panel();
    el.style.setProperty('--q-transition-normal', '0ms linear');
    el.collapsed = true;
    await frames();
    expect(el.getBoundingClientRect().width).toBe(0);
    expect(getComputedStyle(surface).opacity).toBe('0');
    expect(viewport.inert).toBe(true);
  });
  it.each(['top', 'bottom'] as const)('fills the default content height once with a thick %s border', async (side) => {
    const { el, surface, viewport } = await panel({ side });
    el.style.setProperty('--q-sidepanel-border', '8px solid red');
    el.collapsed = true;
    await frames();
    el.collapsed = false;
    await delay(350);
    expect(surface.getBoundingClientRect().height).toBe(viewport.getBoundingClientRect().height);
    expect(surface.getBoundingClientRect().height).toBe(312);
  });
  it.each([
    { side: 'left', collapseControl: 'header' },
    { side: 'left', collapseControl: 'footer' },
    { side: 'right', collapseControl: 'header' },
    { side: 'right', collapseControl: 'footer' },
  ] as const)('keeps a $side-side $collapseControl control on-screen and pointer-operable while closed', async ({ side, collapseControl }) => {
    const { el, parent, control } = await panel({ side, collapseControl, collapsed: true });
    if (side === 'right') {
      // A right panel follows page content; leave room for its protruding control.
      const sibling = document.createElement('div');
      sibling.style.flex = '1';
      parent.style.width = `${Math.min(800, innerWidth - 40)}px`;
      parent.prepend(sibling);
      await frames();
    }
    const rect = control.getBoundingClientRect();
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(innerWidth);
    await userEvent.click(control);
    await frames();
    expect(el.collapsed).toBe(false);
  });
});
