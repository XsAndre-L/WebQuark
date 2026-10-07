import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { getDataTableCellSlotName } from '../data-table-cell';
// @ts-ignore Generated consumer API is verified after the package build.
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();
afterEach(() => document.body.replaceChildren());
const longName = 'A long store and team member description '.repeat(20);

async function settle() {
  for (let index = 0; index < 6; index++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function mount(twoLineRows = true) {
  const table = document.createElement('q-data-table');
  table.twoLineRows = twoLineRows;
  table.style.width = '640px';
  table.style.setProperty('--q-table-cell-font-size', '12px');
  table.style.setProperty('--q-table-cell-padding-block', '14px');
  table.columns = [{ key: 'name', header: 'Name', width: '60%', overflowTooltip: true }, { key: 'status', header: 'Status', width: '40%' }];
  table.items = [
    { id: 'a', name: 'Short', status: 'Ready' },
    { id: 'b', name: longName, status: 'Ready' },
  ];
  document.body.append(table);
  await table.componentOnReady();
  await settle();
  return table;
}

describe('data-table two-line rows in Chromium', () => {
  it('keeps default cells unwrapped and removes the mode cleanly', async () => {
    const table = await mount(false);
    expect(table.shadowRoot!.querySelector('.cell-content')).toBeNull();
    expect(table.shadowRoot!.querySelector('.row-el td:not(.cell-row-gutter) > slot')).toBeTruthy();
    expect(getComputedStyle(table.shadowRoot!.querySelector('.table-el')!).tableLayout).toBe('auto');
    table.twoLineRows = true;
    await settle();
    expect(table.shadowRoot!.querySelector('.cell-content')).toBeTruthy();
    table.twoLineRows = false;
    await settle();
    expect(table.shadowRoot!.querySelector('.cell-content')).toBeNull();
  });

  it('holds short and long rows at the same height while columns resize', async () => {
    const table = await mount();
    const initialHeights = Array.from(table.shadowRoot!.querySelectorAll<HTMLElement>('.row-el')).map(row => row.getBoundingClientRect().height);
    for (const width of ['640px', '280px', '180px', '640px']) {
      table.style.width = width;
      await settle();
      const heights = Array.from(table.shadowRoot!.querySelectorAll<HTMLElement>('.row-el')).map(row => row.getBoundingClientRect().height);
      // Collapsed borders contribute half a pixel less at the borderless final row.
      expect(Math.abs(heights[0] - heights[1])).toBeLessThanOrEqual(0.5);
      heights.forEach((height, index) => expect(height).toBe(initialHeights[index]));
      expect(heights[0]).toBeGreaterThanOrEqual(64);
      expect(heights[0]).toBeLessThanOrEqual(65);
      expect(table.getBoundingClientRect().width).toBeCloseTo(parseFloat(width), 0);
      expect(table.shadowRoot!.querySelector<HTMLElement>('.cell-content')!.getBoundingClientRect().height).toBe(36);
    }
  });

  it('exposes only overflowing text to keyboard tooltip focus', async () => {
    const table = await mount();
    const triggers = Array.from(table.shadowRoot!.querySelectorAll<HTMLElement>('.cell-text'));
    expect(triggers[0].tabIndex).toBe(-1);
    expect(triggers).toHaveLength(2);
    expect(triggers[1].tabIndex).toBe(0);
    const text = triggers[1].querySelector('.cell-text-value')!;
    expect(text.textContent).toBe(longName);
    expect(getComputedStyle(text).webkitLineClamp).toBe('2');
    expect(text.scrollHeight).toBeGreaterThan(text.clientHeight);
    const tooltip = triggers[1].querySelector('q-tooltip')!;
    await tooltip.componentOnReady();
    triggers[1].focus();
    await expect.poll(() => tooltip.getAttribute('aria-hidden')).toBe('false');
    await new Promise(resolve => setTimeout(resolve, 200));
    const tooltipBox = tooltip.getBoundingClientRect();
    expect(tooltipBox.left).toBeGreaterThanOrEqual(7);
    expect(tooltipBox.right).toBeLessThanOrEqual(window.innerWidth - 7);
    expect(tooltipBox.top).toBeGreaterThanOrEqual(7);
    expect(tooltipBox.bottom).toBeLessThanOrEqual(window.innerHeight - 7);
    expect(getComputedStyle(tooltip.shadowRoot!.querySelector('.tooltip-bubble')!).whiteSpace).toBe('normal');
    expect(tooltip.content).toBe(longName);
    expect(triggers[1].getAttribute('aria-describedby')).toContain(tooltip.id);
    triggers[1].blur();
    await userEvent.hover(triggers[1]);
    await expect.poll(() => tooltip.getAttribute('aria-hidden')).toBe('false');
    const activation = vi.fn();
    table.addEventListener('qRowClick', activation);
    triggers[1].focus();
    await userEvent.keyboard('{Enter}');
    expect(activation).toHaveBeenCalledOnce();
  });

  it('updates overflow after reconnect and removes tooltip focus when text fits again', async () => {
    const table = await mount();
    table.items = [{ id: 'a', name: 'A moderately long store name and member description', status: 'Ready' }];
    await settle();
    const trigger = table.shadowRoot!.querySelector<HTMLElement>('.cell-text')!;
    const tooltip = trigger.querySelector('q-tooltip')!;
    expect(trigger.tabIndex).toBe(-1);
    expect(getComputedStyle(tooltip).display).toBe('none');
    table.remove();
    table.style.width = '180px';
    document.body.append(table);
    await settle();
    expect(trigger.tabIndex).toBe(0);
    expect(trigger.hasAttribute('data-overflow')).toBe(true);
    table.style.width = '640px';
    await settle();
    expect(trigger.tabIndex).toBe(-1);
    expect(getComputedStyle(tooltip).display).toBe('none');
  });

  it('fits a rich 36px avatar and button without changing selection or activation', async () => {
    const table = await mount();
    table.selectable = true;
    table.rowActions = [{ key: 'edit', icon: 'pencil', tooltip: 'Edit' }];
    const rich = document.createElement('span');
    rich.slot = getDataTableCellSlotName('status', 'a');
    rich.style.cssText = 'display:flex;align-items:center;gap:4px';
    const avatar = document.createElement('img');
    avatar.alt = '';
    avatar.style.cssText = 'width:36px;height:36px;flex-shrink:0';
    const button = document.createElement('button');
    button.textContent = 'Open';
    rich.append(avatar, button);
    table.append(rich);
    await settle();
    const rows = Array.from(table.shadowRoot!.querySelectorAll<HTMLElement>('.row-el'));
    const content = rows[0].querySelectorAll<HTMLElement>('.cell-content')[1];
    const box = content.getBoundingClientRect();
    const avatarBox = avatar.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    expect(avatarBox.height).toBe(36);
    expect(avatarBox.top).toBeGreaterThanOrEqual(box.top);
    expect(avatarBox.bottom).toBeLessThanOrEqual(box.bottom);
    expect(buttonBox.top).toBeGreaterThanOrEqual(box.top);
    expect(buttonBox.bottom).toBeLessThanOrEqual(box.bottom);
    const action = rows[0].querySelector<HTMLElement>('.cell-actions q-button')!;
    const actionCell = rows[0].querySelector<HTMLElement>('.cell-actions')!;
    expect(action.getBoundingClientRect().width).toBeGreaterThan(15);
    expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(actionCell.getBoundingClientRect().right);
    expect(Math.abs(rows[0].getBoundingClientRect().height - rows[1].getBoundingClientRect().height)).toBeLessThanOrEqual(0.5);
    const activation = vi.fn();
    const selection = vi.fn();
    const rowAction = vi.fn();
    table.addEventListener('qRowClick', activation);
    table.addEventListener('qSelectionChange', selection);
    table.addEventListener('qRowAction', rowAction);
    button.click();
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(activation).not.toHaveBeenCalled();
    await userEvent.click(action);
    expect(rowAction).toHaveBeenCalledOnce();
    expect(activation).not.toHaveBeenCalled();
    rows[0].querySelector<HTMLInputElement>('input')!.click();
    await settle();
    expect(selection).toHaveBeenCalledOnce();
    rows[0].querySelector<HTMLElement>('.cell-row-gutter')!.click();
    expect(activation).toHaveBeenCalledOnce();
    for (const width of ['280px', '640px']) {
      table.style.width = width;
      await settle();
      expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(actionCell.getBoundingClientRect().right);
      expect(action.getBoundingClientRect().left).toBeGreaterThanOrEqual(actionCell.getBoundingClientRect().left);
    }
  });
});
