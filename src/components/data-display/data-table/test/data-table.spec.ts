import { h } from '@stencil/core';
import { expect, describe, it, vi } from 'vitest';
import { getDataTableCellSlotName } from '../data-table-cell';
import { isInteractiveDataTableTarget } from '../internals/row-events';
import {
  getDataTableModel,
  type GetDataTableModelOptions,
} from '../internals/table-model';
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
    return Array.from(el.shadowRoot.querySelectorAll('tbody tr')).map((row: any) => row.querySelector('td:not(.cell-selection):not(.cell-actions)')?.textContent?.trim());
  }

  async function clickFirstSortButton(el: any) {
    const button = el.shadowRoot.querySelector('.column-sort-button') as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  async function updateComponent(el: any, props: Record<string, any>) {
    Object.assign(el, props);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const columns = [{ key: 'name', header: 'Name' }];
  const items = [
    { id: 1, name: 'Alpha' },
    { id: 2, name: 'Beta' },
  ];

  function createIdentityModel(overrides: Partial<GetDataTableModelOptions> = {}) {
    return getDataTableModel({
      columns,
      items,
      rowActions: [],
      rowClickable: true,
      selectedKeys: [],
      selectable: false,
      keyField: 'id',
      sortable: false,
      sortMode: 'table',
      ...overrides,
    });
  }

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

  it('projects rich cell content through stable row and column slots', async () => {
    const el = document.createElement('q-data-table') as any;
    const profile = document.createElement('img');
    profile.alt = 'Alpha profile';
    profile.setAttribute('slot', getDataTableCellSlotName('name', 1));
    el.appendChild(profile);
    Object.assign(el, { columns, items });
    document.body.appendChild(el);
    await el.componentOnReady();

    const firstCellSlot = el.shadowRoot.querySelector('tbody td slot') as HTMLSlotElement;

    expect(firstCellSlot.name).toBe(getDataTableCellSlotName('name', 1));
    expect(el.querySelector(`[slot="${firstCellSlot.name}"]`)).toBe(profile);
    expect(firstCellSlot.textContent?.trim()).toBe('Alpha');
    expect(el.shadowRoot.querySelector('tbody td')?.getAttribute('part')).toBe('cell');
    el.remove();
  });

  it('pins sticky columns and exposes per-row cell classes as shadow parts', async () => {
    const el = await createComponent({
      columns: [
        {
          key: 'name',
          header: 'Name',
          sticky: 'start',
          cellClassName: (item: any) =>
            item.id === 1 ? 'stock-cell is-low' : 'stock-cell',
        },
      ],
      items,
    });
    const header = el.shadowRoot.querySelector('thead th');
    const cells = el.shadowRoot.querySelectorAll('tbody td');

    expect(header.classList.contains('is-sticky-start')).toBe(true);
    expect(header.getAttribute('part')).toBe(
      'column-header is-sticky-start',
    );
    expect(cells[0].classList.contains('is-sticky-start')).toBe(true);
    expect(cells[0].classList.contains('is-low')).toBe(true);
    expect(cells[0].getAttribute('part')).toBe(
      'cell is-sticky-start stock-cell is-low',
    );
    expect(cells[1].getAttribute('part')).toBe(
      'cell is-sticky-start stock-cell',
    );
    el.remove();
  });

  it('keeps string and numeric rich-cell identities distinct', () => {
    expect(getDataTableCellSlotName(1, 'row')).not.toBe(
      getDataTableCellSlotName('number:1', 'row'),
    );
    expect(getDataTableCellSlotName('column', 1)).not.toBe(
      getDataTableCellSlotName('column', 'number:1'),
    );
  });

  it('keeps rich cell content attached to its stable row key while sorting', async () => {
    const unorderedItems = [
      { id: 1, name: 'Beta' },
      { id: 2, name: 'Alpha' },
    ];
    const el = document.createElement('q-data-table') as any;
    const betaProfile = document.createElement('span');
    betaProfile.textContent = 'Beta profile';
    betaProfile.setAttribute('slot', getDataTableCellSlotName('name', 1));
    const alphaProfile = document.createElement('span');
    alphaProfile.textContent = 'Alpha profile';
    alphaProfile.setAttribute('slot', getDataTableCellSlotName('name', 2));
    el.append(betaProfile, alphaProfile);
    Object.assign(el, { columns, items: unorderedItems, sortable: true });
    document.body.appendChild(el);
    await el.componentOnReady();

    await clickFirstSortButton(el);

    const slots = Array.from(el.shadowRoot.querySelectorAll('tbody td slot')) as HTMLSlotElement[];
    expect(slots.map(slot => el.querySelector(`[slot="${slot.name}"]`)?.textContent)).toEqual(['Alpha profile', 'Beta profile']);
    el.remove();
  });

  it('reuses row, cell, slot, and header DOM for unchanged identities', async () => {
    const identityColumns = [
      { key: 'name', header: 'Name' },
      { key: 'id', header: 'ID' },
    ];
    const el = await createComponent({ columns: identityColumns, items });
    const firstRow = el.shadowRoot.querySelectorAll('.row-el')[0];
    const firstCell = firstRow.querySelectorAll('td')[0];
    const firstSlot = firstCell.querySelector('slot');
    const nameHeader = el.shadowRoot.querySelectorAll('thead th')[0];

    await updateComponent(el, {
      columns: identityColumns.map(column => ({ ...column })),
      items: items.map(item => ({ ...item })),
    });

    expect(el.shadowRoot.querySelectorAll('.row-el')[0]).toBe(firstRow);
    expect(el.shadowRoot.querySelectorAll('.row-el')[0].querySelectorAll('td')[0]).toBe(firstCell);
    expect(el.shadowRoot.querySelectorAll('.row-el')[0].querySelector('slot')).toBe(firstSlot);
    expect(el.shadowRoot.querySelectorAll('thead th')[0]).toBe(nameHeader);
    el.remove();
  });

  it('reuses rows through reorder while creating additions and removing missing rows', async () => {
    const el = await createComponent({ columns, items });
    const initialRows = Array.from(el.shadowRoot.querySelectorAll('.row-el')) as HTMLTableRowElement[];
    const alphaRow = initialRows[0];
    const betaRow = initialRows[1];

    await updateComponent(el, { items: [items[1], items[0]] });

    let renderedRows = Array.from(el.shadowRoot.querySelectorAll('.row-el')) as HTMLTableRowElement[];
    expect(renderedRows[0]).toBe(betaRow);
    expect(renderedRows[1]).toBe(alphaRow);

    await updateComponent(el, {
      items: [
        { id: 2, name: 'Beta updated' },
        { id: 3, name: 'Gamma' },
      ],
    });

    renderedRows = Array.from(el.shadowRoot.querySelectorAll('.row-el')) as HTMLTableRowElement[];
    expect(renderedRows[0]).toBe(betaRow);
    expect(renderedRows[0].textContent).toContain('Beta updated');
    expect(renderedRows[1]).not.toBe(alphaRow);
    expect(alphaRow.isConnected).toBe(false);
    el.remove();
  });

  it('keeps duplicate row identities distinct and reports the fallback', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const duplicateItems = [
      { id: 1, name: 'First' },
      { id: 1, name: 'Second' },
    ];
    const model = createIdentityModel({ items: duplicateItems });

    expect(model.rows[0].renderKey).not.toBe(model.rows[1].renderKey);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('Duplicate identity'));

    const el = await createComponent({ columns, items: duplicateItems });
    const initialRows = Array.from(el.shadowRoot.querySelectorAll('.row-el'));

    expect(initialRows).toHaveLength(2);
    expect(initialRows[0]).not.toBe(initialRows[1]);

    await updateComponent(el, {
      items: duplicateItems.map(item => ({ ...item })),
    });

    const refreshedRows = Array.from(el.shadowRoot.querySelectorAll('.row-el'));
    expect(refreshedRows[0]).toBe(initialRows[0]);
    expect(refreshedRows[1]).toBe(initialRows[1]);
    warning.mockRestore();
    el.remove();
  });

  it('keeps column identities stable while rendering reordered columns', async () => {
    const identityColumns = [
      { key: 'name', header: 'Name' },
      { key: 'id', header: 'ID' },
    ];
    const initialModel = createIdentityModel({ columns: identityColumns });
    const reorderedModel = createIdentityModel({
      columns: [identityColumns[1], identityColumns[0]],
    });
    const initialIdentityByColumn = new Map(
      initialModel.columns.map(column => [column.column.key, column.renderKey]),
    );

    expect(reorderedModel.columns.map(column => column.renderKey)).toEqual([
      initialIdentityByColumn.get('id'),
      initialIdentityByColumn.get('name'),
    ]);

    const el = await createComponent({ columns: identityColumns, items: [items[0]] });

    await updateComponent(el, {
      columns: [identityColumns[1], identityColumns[0]],
    });

    const reorderedHeaders = Array.from(
      el.shadowRoot.querySelectorAll('thead th'),
    ) as HTMLTableCellElement[];
    const reorderedCells = Array.from(
      el.shadowRoot.querySelectorAll('.row-el td'),
    ) as HTMLTableCellElement[];
    expect(reorderedHeaders.map(header => header.textContent?.trim())).toEqual(['ID', 'Name']);
    expect(reorderedCells.map(cell => cell.textContent?.trim())).toEqual(['1', 'Alpha']);
    el.remove();
  });

  it('reuses row action elements when actions are reordered', async () => {
    const actions = [
      { key: 'edit', icon: 'pencil', tooltip: 'Edit' },
      { key: 'delete', icon: 'trash-2', tooltip: 'Delete' },
    ];
    const el = await createComponent({ columns, items: [items[0]], rowActions: actions });
    const initialButtons = Array.from(el.shadowRoot.querySelectorAll('.cell-actions q-button'));

    await updateComponent(el, { rowActions: [actions[1], actions[0]] });

    const reorderedButtons = Array.from(el.shadowRoot.querySelectorAll('.cell-actions q-button'));
    expect(reorderedButtons[0]).toBe(initialButtons[1]);
    expect(reorderedButtons[1]).toBe(initialButtons[0]);
    el.remove();
  });

  it('reuses group divider DOM when grouped rows are reordered', async () => {
    const groupedItems = [
      { id: 1, name: 'Alpha', day: 'one' },
      { id: 2, name: 'Beta', day: 'one' },
      { id: 3, name: 'Gamma', day: 'two' },
    ];
    const rowGroup = (item: any) => ({ key: item.day, label: item.day });
    const el = await createComponent({ columns, items: groupedItems, rowGroup });
    const initialGroups = Array.from(el.shadowRoot.querySelectorAll('.row-group'));

    await updateComponent(el, {
      items: [groupedItems[2], groupedItems[0], groupedItems[1]],
    });

    const reorderedGroups = Array.from(el.shadowRoot.querySelectorAll('.row-group'));
    expect(reorderedGroups[0]).toBe(initialGroups[1]);
    expect(reorderedGroups[1]).toBe(initialGroups[0]);
    el.remove();
  });

  it('renders group dividers when the consecutive row group changes', async () => {
    const groupedItems = [
      { id: 1, name: 'Alpha', day: '2026-07-12' },
      { id: 2, name: 'Beta', day: '2026-07-12' },
      { id: 3, name: 'Gamma', day: '2026-07-11' },
    ];
    const rowGroup = (item: any) => ({ key: item.day, label: item.day });
    const el = await createComponent({
      columns,
      items: groupedItems,
      rowGroup,
      selectable: true,
      rowActions: [{ key: 'open', icon: 'eye', tooltip: 'Open' }],
    });
    const groupRows = el.shadowRoot.querySelectorAll('.row-group');

    expect(groupRows).toHaveLength(2);
    expect(groupRows[0].textContent?.trim()).toBe('2026-07-12');
    expect(groupRows[1].textContent?.trim()).toBe('2026-07-11');
    expect(groupRows[0].querySelector('td')?.getAttribute('colspan')).toBe('3');
    expect(el.shadowRoot.querySelectorAll('.row-el')).toHaveLength(3);
    expect(el.shadowRoot.querySelectorAll('tbody input[type="checkbox"]')).toHaveLength(3);
    expect(el.shadowRoot.querySelectorAll('.row-group .cell-actions')).toHaveLength(0);
    el.remove();
  });

  it('does not emit row events when a group divider is clicked', async () => {
    const el = await createComponent({
      columns,
      items,
      rowGroup: (_item: any, index: number) => ({ key: index, label: `Group ${index}` }),
    });
    const handler = vi.fn();
    el.addEventListener('qRowClick', handler);

    el.shadowRoot.querySelector('.row-group')?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).not.toHaveBeenCalled();
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
    const rowActions = [{ key: 'edit', icon: 'pencil', tooltip: 'Edit user', disabled: (item: any) => item.id === 1 }];
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

  it('classifies nested keyboard targets as interactive', () => {
    const button = document.createElement('button');
    const row = document.createElement('tr');

    expect(isInteractiveDataTableTarget({ composedPath: () => [button] } as unknown as Event)).toBe(true);
    expect(isInteractiveDataTableTarget({ composedPath: () => [row] } as unknown as Event)).toBe(false);
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
    expect(el.shadowRoot.querySelector('.table-loading-state q-progress')).toBeTruthy();
    expect(el.shadowRoot.textContent).not.toContain('Alpha');
    el.remove();
  });

  it('falls back to nested values when a custom renderer throws', async () => {
    const el = await createComponent({
      columns: [
        {
          key: 'profile.name',
          header: 'Name',
          render: () => {
            throw new Error('bad render');
          },
        },
      ],
      items: [{ id: 1, profile: { name: 'Nested Alpha' } }],
    });
    const cell = el.shadowRoot.querySelector('tbody td') as HTMLTableCellElement;

    expect(cell.textContent?.trim()).toBe('Nested Alpha');
    el.remove();
  });
});
