import { expect, describe, it } from 'vitest';
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
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('renders with default values', async () => {
    const el = await createComponent();
    expect(el.value).toBe(0);
    expect(el.step).toBe(1);
    expect(el.variant).toBe('horizontal');
    el.remove();
  });

  it('respects min and max boundaries when incrementing/decrementing', async () => {
    const el = await createComponent({ value: 5, min: 2, max: 7 });

    const decBtn = el.shadowRoot.querySelector('.quantity-btn-decrement') as HTMLButtonElement;
    const incBtn = el.shadowRoot.querySelector('.quantity-btn-increment') as HTMLButtonElement;

    // Increment should work up to max
    incBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe(6);

    incBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe(7);

    // Increment at max should not exceed max
    incBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe(7);

    // Decrement should work down to min
    decBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe(6);

    decBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe(5);

    decBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe(4);

    decBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe(3);

    decBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe(2);

    // Decrement at min should not go below min
    decBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe(2);
    
    el.remove();
  });

  it('respects step values', async () => {
    const el = await createComponent({ value: 10, step: 5 });

    const incBtn = el.shadowRoot.querySelector('.quantity-btn-increment') as HTMLButtonElement;
    const decBtn = el.shadowRoot.querySelector('.quantity-btn-decrement') as HTMLButtonElement;

    incBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe(15);

    decBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
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
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(emittedValue).toBe(6);
    el.remove();
  });

  it('calculates width dynamically when min and max are missing', async () => {
    const el = await createComponent({ value: 100 });

    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;
    expect(input.style.width).toBe('calc(3 * var(--q-quantity-selector-char-width, 1ch) + var(--q-quantity-selector-input-padding, 16px))');

    // Update value to a 5-digit number
    el.value = 12345;
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(input.style.width).toBe('calc(5 * var(--q-quantity-selector-char-width, 1ch) + var(--q-quantity-selector-input-padding, 16px))');
    
    el.remove();
  });

  it('calculates width statically when min/max are set', async () => {
    const el = await createComponent({ value: 5, min: 1, max: 1000 });

    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;
    expect(input.style.width).toBe('calc(4 * var(--q-quantity-selector-char-width, 1ch) + var(--q-quantity-selector-input-padding, 16px))');

    // Update value to 10 -> width should NOT change (still 4)
    el.value = 10;
    await new Promise(resolve => setTimeout(resolve, 10));
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
