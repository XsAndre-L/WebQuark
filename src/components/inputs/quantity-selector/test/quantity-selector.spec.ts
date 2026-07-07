import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-quantity-selector', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-quantity-selector');
    Object.assign(el, props);
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

  it('renders with default values', async () => {
    const el = await createComponent();
    expect(el.value).toBe(0);
    expect(el.step).toBe(1);
    expect(el.variant).toBe('horizontal');
    el.remove();
  });

  it('adds spinbutton semantics to the editable value', async () => {
    const el = await createComponent({ value: 5, min: 2, max: 7 });
    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;

    expect(input.getAttribute('role')).toBe('spinbutton');
    expect(input.getAttribute('aria-valuenow')).toBe('5');
    expect(input.getAttribute('aria-valuemin')).toBe('2');
    expect(input.getAttribute('aria-valuemax')).toBe('7');
    expect(input.getAttribute('aria-label')).toBe('Quantity');

    el.remove();
  });

  it('normalizes non-finite values to a safe input display', async () => {
    const el = await createComponent({ value: Number.NaN });
    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('0');
    expect(input.getAttribute('aria-valuenow')).toBeNull();

    el.value = Number.NaN;
    await wait();
    expect(input.value).toBe('0');

    el.remove();
  });

  it('respects min and max boundaries when incrementing/decrementing', async () => {
    const el = await createComponent({ value: 5, min: 2, max: 7 });

    const decBtn = el.shadowRoot.querySelector('.quantity-btn-decrement') as HTMLButtonElement;
    const incBtn = el.shadowRoot.querySelector('.quantity-btn-increment') as HTMLButtonElement;

    incBtn.click();
    await wait();
    expect(el.value).toBe(6);

    incBtn.click();
    await wait();
    expect(el.value).toBe(7);

    incBtn.click();
    await wait();
    expect(el.value).toBe(7);

    decBtn.click();
    await wait();
    expect(el.value).toBe(6);

    decBtn.click();
    await wait();
    expect(el.value).toBe(5);

    decBtn.click();
    await wait();
    expect(el.value).toBe(4);

    decBtn.click();
    await wait();
    expect(el.value).toBe(3);

    decBtn.click();
    await wait();
    expect(el.value).toBe(2);

    decBtn.click();
    await wait();
    expect(el.value).toBe(2);

    el.remove();
  });

  it('respects step values', async () => {
    const el = await createComponent({ value: 10, step: 5 });

    const incBtn = el.shadowRoot.querySelector('.quantity-btn-increment') as HTMLButtonElement;
    const decBtn = el.shadowRoot.querySelector('.quantity-btn-decrement') as HTMLButtonElement;

    incBtn.click();
    await wait();
    expect(el.value).toBe(15);

    decBtn.click();
    await wait();
    expect(el.value).toBe(10);

    el.remove();
  });

  it('emits qChange custom event when value changes via buttons', async () => {
    const el = await createComponent({ value: 5 });

    let emittedValue: number | undefined;
    el.addEventListener('qChange', (event: any) => {
      emittedValue = event.detail;
    });

    const incBtn = el.shadowRoot.querySelector('.quantity-btn-increment') as HTMLButtonElement;
    incBtn.click();
    await wait();

    expect(emittedValue).toBe(6);
    el.remove();
  });

  it('sanitizes direct input and updates value when in bounds', async () => {
    const el = await createComponent({ value: 0, min: 0, max: 100 });
    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;

    input.value = '1a-2.3.4';
    input.dispatchEvent(new Event('input'));
    await wait();

    expect(input.value).toBe('12.34');
    expect(el.value).toBe(12.34);

    el.remove();
  });

  it('reconciles out-of-range typed values on blur', async () => {
    const el = await createComponent({ value: 5, min: 0, max: 10 });
    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;

    input.value = '99';
    input.dispatchEvent(new Event('input'));
    await wait();
    expect(el.value).toBe(5);

    input.dispatchEvent(new FocusEvent('blur'));
    await wait();

    expect(el.value).toBe(10);
    expect(input.value).toBe('10');

    el.remove();
  });

  it('emits focus blur and click events', async () => {
    const el = await createComponent({ value: 1 });
    const focusHandler = vi.fn();
    const blurHandler = vi.fn();
    const clickHandler = vi.fn();
    el.addEventListener('qFocus', focusHandler);
    el.addEventListener('qBlur', blurHandler);
    el.addEventListener('qClick', clickHandler);

    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;
    const wrapper = el.shadowRoot.querySelector('.quantity-selector') as HTMLElement;

    input.dispatchEvent(new FocusEvent('focus'));
    input.dispatchEvent(new FocusEvent('blur'));
    wrapper.click();
    await wait();

    expect(focusHandler).toHaveBeenCalledTimes(1);
    expect(blurHandler).toHaveBeenCalledTimes(1);
    expect(clickHandler).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it('renders increment before decrement in vertical variant', async () => {
    const el = await createComponent({ variant: 'vertical' });
    const buttons = Array.from(el.shadowRoot.querySelectorAll('.quantity-btn')) as HTMLButtonElement[];

    expect(buttons[0].classList.contains('quantity-btn-increment')).toBe(true);
    expect(buttons[1].classList.contains('quantity-btn-decrement')).toBe(true);

    el.remove();
  });

  it('calculates width dynamically when min and max are missing', async () => {
    const el = await createComponent({ value: 100 });

    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;
    expect(input.style.width).toBe('calc(3 * var(--q-quantity-selector-char-width, 1ch) + var(--q-quantity-selector-input-padding, 16px))');

    el.value = 12345;
    await wait();
    expect(input.style.width).toBe('calc(5 * var(--q-quantity-selector-char-width, 1ch) + var(--q-quantity-selector-input-padding, 16px))');

    el.remove();
  });

  it('calculates width statically when min/max are set', async () => {
    const el = await createComponent({ value: 5, min: 1, max: 1000 });

    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;
    expect(input.style.width).toBe('calc(4 * var(--q-quantity-selector-char-width, 1ch) + var(--q-quantity-selector-input-padding, 16px))');

    el.value = 10;
    await wait();
    expect(input.style.width).toBe('calc(4 * var(--q-quantity-selector-char-width, 1ch) + var(--q-quantity-selector-input-padding, 16px))');

    el.remove();
  });

  it('handles negative min value character count correctly including the minus sign', async () => {
    const el = await createComponent({ value: 0, min: -100, max: 50 });

    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;
    expect(input.style.width).toBe('calc(4 * var(--q-quantity-selector-char-width, 1ch) + var(--q-quantity-selector-input-padding, 16px))');

    el.remove();
  });
});
