import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { getDataTableRowGutterSlotName } from '../data-table-cell';
// @ts-ignore Generated consumer API is verified after the package build.
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';

defineCustomElements();
afterEach(() => document.body.replaceChildren());

async function settle() {
  for (let index = 0; index < 6; index++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function mount(custom = false) {
  const table = document.createElement('q-data-table');
  table.style.width = '300px';
  table.columns = [{ key: 'name', header: 'Name', sticky: 'start' }, { key: 'description', header: 'Description' }];
  table.items = [{ id: 'a', name: 'Alpha', description: 'wide'.repeat(100) }, { id: 'b', name: 'Beta', description: 'wide'.repeat(100) }];
  table.selectable = true;
  if (custom) {
    table.rowGutter = 'custom';
    const button = document.createElement('button');
    button.slot = getDataTableRowGutterSlotName('a');
    button.textContent = 'Oversized custom content';
    button.style.width = '300px';
    table.append(button);
  }
  document.body.append(table);
  await table.componentOnReady();
  await settle();
  return table;
}

describe('data-table row gutter in Chromium', () => {
  it('reserves the default width in ordinary auto layout and exposes number cells', async () => {
    const table = await mount();
    table.columns = [{ key: 'name', header: 'Name' }];
    table.selectable = false;
    table.rowGutter = 'numbers';
    table.rowNumberOffset = 20;
    await settle();
    const cells = Array.from(table.shadowRoot!.querySelectorAll<HTMLElement>('.cell-row-gutter'));
    expect(cells.map(cell => cell.textContent)).toEqual(['21', '22']);
    expect(cells[0].getBoundingClientRect().width).toBeCloseTo(36, 0);
    expect(table.shadowRoot!.querySelector('.col-row-gutter')!.getAttribute('aria-label')).toBe('Row number');
    expect(cells[0].hasAttribute('aria-hidden')).toBe(false);
  });

  it('keeps oversized custom content within the configured column width and scrolls beside sticky data', async () => {
    const table = await mount(true);
    const root = table.shadowRoot!;
    const gutter = root.querySelector<HTMLElement>('.cell-row-gutter')!;
    const header = root.querySelector<HTMLElement>('.col-row-gutter')!;
    expect(gutter.getBoundingClientRect().width).toBeCloseTo(36, 0);
    expect(header.getBoundingClientRect().width).toBeCloseTo(36, 0);
    expect(getComputedStyle(gutter.querySelector('.row-gutter-content')!).overflow).toBe('hidden');
    table.style.setProperty('--q-table-row-gutter-width', '52px');
    await settle();
    expect(gutter.getBoundingClientRect().width).toBeCloseTo(52, 0);
    const scroll = root.querySelector<HTMLElement>('.table-scroll-area')!;
    const before = gutter.getBoundingClientRect().left;
    scroll.scrollLeft = 100;
    await settle();
    expect(gutter.getBoundingClientRect().left).toBeLessThan(before - 90);
    const sticky = root.querySelector<HTMLElement>('td.is-sticky-start')!;
    expect(getComputedStyle(sticky).left).toBe('0px');
    expect(sticky.getBoundingClientRect().left).toBeCloseTo(scroll.getBoundingClientRect().left, 0);
  });

  it('activates blank gutter and row keyboard areas but isolates selection and slotted controls', async () => {
    const table = await mount();
    const click = vi.fn();
    const selection = vi.fn();
    table.addEventListener('qRowClick', click);
    table.addEventListener('qSelectionChange', selection);
    const row = table.shadowRoot!.querySelector<HTMLElement>('.row-el')!;
    row.style.transition = 'none';
    const unselectedBackground = getComputedStyle(row).backgroundColor;
    row.querySelector<HTMLElement>('.cell-row-gutter')!.click();
    expect(click).toHaveBeenCalledTimes(1);
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await settle();
    expect(click).toHaveBeenCalledTimes(2);
    expect(selection).toHaveBeenCalledTimes(1);
    expect(row.classList.contains('is-selected')).toBe(true);
    expect(getComputedStyle(row).backgroundColor).not.toBe(unselectedBackground);
    const selectedBackground = getComputedStyle(row).backgroundColor;
    await userEvent.hover(row.querySelector<HTMLElement>('.cell-row-gutter')!);
    await settle();
    expect(getComputedStyle(row).backgroundColor).not.toBe(selectedBackground);
    const checkbox = row.querySelector<HTMLInputElement>('input')!;
    checkbox.click();
    await settle();
    expect(click).toHaveBeenCalledTimes(2);
    expect(selection).toHaveBeenCalledTimes(2);
    const gutter = row.querySelector<HTMLElement>('.cell-row-gutter')!;
    expect(getComputedStyle(gutter).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    table.rowGutter = 'custom';
    const button = document.createElement('button');
    button.slot = getDataTableRowGutterSlotName('a');
    button.textContent = 'Open';
    table.append(button);
    await settle();
    button.click();
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(click).toHaveBeenCalledTimes(2);
  });
});
