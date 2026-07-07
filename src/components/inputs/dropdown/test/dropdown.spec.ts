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
});
