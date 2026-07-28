import { afterEach, describe, expect, it } from 'vitest';

import '../navbar';
import navbarCss from '../navbar.css?inline';

async function nextFrame(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

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
