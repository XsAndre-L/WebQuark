import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
import { hasAssignedSlotContent } from '../input.utils';

defineCustomElements();

describe('q-input', () => {
  async function createComponent(props: Record<string, any> = {}, children: HTMLElement[] = []): Promise<any> {
    const el = document.createElement('q-input');
    Object.assign(el, props);
    children.forEach(child => el.appendChild(child));
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await wait(50);
    }
    await wait();
    return el;
  }

  function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  it('renders custom spinner panel only when type is number and is not disabled', async () => {
    const elText = await createComponent({ type: 'text' });
    expect(elText.shadowRoot.querySelector('.input-spinners')).toBeNull();
    elText.remove();

    const elNum = await createComponent({ type: 'number' });
    expect(elNum.shadowRoot.querySelector('.input-spinners')).not.toBeNull();
    elNum.remove();

    const elDisabled = await createComponent({ type: 'number', disabled: true });
    expect(elDisabled.shadowRoot.querySelector('.input-spinners')).toBeNull();
    elDisabled.remove();
  });

  it('labels and disables numeric spinner buttons at bounds', async () => {
    const el = await createComponent({ type: 'number', value: '10', min: 0, max: 10 });

    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;
    const upBtn = el.shadowRoot.querySelector('.spinner-up') as HTMLButtonElement;
    const downBtn = el.shadowRoot.querySelector('.spinner-down') as HTMLButtonElement;

    expect(input.getAttribute('role')).toBe('spinbutton');
    expect(input.getAttribute('aria-valuenow')).toBe('10');
    expect(input.getAttribute('aria-valuemin')).toBe('0');
    expect(input.getAttribute('aria-valuemax')).toBe('10');
    expect(upBtn.getAttribute('aria-label')).toBe('Increase value');
    expect(downBtn.getAttribute('aria-label')).toBe('Decrease value');
    expect(upBtn.hasAttribute('tabindex')).toBe(false);
    expect(upBtn.hasAttribute('disabled')).toBe(true);
    expect(downBtn.hasAttribute('disabled')).toBe(false);
    expect(upBtn.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');

    el.remove();
  });

  it('increments and decrements with custom buttons', async () => {
    const el = await createComponent({ type: 'number', value: '10', step: 5, min: 0, max: 20 });

    const upBtn = el.shadowRoot.querySelector('.spinner-up') as HTMLButtonElement;
    const downBtn = el.shadowRoot.querySelector('.spinner-down') as HTMLButtonElement;

    upBtn.click();
    await wait();
    expect(el.value).toBe('15');

    upBtn.click();
    await wait();
    expect(el.value).toBe('20');

    upBtn.click();
    await wait();
    expect(el.value).toBe('20');

    downBtn.click();
    await wait();
    expect(el.value).toBe('15');

    el.remove();
  });

  it('clamps manually typed values on blur', async () => {
    const el = await createComponent({ type: 'number', value: '50', min: 10, max: 30 });

    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;

    input.dispatchEvent(new Event('blur'));
    await wait();
    expect(el.value).toBe('30');

    el.value = '5';
    input.dispatchEvent(new Event('blur'));
    await wait();
    expect(el.value).toBe('10');

    el.remove();
  });

  it('clears the value and emits input/change events', async () => {
    const el = await createComponent({ clearable: true, value: 'hello' });
    const inputHandler = vi.fn();
    const changeHandler = vi.fn();
    el.addEventListener('qInput', inputHandler);
    el.addEventListener('qChange', changeHandler);

    const clearBtn = el.shadowRoot.querySelector('.clear-btn') as HTMLButtonElement;
    clearBtn.click();
    await wait();

    expect(el.value).toBe('');
    expect(inputHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(inputHandler.mock.calls[0][0].detail).toBe('');

    el.remove();
  });

  it('toggles password visibility while preserving the button state', async () => {
    const el = await createComponent({ type: 'password', value: 'secret' });

    const toggle = el.shadowRoot.querySelector('.password-toggle-btn') as HTMLButtonElement;
    expect((el.shadowRoot.querySelector('input') as HTMLInputElement).type).toBe('password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    toggle.click();
    await wait(20);

    expect((el.shadowRoot.querySelector('input') as HTMLInputElement).type).toBe('text');
    expect((el.shadowRoot.querySelector('.password-toggle-btn') as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true');

    el.remove();
  });

  it('detects assigned prefix and suffix slot content', () => {
    const assigned = [document.createElement('span')];
    const emptySlot = { assignedNodes: vi.fn(() => []) } as unknown as HTMLSlotElement;
    const filledSlot = { assignedNodes: vi.fn(() => assigned) } as unknown as HTMLSlotElement;

    expect(hasAssignedSlotContent(filledSlot)).toBe(true);
    expect(filledSlot.assignedNodes).toHaveBeenCalledWith({ flatten: true });
    expect(hasAssignedSlotContent(emptySlot)).toBe(false);
  });

  it('renders required disabled and error states on the native input', async () => {
    const el = await createComponent({ disabled: true, required: true, errorMessage: 'Required' });
    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;
    const error = el.shadowRoot.querySelector('#q-field-error') as HTMLElement;

    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('q-field-error');
    expect(error.textContent).toBe('Required');

    el.remove();
  });

  it('forwards aria-label to the native input', async () => {
    const el = await createComponent({ ariaLabel: 'Search products' });
    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;

    expect(input.getAttribute('aria-label')).toBe('Search products');
    el.remove();
  });

  it('restores the initial value on form reset', async () => {
    const form = document.createElement('form');
    const el = document.createElement('q-input') as any;
    el.value = 'initial';
    form.appendChild(el);
    document.body.appendChild(form);

    if (typeof el.componentOnReady === 'function') {
      await el.componentOnReady();
    } else {
      await wait(50);
    }

    el.value = 'changed';
    el.formResetCallback();

    expect(el.value).toBe('initial');

    form.remove();
  });
});
