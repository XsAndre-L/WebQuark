import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
// @ts-ignore - exercise the freshly built distribution including composed q-chip styles.
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
// @ts-ignore
import '../../../../../../packages/browser/components/dist/webquark/webquark.css';

defineCustomElements();
const frame = async () => { await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); };
const options = [{ label: 'Catalogue', value: 'catalogue' }, { label: 'Checkout', value: 'checkout' }, { label: 'Payments', value: 'payments' }];
async function create(props: Partial<HTMLQDropdownElement> = {}, parent: HTMLElement = document.body) {
  const element = document.createElement('q-dropdown');
  Object.assign(element, { label: 'Modules', multiple: true, searchable: true, options, ...props });
  element.style.width = '380px';
  parent.append(element);
  await element.componentOnReady();
  await frame();
  return element;
}
afterEach(() => document.body.replaceChildren());

describe('q-dropdown multiple selection', () => {
  it('keeps one line, hides selected choices, removes chips and emits only the array change', async () => {
    const element = await create({ value: 'payments', searchable: false });
    const values = vi.fn(), single = vi.fn();
    element.addEventListener('qValuesChange', values);
    element.addEventListener('qChange', single);
    const input = page.getByRole('combobox', { name: 'Modules' });
    const height = element.shadowRoot!.querySelector('.multiple-trigger')!.getBoundingClientRect().height;
    await userEvent.click(input);
    await userEvent.click(page.getByRole('option', { name: 'Catalogue' }));
    await frame();
    expect(element.values).toEqual(['catalogue']);
    expect(element.shadowRoot!.querySelectorAll('[role=option]')).toHaveLength(2);
    expect(element.shadowRoot!.querySelector('[role=option][aria-selected="true"]')).toBeNull();
    expect(values.mock.calls[0][0].detail).toEqual(['catalogue']);
    expect(single).not.toHaveBeenCalled();
    await userEvent.click(page.getByRole('button', { name: 'Remove Catalogue' }));
    await frame();
    expect(element.values).toEqual([]);
    await userEvent.click(input);
    expect(element.shadowRoot!.querySelectorAll('[role=option]')).toHaveLength(3);
    expect(element.shadowRoot!.querySelector('.multiple-trigger')!.getBoundingClientRect().height).toBe(height);
  });

  it('keeps search usable and supports keyboard selection, Backspace and Escape', async () => {
    const element = await create();
    const input = page.getByRole('combobox', { name: 'Modules' });
    await input.fill('Check');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await frame();
    expect(element.values).toEqual(['checkout']);
    expect((element.shadowRoot!.querySelector('.multiple-input') as HTMLInputElement).value).toBe('');
    await userEvent.keyboard('{Backspace}');
    expect(element.values).toEqual([]);
    await userEvent.keyboard('{Escape}');
    await frame();
    expect(element.shadowRoot!.querySelector('.dropdown-menu')).toBeNull();
  });

  it('measures fitting chips and lets the overflow panel remove selections without growing the control', async () => {
    const element = await create({ values: ['catalogue', 'checkout', 'payments'] });
    element.style.width = '230px';
    await frame(); await frame();
    const field = element.shadowRoot!.querySelector('.multiple-trigger')!;
    const height = field.getBoundingClientRect().height;
    const more = element.shadowRoot!.querySelector<HTMLButtonElement>('.multiple-trigger > .multiple-more')!;
    expect(more).not.toBeNull();
    expect(element.shadowRoot!.querySelector<HTMLInputElement>('.multiple-input')!.getBoundingClientRect().width).toBeGreaterThanOrEqual(64);
    more.click(); await frame();
    const input = element.shadowRoot!.querySelector<HTMLInputElement>('.multiple-input')!;
    input.focus();
    await userEvent.keyboard('{ArrowDown}'); await frame();
    expect(element.shadowRoot!.querySelector('[role=listbox]')).not.toBeNull();
    more.click(); await frame();
    await userEvent.click(page.getByRole('dialog', { name: 'Selected options' }).getByRole('button', { name: 'Remove Payments' }));
    await frame();
    expect(element.values).toEqual(['catalogue', 'checkout']);
    await userEvent.keyboard('{Escape}');
    element.style.width = '700px'; await frame(); await frame();
    expect(element.shadowRoot!.querySelector('.multiple-trigger > .multiple-more')).toBeNull();
    expect(field.getBoundingClientRect().height).toBe(height);
  });

  it('submits repeated native form entries, validates required, resets and respects disabled fieldsets', async () => {
    const form = document.createElement('form'); document.body.append(form);
    const fieldset = document.createElement('fieldset'); form.append(fieldset);
    const element = await create({ name: 'modules', required: true, values: ['catalogue'] }, fieldset);
    expect(new FormData(form).getAll('modules')).toEqual(['catalogue']);
    element.values = ['checkout', 'payments']; await frame();
    expect(new FormData(form).getAll('modules')).toEqual(['checkout', 'payments']);
    element.values = []; await frame(); expect(await element.checkValidity()).toBe(false);
    fieldset.disabled = true; await frame(); expect(await element.checkValidity()).toBe(true);
    expect(new FormData(form).getAll('modules')).toEqual([]);
    fieldset.disabled = false; form.reset(); await frame();
    expect(element.values).toEqual(['catalogue']);
  });

  it('round-trips q-form arrays and keeps external selections when the option page changes', async () => {
    const form = document.createElement('q-form'); document.body.append(form); await form.componentOnReady();
    const element = await create({ name: 'modules', externalSearch: true, values: ['catalogue'] }, form);
    await form.setValues({ modules: ['checkout', 'payments'] }); await frame();
    expect(await form.getValues()).toEqual({ modules: ['checkout', 'payments'] });
    element.options = []; await frame();
    expect(await form.getValues()).toEqual({ modules: ['checkout', 'payments'] });
    expect(Array.from(element.shadowRoot!.querySelectorAll('q-chip')).some(chip => chip.label === 'Checkout')).toBe(true);
    await form.setValues({ modules: [] }); await frame();
    expect(await form.getValues()).toEqual({ modules: [] });
  });
});
