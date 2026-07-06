import { expect, describe, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../dist/loader';

defineCustomElements();

describe('q-input-spinner', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-input');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('renders custom spinner panel only when type is number and is not disabled', async () => {
    // case 1: type=text -> no spinner
    const elText = await createComponent({ type: 'text' });
    expect(elText.shadowRoot.querySelector('.input-spinners')).toBeNull();
    elText.remove();

    // case 2: type=number -> spinner is visible
    const elNum = await createComponent({ type: 'number' });
    expect(elNum.shadowRoot.querySelector('.input-spinners')).not.toBeNull();
    elNum.remove();

    // case 3: type=number and disabled=true -> spinner is not rendered
    const elDisabled = await createComponent({ type: 'number', disabled: true });
    expect(elDisabled.shadowRoot.querySelector('.input-spinners')).toBeNull();
    elDisabled.remove();
  });

  it('increments/decrements correctly using custom buttons and step props', async () => {
    const el = await createComponent({ type: 'number', value: '10', step: 5, min: 0, max: 20 });
    
    const upBtn = el.shadowRoot.querySelector('.spinner-up') as HTMLButtonElement;
    const downBtn = el.shadowRoot.querySelector('.spinner-down') as HTMLButtonElement;

    // Increment 10 + 5 = 15
    upBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe('15');

    // Increment 15 + 5 = 20
    upBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe('20');

    // Increment at max remains 20
    upBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe('20');

    // Decrement 20 - 5 = 15
    downBtn.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.value).toBe('15');
    
    el.remove();
  });

  it('clamps manually typed values on blur', async () => {
    const el = await createComponent({ type: 'number', value: '50', min: 10, max: 30 });
    
    const input = el.shadowRoot.querySelector('input') as HTMLInputElement;

    // Trigger blur on input
    input.dispatchEvent(new Event('blur'));
    await new Promise(resolve => setTimeout(resolve, 10));

    // Value 50 should clamp to max (30)
    expect(el.value).toBe('30');

    // Change value to 5 (less than min 10)
    el.value = '5';
    input.dispatchEvent(new Event('blur'));
    await new Promise(resolve => setTimeout(resolve, 10));

    // Value 5 should clamp to min (10)
    expect(el.value).toBe('10');

    el.remove();
  });
});
