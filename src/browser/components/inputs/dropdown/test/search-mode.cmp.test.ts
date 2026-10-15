import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../dropdown';
import css from '../dropdown.css?inline';

const frame = async () => { await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); };
async function create(props: Record<string, unknown> = {}) {
  const el = document.createElement('q-dropdown');
  Object.assign(el, { label: 'Destination', searchable: true, options: [{ label: 'Alpha', value: 'a' }, { label: 'Beta', value: 'b' }], value: 'a', ...props });
  el.style.width = '240px'; document.body.append(el);
  await customElements.whenDefined('q-dropdown'); await frame();
  const style = document.createElement('style'); style.textContent = css; el.shadowRoot!.append(style);
  return el;
}
describe('q-dropdown search modes in Chromium', () => {
  afterEach(() => document.body.replaceChildren());
  it('filters from the main field without committing draft text and commits a pointer choice once', async () => {
    const el = await create(); const change = vi.fn(), select = vi.fn();
    el.addEventListener('qChange', change); el.addEventListener('qSelect', select);
    const input = page.getByRole('combobox', { name: 'Destination' });
    await input.fill('Bet'); await frame();
    expect(el.value).toBe('a'); expect(change).not.toHaveBeenCalled();
    expect(el.shadowRoot!.querySelector('.dropdown-search-container')).toBeNull();
    expect(el.shadowRoot!.querySelectorAll('[role=option]')).toHaveLength(1);
    await userEvent.click(page.getByRole('option', { name: 'Beta' })); await frame();
    expect(el.value).toBe('b'); expect(change).toHaveBeenCalledTimes(1); expect(select).toHaveBeenCalledTimes(1);
    expect((el.shadowRoot!.querySelector('.dropdown-main-input') as HTMLInputElement).value).toBe('Beta');
    expect(el.shadowRoot!.activeElement).toBe(el.shadowRoot!.querySelector('.dropdown-main-input'));
  });
  it('moves the active option with arrows, commits only that option, and restores drafts on Escape and Tab', async () => {
    const el = await create(); const input = page.getByRole('combobox', { name: 'Destination' });
    await userEvent.click(input); await userEvent.keyboard('{ArrowDown}{ArrowDown}'); await frame();
    const field = el.shadowRoot!.querySelector<HTMLInputElement>('.dropdown-main-input')!;
    expect(field.getAttribute('aria-activedescendant')).toBe('q-field-item-1');
    await userEvent.keyboard('{Enter}'); await frame(); expect(el.value).toBe('b');
    await input.fill('uncommitted'); await userEvent.keyboard('{Escape}'); await frame();
    expect(field.value).toBe('Beta'); expect(el.value).toBe('b');
    await input.fill('another draft'); await userEvent.keyboard('{Tab}'); await frame();
    expect(field.value).toBe('Beta'); expect(el.value).toBe('b');
  });
  it('restores on outside blur without a choice and does not submit draft text', async () => {
    const el = await create({ name: 'destination', required: true });
    const form = document.createElement('form'); document.body.append(form); form.append(el);
    const outside = document.createElement('button'); outside.textContent = 'Outside'; outside.style.cssText = 'position:fixed;right:10px;bottom:10px'; document.body.append(outside);
    await frame();
    const input = page.getByRole('combobox', { name: 'Destination' });
    await input.fill('draft'); await userEvent.click(outside); await frame();
    expect((el.shadowRoot!.querySelector('.dropdown-main-input') as HTMLInputElement).value).toBe('Alpha');
    expect(new FormData(form).getAll('destination')).toEqual(['a']);
    el.value = 'b'; await frame(); form.reset(); await frame(); expect(el.value).toBe('a');
    await el.focusElement(); expect(el.shadowRoot!.activeElement).toBe(el.shadowRoot!.querySelector('input'));
    el.value = ''; await frame(); expect(await el.reportValidity()).toBe(false);
    expect(el.shadowRoot!.activeElement).toBe(el.shadowRoot!.querySelector('input'));
  });
  it('emits immediate completed external edits once, including clear, while retaining the committed remote label', async () => {
    const el = await create({ externalSearch: true }); const search = vi.fn(), change = vi.fn();
    el.addEventListener('qSearch', search); el.addEventListener('qChange', change);
    await userEvent.click(page.getByRole('combobox', { name: 'Destination' })); await frame();
    expect(search).not.toHaveBeenCalled();
    const field = el.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    field.value = '日'; field.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }));
    expect(search).not.toHaveBeenCalled(); expect(el.value).toBe('a');
    field.value = '日本'; field.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    field.dispatchEvent(new InputEvent('input', { bubbles: true })); await frame();
    expect(search).toHaveBeenCalledTimes(1); expect(search.mock.calls[0][0].detail).toBe('日本');
    el.options = [{ label: 'Other remote result', value: 'other' }]; await frame();
    await userEvent.keyboard('{Escape}'); await frame(); expect(field.value).toBe('Alpha');
    expect(search).toHaveBeenCalledTimes(1); expect(change).not.toHaveBeenCalled();
    await page.getByRole('combobox', { name: 'Destination' }).fill(''); await frame();
    expect(search.mock.calls.at(-1)![0].detail).toBe('');
    el.value = 'unknown'; await frame(); expect(field.value).toBe('');
    el.value = ''; await frame(); expect(field.value).toBe('');
  });
  it('keeps menu mode separate, cancels mode switches, and disables the active control', async () => {
    const el = await create({ searchMode: 'menu' });
    await userEvent.click(el.shadowRoot!.querySelector('.dropdown-trigger')!); await frame();
    expect(el.shadowRoot!.querySelector('.dropdown-search-input')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('.dropdown-main-input')).toBeNull();
    el.searchMode = 'default'; await frame();
    expect(el.shadowRoot!.querySelector('.dropdown-menu')).toBeNull();
    await page.getByRole('combobox', { name: 'Destination' }).fill('draft');
    el.disabled = true; await frame();
    expect((el.shadowRoot!.querySelector('input') as HTMLInputElement).disabled).toBe(true);
    expect(el.shadowRoot!.querySelector('.dropdown-menu')).toBeNull();
    el.disabled = false; el.searchable = false; await frame();
    expect(el.shadowRoot!.querySelector('input')).toBeNull();
    expect(el.shadowRoot!.querySelector('button')?.textContent).toContain('Alpha');
  });
  it('keeps local removed selections invalid without creating a change event', async () => {
    const el = await create({ required: true }); const change = vi.fn(); el.addEventListener('qChange', change);
    el.options = ['Gamma']; await frame();
    expect(el.value).toBe('a'); expect(await el.checkValidity()).toBe(false); expect(change).not.toHaveBeenCalled();
    expect((el.shadowRoot!.querySelector('input') as HTMLInputElement).value).toBe('');
  });
  it('anchors the popup to the actual input and retains external paging/loading behavior', async () => {
    const el = await create({ externalSearch: true, hasMore: true }); const more = vi.fn();
    el.addEventListener('qLoadMore', more);
    await userEvent.click(page.getByRole('combobox', { name: 'Destination' })); await frame();
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.dropdown-main-input')!;
    const menu = el.shadowRoot!.querySelector<HTMLElement>('.dropdown-menu')!;
    expect(menu.getBoundingClientRect().width).toBeCloseTo(input.getBoundingClientRect().width);
    expect(menu.getBoundingClientRect().top - input.getBoundingClientRect().bottom).toBeCloseTo(4);
    const list = el.shadowRoot!.querySelector<HTMLElement>('.dropdown-items-list')!;
    list.dispatchEvent(new Event('scroll')); await frame(); expect(more).toHaveBeenCalledTimes(1);
    el.loading = true; await frame();
    expect(el.shadowRoot!.querySelector('.is-loading-more')).not.toBeNull();
    list.dispatchEvent(new Event('scroll')); await frame(); expect(more).toHaveBeenCalledTimes(1);
    el.options = [{ label: 'Remote page', value: 'page' }]; el.loading = false; await frame();
    list.dispatchEvent(new Event('scroll')); await frame(); expect(more).toHaveBeenCalledTimes(2);
  });
});
