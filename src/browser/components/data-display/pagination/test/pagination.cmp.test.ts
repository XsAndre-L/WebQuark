import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import '../../data-table/data-table';
import dataTableCss from '../../data-table/data-table.css?inline';
import '../pagination';
import paginationCss from '../pagination.css?inline';

async function nextFrame(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function adoptStyles(
  shadowRoot: ShadowRoot,
  css: string,
): Promise<void> {
  const stylesheet = new CSSStyleSheet();
  await stylesheet.replace(css);
  shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, stylesheet];
}

describe('q-pagination layout in Chromium', () => {
  afterEach(async () => {
    document.body.replaceChildren();
    await page.viewport(414, 896);
  });

  it('fills a q-data-table footer and keeps controls on the right', async () => {
    await page.viewport(800, 600);
    const table = document.createElement('q-data-table');
    table.style.width = '640px';
    table.columns = [{ key: 'name', header: 'Name' }];
    table.items = [{ name: 'Example' }];
    table.keyField = 'name';

    const pagination = document.createElement('q-pagination');
    pagination.slot = 'footer';
    pagination.page = 2;
    pagination.pageSize = 10;
    pagination.totalItems = 30;
    table.append(pagination);
    document.body.append(table);

    await Promise.all([
      customElements.whenDefined('q-data-table'),
      customElements.whenDefined('q-pagination'),
    ]);
    await nextFrame();

    await adoptStyles(table.shadowRoot!, dataTableCss);
    await adoptStyles(pagination.shadowRoot!, paginationCss);
    await nextFrame();

    const navigation = pagination.shadowRoot!.querySelector('nav')!;
    const summary = pagination.shadowRoot!.querySelector('.summary')!;
    const controls = pagination.shadowRoot!.querySelector('.controls')!;
    const paginationBounds = pagination.getBoundingClientRect();
    const navigationBounds = navigation.getBoundingClientRect();
    const paginationStyles = getComputedStyle(pagination);
    const horizontalPadding =
      Number.parseFloat(paginationStyles.paddingLeft) +
      Number.parseFloat(paginationStyles.paddingRight);

    expect(
      Math.abs(
        navigationBounds.width -
          (paginationBounds.width - horizontalPadding),
      ),
    ).toBeLessThan(1);
    expect(controls.getBoundingClientRect().left).toBeGreaterThan(
      summary.getBoundingClientRect().right,
    );
    expect(
      paginationBounds.right -
        controls.getBoundingClientRect().right -
        Number.parseFloat(paginationStyles.paddingRight),
    ).toBeLessThan(1);
  });
});
