import { h } from '@stencil/core';
import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-data-table', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-data-table');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  function getFirstColumnText(el: any): string[] {
    return Array.from(el.shadowRoot.querySelectorAll('tbody tr')).map((row: any) =>
      row.querySelector('td:not(.cell-selection):not(.cell-actions)')?.textContent?.trim()
    );
  }

  async function clickFirstSortButton(el: any) {
    const button = el.shadowRoot.querySelector('.column-sort-button') as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  const columns = [{ key: 'name', header: 'Name' }];
  const items = [
    { id: 1, name: 'Alpha' },
    { id: 2, name: 'Beta' },
  ];

  it('marks selected rows from selectedKeys', async () => {
    const el = await createComponent({ columns, items, selectable: true, selectedKeys: [2] });
    const rows = el.shadowRoot.querySelectorAll('tbody tr');

    expect(rows[0].getAttribute('aria-selected')).toBe('false');
    expect(rows[1].getAttribute('aria-selected')).toBe('true');
    el.remove();
  });

  it('emits selected keys and items when a row selection changes', async () => {
    const el = await createComponent({ columns, items, selectable: true, selectedKeys: [1] });
    const handler = vi.fn();
    el.addEventListener('qSelectionChange', handler);

    const secondRowCheckbox = el.shadowRoot.querySelectorAll('tbody input[type="checkbox"]')[1] as HTMLInputElement;
    secondRowCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.selectedKeys).toEqual([1, 2]);
    expect(handler.mock.calls[0][0].detail.selectedItems.map((item: any) => item.name)).toEqual(['Alpha', 'Beta']);
    el.remove();
  });

  it('renders primitive rows without throwing', async () => {
    const el = await createComponent({ columns: [{ key: 'length', header: 'Length' }], items: ['Alpha', 'Beta'], selectable: true });
    const rows = el.shadowRoot.querySelectorAll('tbody tr');

    expect(rows).toHaveLength(2);
    expect(rows[0].getAttribute('aria-selected')).toBe('false');
    el.remove();
  });

  it('does not render the row actions column when rowActions is empty', async () => {
    const el = await createComponent({ columns, items });

    expect(el.shadowRoot.querySelector('.col-actions')).toBeNull();
    expect(el.shadowRoot.querySelector('.cell-actions')).toBeNull();
    expect(el.shadowRoot.querySelectorAll('thead th')).toHaveLength(1);
    expect(el.shadowRoot.querySelectorAll('tbody td')).toHaveLength(2);
    el.remove();
  });

  it('does not render sort controls unless sorting is enabled', async () => {
    const el = await createComponent({ columns, items });

    expect(el.shadowRoot.querySelector('.column-sort-button')).toBeNull();
    expect(el.shadowRoot.querySelector('thead th')?.getAttribute('aria-sort')).toBeNull();
    expect(getFirstColumnText(el)).toEqual(['Alpha', 'Beta']);
    el.remove();
  });

  it('sorts rows in table mode and cycles ascending, descending, and cleared states', async () => {
    const unorderedItems = [
      { id: 1, name: 'Beta' },
      { id: 2, name: 'Alpha' },
      { id: 3, name: 'Gamma' },
    ];
    const el = await createComponent({ columns, items: unorderedItems, sortable: true });
    const handler = vi.fn();
    el.addEventListener('qSortChange', handler);

    await clickFirstSortButton(el);
    expect(getFirstColumnText(el)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect((el as any).sortColumn).toBe('name');
    expect((el as any).sortDirection).toBe('asc');
    expect(el.shadowRoot.querySelector('thead th')?.getAttribute('aria-sort')).toBe('ascending');
    expect(handler.mock.calls[0][0].detail).toMatchObject({ columnKey: 'name', direction: 'asc' });

    await clickFirstSortButton(el);
    expect(getFirstColumnText(el)).toEqual(['Gamma', 'Beta', 'Alpha']);
    expect((el as any).sortDirection).toBe('desc');
    expect(el.shadowRoot.querySelector('thead th')?.getAttribute('aria-sort')).toBe('descending');
    expect(handler.mock.calls[1][0].detail).toMatchObject({ columnKey: 'name', direction: 'desc' });

    await clickFirstSortButton(el);
    expect(getFirstColumnText(el)).toEqual(['Beta', 'Alpha', 'Gamma']);
    expect((el as any).sortColumn).toBeUndefined();
    expect((el as any).sortDirection).toBeUndefined();
    expect(el.shadowRoot.querySelector('thead th')?.getAttribute('aria-sort')).toBe('none');
    expect(handler.mock.calls[2][0].detail.columnKey).toBeUndefined();
    expect(handler.mock.calls[2][0].detail.direction).toBeUndefined();
    el.remove();
  });

  it('emits sort changes without reordering rows in external sort mode', async () => {
    const unorderedItems = [
      { id: 1, name: 'Beta' },
      { id: 2, name: 'Alpha' },
      { id: 3, name: 'Gamma' },
    ];
    const el = await createComponent({ columns, items: unorderedItems, sortable: true, sortMode: 'external' });
    const handler = vi.fn();
    el.addEventListener('qSortChange', handler);

    await clickFirstSortButton(el);

    expect(getFirstColumnText(el)).toEqual(['Beta', 'Alpha', 'Gamma']);
    expect((el as any).sortColumn).toBe('name');
    expect((el as any).sortDirection).toBe('asc');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toMatchObject({ columnKey: 'name', direction: 'asc' });
    el.remove();
  });

  it('supports per-column sortable opt-in and opt-out', async () => {
    const optInEl = await createComponent({
      columns: [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'id', header: 'ID' },
      ],
      items,
    });
    expect(optInEl.shadowRoot.querySelectorAll('.column-sort-button')).toHaveLength(1);
    optInEl.remove();

    const optOutEl = await createComponent({
      columns: [
        { key: 'name', header: 'Name', sortable: false },
        { key: 'id', header: 'ID' },
      ],
      items,
      sortable: true,
    });
    expect(optOutEl.shadowRoot.querySelectorAll('.column-sort-button')).toHaveLength(1);
    expect(optOutEl.shadowRoot.querySelector('.column-sort-button')?.textContent?.trim()).toContain('ID');
    optOutEl.remove();
  });

  it('selects and deselects all rows from the header checkbox', async () => {
    const el = await createComponent({ columns, items, selectable: true });
    const handler = vi.fn();
    el.addEventListener('qSelectionChange', handler);

    const headerCheckbox = el.shadowRoot.querySelector('thead input[type="checkbox"]') as HTMLInputElement;
    headerCheckbox.checked = true;
    headerCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.selectedKeys).toEqual([1, 2]);
    expect(handler.mock.calls[0][0].detail.selectedItems.map((item: any) => item.name)).toEqual(['Alpha', 'Beta']);

    headerCheckbox.checked = false;
    headerCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[1][0].detail.selectedKeys).toEqual([]);
    expect(handler.mock.calls[1][0].detail.selectedItems).toEqual([]);
    el.remove();
  });

  it('renders row action buttons and emits qRowAction without emitting qRowClick', async () => {
    const rowActions = [
      { key: 'edit', icon: 'pencil', tooltip: 'Edit user' },
      { key: 'delete', icon: 'trash-2', tooltip: 'Delete user' },
    ];
    const el = await createComponent({ columns, items, rowActions });
    const rowActionHandler = vi.fn();
    const rowClickHandler = vi.fn();
    el.addEventListener('qRowAction', rowActionHandler);
    el.addEventListener('qRowClick', rowClickHandler);

    expect(el.shadowRoot.querySelector('.col-actions')?.textContent?.trim()).toBe('');
    expect(el.shadowRoot.querySelector('.col-actions')?.getAttribute('aria-label')).toBe('Row actions');
    expect(el.shadowRoot.querySelectorAll('.cell-actions')).toHaveLength(2);

    const firstRowActionButtons = el.shadowRoot.querySelectorAll('.cell-actions')[0].querySelectorAll('q-button');
    expect(firstRowActionButtons).toHaveLength(2);
    expect((firstRowActionButtons[0] as any).variant).toBe('text');
    expect((firstRowActionButtons[0] as any).ariaLabel).toBe('Edit user');
    expect((firstRowActionButtons[0].querySelector('q-icon') as any)?.name).toBe('pencil');
    expect((firstRowActionButtons[0].querySelector('q-tooltip') as any)?.content).toBe('Edit user');

    firstRowActionButtons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(rowActionHandler).toHaveBeenCalledTimes(1);
    expect(rowActionHandler.mock.calls[0][0].detail.action).toEqual(rowActions[1]);
    expect(rowActionHandler.mock.calls[0][0].detail.item.name).toBe('Alpha');
    expect(rowActionHandler.mock.calls[0][0].detail.index).toBe(0);
    expect(rowActionHandler.mock.calls[0][0].detail.originalEvent).toBeInstanceOf(MouseEvent);
    expect(rowClickHandler).not.toHaveBeenCalled();
    el.remove();
  });

  it('supports disabling row actions per row', async () => {
    const rowActions = [
      { key: 'edit', icon: 'pencil', tooltip: 'Edit user', disabled: (item: any) => item.id === 1 },
    ];
    const el = await createComponent({ columns, items, rowActions });
    const rowActionHandler = vi.fn();
    el.addEventListener('qRowAction', rowActionHandler);

    const actionButtons = el.shadowRoot.querySelectorAll('.cell-actions q-button');
    expect((actionButtons[0] as any).disabled).toBe(true);
    expect((actionButtons[1] as any).disabled).toBe(false);

    actionButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(rowActionHandler).not.toHaveBeenCalled();

    actionButtons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(rowActionHandler).toHaveBeenCalledTimes(1);
    expect(rowActionHandler.mock.calls[0][0].detail.item.name).toBe('Beta');
    el.remove();
  });

  it('disables row activation while keeping row actions available when rowClickable is false', async () => {
    const rowActions = [{ key: 'edit', icon: 'pencil', tooltip: 'Edit user' }];
    const el = await createComponent({ columns, items, rowActions, rowClickable: false });
    const rowActionHandler = vi.fn();
    const rowClickHandler = vi.fn();
    el.addEventListener('qRowAction', rowActionHandler);
    el.addEventListener('qRowClick', rowClickHandler);

    const firstRow = el.shadowRoot.querySelector('tbody tr') as HTMLTableRowElement;
    expect(firstRow.classList.contains('row-el')).toBe(true);
    expect(firstRow.classList.contains('is-clickable')).toBe(false);
    expect(firstRow.getAttribute('tabindex')).toBeNull();

    firstRow.querySelector('td:not(.cell-actions)')?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    firstRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(rowClickHandler).not.toHaveBeenCalled();

    firstRow.querySelector('.cell-actions q-button')?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(rowActionHandler).toHaveBeenCalledTimes(1);
    expect(rowActionHandler.mock.calls[0][0].detail.action).toEqual(rowActions[0]);
    expect(rowClickHandler).not.toHaveBeenCalled();
    el.remove();
  });

  it('emits row clicks from cells but ignores nested interactive targets', async () => {
    const el = await createComponent({
      columns: [{ key: 'name', header: 'Name', render: (item: any) => h(item.name === 'Alpha' ? 'button' : 'span', {}, item.name) }],
      items,
    });
    const handler = vi.fn();
    el.addEventListener('qRowClick', handler);

    const firstRow = el.shadowRoot.querySelector('tbody tr') as HTMLTableRowElement;
    const secondRowCell = el.shadowRoot.querySelectorAll('tbody td')[1] as HTMLTableCellElement;
    expect(firstRow.classList.contains('is-clickable')).toBe(true);
    expect(firstRow.getAttribute('tabindex')).toBe('0');
    firstRow.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    secondRowCell.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.item.name).toBe('Beta');
    el.remove();
  });

  it('emits search input changes', async () => {
    const el = await createComponent({ columns, items, showToolbar: true, showSearch: true });
    const handler = vi.fn();
    el.addEventListener('qSearch', handler);

    const input = el.shadowRoot.querySelector('q-input') as HTMLElement;
    input.dispatchEvent(new CustomEvent('qInput', { detail: 'alp', bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect((el as any).searchValue).toBe('alp');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toBe('alp');
    el.remove();
  });

  it('renders loading state without data rows', async () => {
    const el = await createComponent({ columns, items, loading: true });
    const rows = el.shadowRoot.querySelectorAll('tbody tr');

    expect(rows).toHaveLength(1);
    expect(el.shadowRoot.querySelector('.table-loading-state q-circular-progress')).toBeTruthy();
    expect(el.shadowRoot.textContent).not.toContain('Alpha');
    el.remove();
  });

  it('falls back to nested values when a custom renderer throws', async () => {
    const el = await createComponent({
      columns: [{ key: 'profile.name', header: 'Name', render: () => { throw new Error('bad render'); } }],
      items: [{ id: 1, profile: { name: 'Nested Alpha' } }],
    });
    const cell = el.shadowRoot.querySelector('tbody td') as HTMLTableCellElement;

    expect(cell.textContent?.trim()).toBe('Nested Alpha');
    el.remove();
  });
});
