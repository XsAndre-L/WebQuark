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

  it('emits row clicks from cells but ignores nested interactive targets', async () => {
    const el = await createComponent({
      columns: [{ key: 'name', header: 'Name', render: (item: any) => h(item.name === 'Alpha' ? 'button' : 'span', {}, item.name) }],
      items,
    });
    const handler = vi.fn();
    el.addEventListener('qRowClick', handler);

    const firstRow = el.shadowRoot.querySelector('tbody tr') as HTMLTableRowElement;
    const secondRowCell = el.shadowRoot.querySelectorAll('tbody td')[1] as HTMLTableCellElement;
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
