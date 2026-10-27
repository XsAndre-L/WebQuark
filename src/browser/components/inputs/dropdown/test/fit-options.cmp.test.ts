import { afterEach, expect, it } from 'vitest';
import '../../../../../../packages/browser/components/dist/components/q-dropdown.js';
import '../../../../../../packages/browser/components/dist/components/q-control-group.js';
import '../../../../../../packages/browser/components/dist/components/q-input.js';
import tokens from '../../../../theme/tokens.css?raw';

const frame = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
const width = (element: HTMLElement) => element.getBoundingClientRect().width;

async function fixture(attributes = '') {
  document.body.innerHTML = `<style>${tokens}</style><div id="parent" style="width:600px"><q-dropdown id="dropdown" width="fit-options" label="Unit" label-hidden ${attributes}></q-dropdown></div>`;
  const dropdown = document.getElementById('dropdown') as HTMLQDropdownElement;
  dropdown.options = ['Hours', 'Minutes', 'Seconds'];
  dropdown.value = 'Hours';
  await customElements.whenDefined('q-dropdown');
  await frame();
  return dropdown;
}

afterEach(() => document.body.replaceChildren());

it('keeps a content-sized interval group inside its layout space as text grows', async () => {
  const dropdown = await fixture();
  const parent = document.getElementById('parent')!;
  parent.style.cssText = 'display:flex;flex-wrap:wrap;gap:16px;width:600px';
  const group = document.createElement('q-control-group');
  group.style.cssText = 'width:max-content;max-width:100%';
  const number = document.createElement('q-input');
  number.width = 'xs';
  number.type = 'number';
  number.labelHidden = true;
  number.value = '10';
  group.append(number, dropdown);
  const sibling = document.createElement('span');
  sibling.textContent = 'Enabled';
  parent.append(group, sibling);
  for (const fontSize of ['14px', '24px', '32px']) {
    parent.style.setProperty('--q-control-font-md', fontSize);
    parent.style.setProperty('--q-control-line-md', `${parseFloat(fontSize) + 6}px`);
    parent.style.setProperty('--q-control-height-md', `${parseFloat(fontSize) + 16}px`);
    await frame();
    const groupBox = group.getBoundingClientRect();
    const trigger = dropdown.shadowRoot!.querySelector('button')!.getBoundingClientRect();
    expect(trigger.right).toBeLessThanOrEqual(groupBox.right + 1);
    expect(trigger.bottom).toBeLessThanOrEqual(groupBox.bottom + 1);
    expect(sibling.getBoundingClientRect().left).toBeGreaterThanOrEqual(trigger.right);
  }
  parent.style.width = '140px';
  await frame();
  expect(dropdown.getBoundingClientRect().right).toBeLessThanOrEqual(group.getBoundingClientRect().right + 1);
  expect(dropdown.shadowRoot!.querySelector('button')!.getBoundingClientRect().right)
    .toBeLessThanOrEqual(group.getBoundingClientRect().right + 1);
  expect(width(number)).toBe(80);
});

it('fits the longest label with arrow spacing and keeps that width across selection', async () => {
  const dropdown = await fixture();
  const initial = width(dropdown);
  expect(initial).toBeLessThan(200);
  dropdown.value = 'Minutes';
  await frame();
  expect(width(dropdown)).toBe(initial);
  const text = dropdown.shadowRoot!.querySelector<HTMLElement>('.trigger-text')!;
  const arrow = dropdown.shadowRoot!.querySelector<HTMLElement>('button .chevron-icon')!;
  expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
  expect(arrow.getBoundingClientRect().left - text.getBoundingClientRect().right).toBeGreaterThanOrEqual(9.5);
  dropdown.options = ['Hours', 'A much longer interval option'];
  await expect.poll(() => width(dropdown)).toBeGreaterThan(initial);
  dropdown.removeAttribute('width');
  await frame();
  expect(width(dropdown)).toBe(600);
  expect(dropdown.style.getPropertyValue('--_q-dropdown-options-width')).toBe('');
});

it('reflows after font, gap and size changes, and respects parent and explicit host widths', async () => {
  const dropdown = await fixture();
  const initial = width(dropdown);
  dropdown.style.setProperty('--q-dropdown-font-size', '24px');
  await expect.poll(() => width(dropdown)).toBeGreaterThan(initial);
  const larger = width(dropdown);
  dropdown.style.setProperty('--q-dropdown-icon-gap', '24px');
  await expect.poll(() => width(dropdown)).toBeGreaterThan(larger + 13);
  const withGap = width(dropdown);
  dropdown.style.setProperty('--q-dropdown-padding', '0 40px');
  await expect.poll(() => width(dropdown)).toBeGreaterThan(withGap + 40);
  dropdown.style.removeProperty('--q-dropdown-padding');
  dropdown.style.removeProperty('--q-dropdown-font-size');
  dropdown.style.removeProperty('--q-dropdown-icon-gap');
  document.getElementById('parent')!.style.width = '60px';
  await frame();
  expect(width(dropdown)).toBe(60);
  expect(dropdown.scrollWidth).toBeLessThanOrEqual(60);
  document.getElementById('parent')!.style.width = '600px';
  dropdown.style.width = '150px';
  await frame();
  expect(width(dropdown)).toBe(150);
});

it.each(['sm', 'md', 'lg'] as const)('fits searchable controls at size %s without crowding their arrow', async size => {
  const dropdown = await fixture(`searchable size="${size}"`);
  dropdown.value = 'Minutes';
  await frame();
  const input = dropdown.shadowRoot!.querySelector<HTMLInputElement>('.dropdown-main-input')!;
  const style = getComputedStyle(input);
  const labels = dropdown.shadowRoot!.querySelector<HTMLElement>('.fit-options-labels')!;
  const available = input.clientWidth - parseFloat(style.paddingInlineStart) - parseFloat(style.paddingInlineEnd);
  expect(available).toBeGreaterThanOrEqual(width(labels) - 1);
  const arrow = dropdown.shadowRoot!.querySelector<HTMLElement>('.editable-trigger > .chevron-icon')!;
  expect(parseFloat(style.paddingInlineEnd) - 14 - width(arrow)).toBeGreaterThanOrEqual(9.5);
});

it('uses loaded options rather than filtered search results and supports group placement', async () => {
  const dropdown = await fixture('searchable');
  const group = document.createElement('q-control-group');
  const number = document.createElement('q-input');
  number.width = 'xs';
  group.append(number, dropdown);
  document.getElementById('parent')!.append(group);
  await frame();
  const initial = width(dropdown);
  const input = dropdown.shadowRoot!.querySelector<HTMLInputElement>('.dropdown-main-input')!;
  input.value = 'Hours';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await frame();
  expect(width(dropdown)).toBe(initial);
  expect(width(number)).toBe(80);
  expect(width(dropdown)).toBeLessThan(200);
});
