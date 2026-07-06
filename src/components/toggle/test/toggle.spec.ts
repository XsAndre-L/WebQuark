import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../dist/loader';

defineCustomElements();

describe('q-toggle', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-toggle');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('renders default switch structure', async () => {
    const el = await createComponent();
    expect(el.shadowRoot.querySelector('.toggle-wrapper')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.switch-track')).not.toBeNull();
    el.remove();
  });

  it('toggles checked state and emits qChange on click', async () => {
    const el = await createComponent({ checked: false });
    const wrapper = el.shadowRoot.querySelector('.toggle-wrapper') as HTMLElement;
    
    const handler = vi.fn();
    el.addEventListener('qChange', handler);

    wrapper.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(el.checked).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toBe(true);

    wrapper.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(el.checked).toBe(false);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[1][0].detail).toBe(false);

    el.remove();
  });

  it('does not toggle or emit qChange when disabled', async () => {
    const el = await createComponent({ checked: false, disabled: true });
    const wrapper = el.shadowRoot.querySelector('.toggle-wrapper') as HTMLElement;
    
    const handler = vi.fn();
    el.addEventListener('qChange', handler);

    wrapper.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(el.checked).toBe(false);
    expect(handler).not.toHaveBeenCalled();

    el.remove();
  });
});
