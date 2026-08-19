import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-dropdown', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-dropdown');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getOptionItems(el: any): HTMLElement[] {
    return Array.from(el.shadowRoot.querySelectorAll('.menu-item:not(.is-empty):not(.is-loading-more)'));
  }

  function getOptionItem(el: any, label: string): HTMLElement | undefined {
    return getOptionItems(el).find(item => item.textContent?.trim() === label);
  }

  const options = [
    { label: 'Alpha', value: 'alpha' },
    { label: 'Beta', value: 'beta' },
  ];

  it('shows the selected label from JSON options outside the visible page', async () => {
    const largeOptions = Array.from({ length: 25 }, (_, index) => ({
      label: `Option ${index + 1}`,
      value: `value-${index + 1}`,
    }));
    const el = await createComponent({ options: JSON.stringify(largeOptions), value: 'value-25' });
    const triggerText = el.shadowRoot.querySelector('.trigger-text') as HTMLElement;

    expect(triggerText.textContent?.trim()).toBe('Option 25');
    expect(triggerText.classList.contains('is-placeholder')).toBe(false);
    el.remove();
  });

  it('filters searchable JSON options without crashing on missing labels', async () => {
    const el = await createComponent({
      searchable: true,
      options: JSON.stringify([{ value: 'missing-label' }, { label: 'Alpha', value: 'alpha' }]),
    });
    const trigger = el.shadowRoot.querySelector('.dropdown-trigger') as HTMLElement;
    trigger.click();
    await wait(20);

    const search = el.shadowRoot.querySelector('.dropdown-search-input') as HTMLInputElement;
    search.value = 'alp';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(20);

    const items = (Array.from(el.shadowRoot.querySelectorAll('.menu-item')) as HTMLElement[]).map(item => item.textContent?.trim());
    expect(items).toEqual(['Alpha']);
    expect(search.getAttribute('role')).toBe('combobox');
    expect(search.getAttribute('aria-controls')).toBe('q-field-menu');
    el.remove();
  });

  it('emits qChange and qSelect when selecting an option', async () => {
    const el = await createComponent({ options });
    const changeHandler = vi.fn();
    const selectHandler = vi.fn();
    el.addEventListener('qChange', changeHandler);
    el.addEventListener('qSelect', selectHandler);

    const trigger = el.shadowRoot.querySelector('.dropdown-trigger') as HTMLElement;
    trigger.click();
    await wait(20);

    const beta = el.shadowRoot.querySelectorAll('.menu-item')[1] as HTMLElement;
    beta.click();
    await wait(20);

    expect(el.value).toBe('beta');
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail).toBe('beta');
    expect(selectHandler).toHaveBeenCalledTimes(1);
    expect(selectHandler.mock.calls[0][0].detail).toEqual({ label: 'Beta', value: 'beta' });
    el.remove();
  });

  it('restores the initial value on form reset', async () => {
    const el = await createComponent({ options, value: 'alpha' });
    el.value = 'beta';

    el.formResetCallback();

    expect(el.value).toBe('alpha');
    el.remove();
  });

  it('emits external search terms without filtering the supplied page locally', async () => {
    const el = await createComponent({ searchable: true, externalSearch: true, options });
    const searchHandler = vi.fn();
    el.addEventListener('qSearch', searchHandler);

    (el.shadowRoot.querySelector('.dropdown-trigger') as HTMLElement).click();
    await wait(20);

    const search = el.shadowRoot.querySelector('.dropdown-search-input') as HTMLInputElement;
    search.value = 'alp';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(20);

    const items = Array.from(el.shadowRoot.querySelectorAll('.menu-item')) as HTMLElement[];
    expect(items.map(item => item.textContent?.trim())).toEqual(['Alpha', 'Beta']);
    expect(searchHandler).toHaveBeenCalledTimes(1);
    expect(searchHandler.mock.calls[0][0].detail).toBe('alp');
    el.remove();
  });

  it('requests the next external page when the option list reaches the bottom', async () => {
    const el = await createComponent({ externalSearch: true, hasMore: true, options });
    const loadMoreHandler = vi.fn();
    el.addEventListener('qLoadMore', loadMoreHandler);

    (el.shadowRoot.querySelector('.dropdown-trigger') as HTMLElement).click();
    await wait(20);

    const list = el.shadowRoot.querySelector('.dropdown-items-list') as HTMLElement;
    Object.defineProperties(list, {
      scrollHeight: { value: 400, configurable: true },
      clientHeight: { value: 200, configurable: true }
    });
    list.scrollTop = 200;
    list.dispatchEvent(new Event('scroll', { bubbles: true }));
    await wait(20);

    expect(loadMoreHandler).toHaveBeenCalledTimes(1);
    el.remove();
  });

  it('normalizes string options into matching labels and values', async () => {
    const el = await createComponent({ options: ['Alpha', 'Beta'] });
    const selectHandler = vi.fn();
    el.addEventListener('qSelect', selectHandler);

    (el.shadowRoot.querySelector('.dropdown-trigger') as HTMLElement).click();
    await wait(20);
    (el.shadowRoot.querySelectorAll('.menu-item')[1] as HTMLElement).click();
    await wait(20);

    expect(el.value).toBe('Beta');
    expect(selectHandler.mock.calls[0][0].detail).toEqual({ label: 'Beta', value: 'Beta' });
    el.remove();
  });

  it('preserves option DOM identity when equivalent options arrive in a new array', async () => {
    const el = await createComponent({ options });
    (el.shadowRoot.querySelector('.dropdown-trigger') as HTMLElement).click();
    await wait(20);

    const alpha = getOptionItem(el, 'Alpha');
    const beta = getOptionItem(el, 'Beta');

    el.options = options.map(option => ({ ...option }));
    await wait(20);

    expect(getOptionItem(el, 'Alpha')).toBe(alpha);
    expect(getOptionItem(el, 'Beta')).toBe(beta);
    el.remove();
  });

  it('moves existing option DOM nodes instead of recreating them when options reorder', async () => {
    const el = await createComponent({ options });
    (el.shadowRoot.querySelector('.dropdown-trigger') as HTMLElement).click();
    await wait(20);

    const alpha = getOptionItem(el, 'Alpha');
    const beta = getOptionItem(el, 'Beta');

    el.options = [options[1], options[0]];
    await wait(20);

    const reordered = getOptionItems(el);
    expect(reordered).toEqual([beta, alpha]);
    expect(reordered.map(item => item.textContent?.trim())).toEqual(['Beta', 'Alpha']);
    el.remove();
  });

  it('reuses retained option DOM nodes while adding and removing options', async () => {
    const el = await createComponent({ options });
    (el.shadowRoot.querySelector('.dropdown-trigger') as HTMLElement).click();
    await wait(20);

    const alpha = getOptionItem(el, 'Alpha');
    const beta = getOptionItem(el, 'Beta');

    el.options = [
      { label: 'Beta updated', value: 'beta' },
      { label: 'Gamma', value: 'gamma' },
    ];
    await wait(20);

    expect(getOptionItem(el, 'Beta updated')).toBe(beta);
    expect(getOptionItem(el, 'Gamma')).toBeTruthy();
    expect(alpha?.isConnected).toBe(false);
    el.remove();
  });

  it('warns and renders every option when duplicate values require fallback identities', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const el = await createComponent({
      options: [
        { label: 'First duplicate', value: 'duplicate' },
        { label: 'Second duplicate', value: 'duplicate' },
      ],
    });

    (el.shadowRoot.querySelector('.dropdown-trigger') as HTMLElement).click();
    await wait(20);

    expect(getOptionItems(el).map(item => item.textContent?.trim())).toEqual([
      'First duplicate',
      'Second duplicate',
    ]);
    expect(warn.mock.calls.some(([message]) =>
      String(message).includes('Duplicate identity "duplicate"'),
    )).toBe(true);

    el.remove();
    warn.mockRestore();
  });

  it('forwards aria-label to the trigger and option list', async () => {
    const el = await createComponent({ options, ariaLabel: 'Project' });
    const trigger = el.shadowRoot.querySelector('.dropdown-trigger') as HTMLElement;
    trigger.click();
    await wait(20);

    expect(trigger.getAttribute('aria-label')).toBe('Project');
    expect(el.shadowRoot.querySelector('[role="listbox"]').getAttribute('aria-label')).toBe('Project');
    el.remove();
  });

  it('renders leading trigger content through the icon-left slot', async () => {
    const el = document.createElement('q-dropdown') as any;
    const icon = document.createElement('span');
    icon.setAttribute('slot', 'icon-left');
    el.appendChild(icon);
    document.body.appendChild(el);
    await el.componentOnReady();

    const slot = el.shadowRoot.querySelector('slot[name="icon-left"]') as HTMLSlotElement;

    expect(slot).toBeTruthy();
    expect(slot.assignedElements()).toContain(icon);
    el.remove();
  });

  it('renders size="sm" without inline dynamic pixel width constraint on wrapper', async () => {
    const el = await createComponent({ size: 'sm', searchable: true, options });
    const wrapper = el.shadowRoot.querySelector('.dropdown-wrapper') as HTMLElement;

    expect(wrapper).toBeTruthy();
    expect(wrapper.classList.contains('size-sm')).toBe(true);
    expect(wrapper.style.width).toBe('');
    expect(wrapper.style.maxWidth).toBe('');
    el.remove();
  });
});
