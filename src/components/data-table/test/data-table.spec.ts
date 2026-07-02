import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../dist/loader';

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
});
