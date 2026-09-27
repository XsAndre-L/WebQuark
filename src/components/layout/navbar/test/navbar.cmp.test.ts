import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import '../navbar';
// Use the production button: the source test transformer cannot compile its Stencil mixin.
import { defineCustomElement as defineButton } from '../../../../../dist/components/q-button';
import type { QNavbar } from '../navbar';
import navbarCss from '../navbar.css?inline';

defineButton();

async function nextFrame(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function settle() {
  for (let i = 0; i < 6; i++) await nextFrame();
}

async function aligned(width = 900, html = '<span slot="brand" style="display:block;width:180px">Brand</span><button slot="actions" style="width:70px">Account</button>') {
  const el = document.createElement('q-navbar') as HTMLQNavbarElement & Pick<QNavbar, 'navAlign' | 'navCenterWithin'>;
  el.navAlign = 'center';
  el.navCenterWithin = 'container';
  el.items = ['Home', 'Products', 'Contact'];
  el.style.width = `${width}px`;
  el.innerHTML = html;
  document.body.append(el);
  await nextFrame();
  const sheet = new CSSStyleSheet();
  await sheet.replace(navbarCss);
  el.shadowRoot!.adoptedStyleSheets = [...el.shadowRoot!.adoptedStyleSheets, sheet];
  await settle();
  return el;
}

function part(el: HTMLElement, selector: string) {
  return el.shadowRoot!.querySelector<HTMLElement>(selector)!;
}

function collapsed(el: HTMLElement) { return part(el, '.navbar').classList.contains('is-collapsed'); }
function center(el: Element) { const r = el.getBoundingClientRect(); return (r.left + r.right) / 2; }

describe('q-navbar alignment and collision geometry', () => {
  beforeEach(async () => { await page.viewport(1280, 800); });
  afterEach(() => { document.body.replaceChildren(); });

  it('centres the actual group with unequal, missing and changing sides', async () => {
    const el = await aligned();
    expect(collapsed(el)).toBe(false);
    expect(center(part(el, '.desktop-nav'))).toBeCloseTo(center(el), 0);
    el.querySelector('[slot="brand"]')!.remove();
    await settle();
    expect(center(part(el, '.desktop-nav'))).toBeCloseTo(center(el), 0);
    (el.querySelector('[slot="actions"]') as HTMLElement).style.width = '240px';
    await settle();
    expect(center(part(el, '.desktop-nav'))).toBeCloseTo(center(el), 0);
    el.navCenterWithin = 'available';
    await settle();
    const brand = part(el, '.brand-link').getBoundingClientRect();
    const actions = part(el, '.desktop-actions').getBoundingClientRect();
    const items = el.shadowRoot!.querySelectorAll('.nav-item-shell');
    expect((items[0].getBoundingClientRect().left + items[2].getBoundingClientRect().right) / 2).toBeCloseTo((brand.right + actions.left) / 2, 0);
  });

  it('applies optical displacement only on desktop and reverses it in RTL', async () => {
    const el = await aligned();
    el.style.setProperty('--q-navbar-nav-offset-inline', '13px');
    await settle();
    expect(center(part(el, '.desktop-nav')) - center(el)).toBeCloseTo(13, 0);
    el.dir = 'rtl';
    await settle();
    expect(center(part(el, '.desktop-nav')) - center(el)).toBeCloseTo(-13, 0);
    el.style.width = '350px';
    await settle();
    expect(collapsed(el)).toBe(true);
    part(el, '.menu-button').click();
    await settle();
    expect(getComputedStyle(part(el, '.desktop-nav')).insetInlineStart).toBe('auto');
  });

  it('uses stable intrinsic widths and an 8px recovery margin without oscillation', async () => {
    const el = await aligned(900, '<span slot="brand" style="display:block;width:100px">Brand</span>');
    const navWidth = part(el, '.desktop-nav').getBoundingClientRect().width;
    const threshold = 48 + 40 + 200 + navWidth;
    el.style.width = `${threshold - 1}px`;
    await settle();
    expect(collapsed(el)).toBe(true);
    el.style.width = `${threshold + 7}px`;
    await settle();
    expect(collapsed(el)).toBe(true);
    for (let i = 0; i < 12; i++) { await nextFrame(); expect(collapsed(el)).toBe(true); }
    el.style.width = `${threshold + 9}px`;
    await settle();
    expect(collapsed(el)).toBe(false);
  });

  it('retains custom navigation, actions and add-ons without duplicating nodes', async () => {
    const el = await aligned(350, '<span slot="brand">Brand</span><button slot="nav" style="width:220px">Custom</button><button slot="actions">Action</button><span slot="badge" style="display:block;width:260px">Badge</span>');
    el.items = [{ label: 'Home', value: 'home', addonSlot: 'badge' }];
    await settle();
    expect(collapsed(el)).toBe(true);
    part(el, '.menu-button').click();
    await settle();
    expect((el.querySelector('[slot="nav"]') as HTMLElement).checkVisibility()).toBe(true);
    expect((el.querySelector('[slot="actions"]') as HTMLElement).checkVisibility()).toBe(true);
    expect((el.querySelector('[slot="badge"]') as HTMLElement).checkVisibility()).toBe(true);
    expect(el.querySelectorAll('[slot="nav"]')).toHaveLength(1);
    el.insertAdjacentHTML('beforeend', '<button slot="mobile-nav">Mobile</button><button slot="mobile-actions">Mobile action</button>');
    await settle();
    expect((el.querySelector('[slot="nav"]') as HTMLElement).checkVisibility()).toBe(false);
    expect((el.querySelector('[slot="actions"]') as HTMLElement).checkVisibility()).toBe(false);
    expect((el.querySelector('[slot="mobile-nav"]') as HTMLElement).checkVisibility()).toBe(true);
  });

  it('protects focus and emits only real open-state changes', async () => {
    const el = await aligned();
    const events: boolean[] = [];
    el.addEventListener('qMenuToggle', e => events.push((e as CustomEvent).detail));
    const item = part(el, '.nav-item');
    item.focus();
    el.style.width = '300px';
    await settle();
    expect(el.shadowRoot!.activeElement).toBe(part(el, '.menu-button'));
    expect(events).toEqual([]);
    part(el, '.menu-button').click();
    await settle();
    item.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(el.shadowRoot!.activeElement).toBe(part(el, '.menu-button'));
    part(el, '.menu-button').click();
    await settle();
    el.style.width = '900px';
    await settle();
    expect(el.shadowRoot!.activeElement).toBe(item);
    expect(events).toEqual([true, false, true, false]);
  });

  it('wraps inline mode onto its own row and puts bottom menus above the brand', async () => {
    const el = await aligned(350);
    el.mobileMode = 'inline';
    await settle();
    expect(part(el, '.desktop-nav').getBoundingClientRect().top).toBeGreaterThanOrEqual(part(el, '.brand-link').getBoundingClientRect().bottom);
    expect(part(el, '.menu-button').checkVisibility()).toBe(false);
    el.mobileMode = 'menu';
    el.edge = 'bottom';
    await settle();
    part(el, '.menu-button').click();
    await settle();
    expect(part(el, '.desktop-nav').getBoundingClientRect().bottom).toBeLessThanOrEqual(part(el, '.brand-link').getBoundingClientRect().top);
  });

  it('preserves the 720px breakpoint and default/vertical layouts', async () => {
    const el = await aligned(900);
    await page.viewport(720, 800);
    await settle();
    expect(collapsed(el)).toBe(false);
    expect(part(el, '.menu-button').checkVisibility()).toBe(true);
    await page.viewport(721, 800);
    await settle();
    expect(part(el, '.menu-button').checkVisibility()).toBe(false);
    el.navAlign = 'start';
    el.style.width = '200px';
    await settle();
    expect(collapsed(el)).toBe(false);
    el.navAlign = 'center';
    el.edge = 'left';
    await settle();
    expect(collapsed(el)).toBe(false);
    expect(getComputedStyle(part(el, '.navbar-row')).flexDirection).toBe('column');
  });

  it('remeasures late images, changing item text and completed fonts', async () => {
    const el = await aligned(700, '<img slot="brand" alt="Brand"><button slot="actions">Action</button>');
    expect(collapsed(el)).toBe(false);
    const img = el.querySelector('img')!;
    img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="30"/>');
    await img.decode();
    await settle();
    expect(collapsed(el)).toBe(true);
    img.remove();
    await settle();
    expect(collapsed(el)).toBe(false);
    el.items = ['A very long navigation entry repeated to consume the row', 'Another very long navigation entry'];
    await settle();
    expect(collapsed(el)).toBe(true);
    el.items = ['Home'];
    const face = new FontFace('NavbarTest', 'local("Arial"), local("Liberation Sans"), local("DejaVu Sans")');
    el.style.fontFamily = 'NavbarTest, monospace';
    const fonts = document.fonts as FontFaceSet & { add(font: FontFace): void; delete(font: FontFace): void };
    fonts.add(face);
    await face.load();
    await document.fonts.ready;
    await settle();
    expect(collapsed(el)).toBe(false);
    fonts.delete(face);
  });

  it('keeps sticky positioning during scrolling', async () => {
    const el = await aligned();
    const scroller = document.createElement('div');
    scroller.style.cssText = 'height:180px;overflow:auto';
    el.sticky = true;
    document.body.append(scroller);
    scroller.append(el);
    const spacer = document.createElement('div');
    spacer.style.height = '1000px';
    scroller.append(spacer);
    await settle();
    const top = el.getBoundingClientRect().top;
    scroller.scrollTop = 160;
    await settle();
    expect(el.getBoundingClientRect().top).toBeCloseTo(top, 0);
    expect(collapsed(el)).toBe(false);
  });

  it('includes visible add-on overhang in the collision requirement', async () => {
    const el = await aligned(600, '<span slot="brand" style="display:block;width:100px">Brand</span><span slot="badge" style="display:block;width:400px">Badge</span>');
    el.items = [{ label: 'Home', value: 'home' }];
    await settle();
    expect(collapsed(el)).toBe(false);
    el.items = [{ label: 'Home', value: 'home', addonSlot: 'badge', addonPlacement: 'top-start' }];
    await settle();
    expect(collapsed(el)).toBe(true);
    (el.querySelector('[slot="badge"]') as HTMLElement).style.display = 'none';
    await settle();
    expect(collapsed(el)).toBe(false);
  });

  it('centres in the padded box and responds to a resizing parent', async () => {
    const el = await aligned();
    el.style.padding = '0';
    el.style.setProperty('--q-navbar-padding', '0 70px 0 10px');
    await settle();
    expect(center(part(el, '.desktop-nav'))).toBeCloseTo(center(el) - 30, 0);
    const parent = document.createElement('div');
    parent.style.width = '900px';
    document.body.append(parent);
    parent.append(el);
    el.style.width = '100%';
    await settle();
    parent.style.width = '350px';
    await settle();
    expect(collapsed(el)).toBe(true);
    parent.style.width = '900px';
    await settle();
    expect(collapsed(el)).toBe(false);
    const brand = part(el, '.brand-link').getBoundingClientRect();
    const nav = part(el, '.desktop-nav').getBoundingClientRect();
    const actions = part(el, '.desktop-actions').getBoundingClientRect();
    expect(brand.right).toBeLessThan(nav.left);
    expect(nav.right).toBeLessThan(actions.left);
  });

  it('restores custom-only focus from an explicit mobile slot', async () => {
    const el = await aligned(300, '<span slot="brand" style="display:block;width:100px">Brand</span><button slot="nav" style="width:200px">Desktop</button><button slot="mobile-nav">Mobile</button>');
    el.items = [];
    await settle();
    part(el, '.menu-button').click();
    await settle();
    (el.querySelector('[slot="mobile-nav"]') as HTMLElement).focus();
    el.style.width = '900px';
    await settle();
    expect(document.activeElement).toBe(el.querySelector('[slot="nav"]'));
  });

  it('keeps focus visible when switching a collapsed menu to inline mode', async () => {
    const el = await aligned(300);
    part(el, '.menu-button').focus();
    el.mobileMode = 'inline';
    await settle();
    expect(el.shadowRoot!.activeElement).toBe(part(el, '.nav-item'));
    el.mobileMode = 'menu';
    await settle();
    expect(el.shadowRoot!.activeElement).toBe(part(el, '.menu-button'));
  });

  it('recovers focus inside custom controls, skipping hidden, disabled and inert choices', async () => {
    const el = await aligned(300, `<span slot="brand" style="display:block;width:100px">Brand</span>
      <div slot="nav" style="width:250px">
        <button style="display:none">Hidden</button>
        <button style="visibility:hidden">Invisible</button>
        <q-button disabled>Disabled custom control</q-button>
        <div inert><button>Inert control</button></div>
        <q-button id="enabled-navigation">Desktop control</q-button>
      </div>
      <button slot="mobile-nav">Mobile control</button>`);
    el.items = [];
    await settle();
    expect(collapsed(el)).toBe(true);
    part(el, '.menu-button').click();
    await settle();
    (el.querySelector('[slot="mobile-nav"]') as HTMLElement).focus();
    el.style.width = '900px';
    await settle();
    const control = el.querySelector<HTMLElement>('#enabled-navigation')!;
    expect(document.activeElement).toBe(control);
    expect(control.shadowRoot!.activeElement).toBe(control.shadowRoot!.querySelector('button'));
  });

  it('recovers mobile-slot focus and preserves custom control focus across mode changes', async () => {
    const el = await aligned(300, '<span slot="brand" style="width:100px">Brand</span><q-button slot="nav" style="width:250px">Desktop</q-button><button slot="mobile-nav">Mobile</button>');
    el.items = [];
    await settle();
    part(el, '.menu-button').click();
    await settle();
    (el.querySelector('[slot="mobile-nav"]') as HTMLElement).focus();
    el.mobileMode = 'inline';
    await settle();
    const control = el.querySelector('q-button')!;
    const button = control.shadowRoot!.querySelector('button')!;
    expect(control.shadowRoot!.activeElement).toBe(button);
    el.mobileMode = 'menu';
    await settle();
    expect(el.shadowRoot!.activeElement).toBe(part(el, '.menu-button'));
    el.mobileMode = 'inline';
    await settle();
    expect(control.shadowRoot!.activeElement).toBe(button);
  });

  it('preserves brand focus when changing from inline to menu', async () => {
    const el = await aligned(300);
    el.mobileMode = 'inline';
    await settle();
    const brand = el.querySelector<HTMLElement>('[slot="brand"]')!;
    brand.tabIndex = 0;
    brand.focus();
    el.mobileMode = 'menu';
    await settle();
    expect(document.activeElement).toBe(brand);
  });
});

describe('q-navbar item sizing in Chromium', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('keeps intrinsic defaults and supports full-width grid items', async () => {
    const element = document.createElement('q-navbar');
    element.setAttribute('edge', 'bottom');
    element.setAttribute('mobile-mode', 'inline');
    element.items = [
      { label: 'Home', value: 'home', icon: 'house', iconOnly: true },
      { label: 'Messages', value: 'messages', icon: 'message-square', iconOnly: true },
      { label: 'Account', value: 'account', href: '/account', icon: 'user', iconOnly: true },
    ];
    element.style.width = '600px';
    element.style.setProperty('--q-navbar-padding', '0');
    element.style.setProperty('--q-navbar-gap', '0');
    element.style.setProperty('--q-navbar-nav-gap', '0');
    document.body.append(element);

    await customElements.whenDefined('q-navbar');
    await nextFrame();

    const stylesheet = new CSSStyleSheet();
    await stylesheet.replace(navbarCss);
    element.shadowRoot!.adoptedStyleSheets = [
      ...element.shadowRoot!.adoptedStyleSheets,
      stylesheet,
    ];

    const brand = element.shadowRoot!.querySelector<HTMLElement>('.brand-link')!;
    const nav = element.shadowRoot!.querySelector<HTMLElement>('.desktop-nav')!;
    const actions = element.shadowRoot!.querySelector<HTMLElement>('.desktop-actions')!;
    brand.style.display = 'none';
    actions.style.display = 'none';
    nav.style.display = 'grid';
    nav.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
    await nextFrame();

    const shells = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLElement>('.nav-item-shell'),
    );
    const items = Array.from(
      element.shadowRoot!.querySelectorAll<HTMLElement>('.nav-item'),
    );
    const columnWidth = nav.getBoundingClientRect().width / 3;

    expect(getComputedStyle(shells[0]).justifySelf).toBe('center');
    expect(shells[0].getBoundingClientRect().width).toBeLessThan(columnWidth);
    expect(items[0].getBoundingClientRect().width).toBeLessThan(columnWidth);

    element.style.setProperty('--q-navbar-item-width', '100%');
    await nextFrame();

    for (const target of [...shells, ...items]) {
      expect(Math.abs(target.getBoundingClientRect().width - columnWidth)).toBeLessThanOrEqual(1);
    }
  });
});
