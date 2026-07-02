import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../dist/loader';

defineCustomElements();

describe('q-syntax-box', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-syntax-box');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('renders code template in view mode', async () => {
    const el = await createComponent({ code: 'const a = 1;', editable: false });
    expect(el.shadowRoot.querySelector('pre')).not.toBeNull();
    expect(el.shadowRoot.querySelector('textarea')).toBeNull();
    el.remove();
  });

  it('renders textarea and scroll elements in editable mode', async () => {
    const el = await createComponent({ code: 'const a = 1;', editable: true });
    expect(el.shadowRoot.querySelector('.editor-area')).not.toBeNull();
    expect(el.shadowRoot.querySelector('textarea')).not.toBeNull();
    expect(el.shadowRoot.querySelector('pre')).not.toBeNull();
    el.remove();
  });

  it('emits input events and updates value when typing', async () => {
    const el = await createComponent({ code: 'const a = 1;', editable: true });
    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;

    const inputHandler = vi.fn();
    const changeHandler = vi.fn();
    el.addEventListener('qInput', inputHandler);
    el.addEventListener('qChange', changeHandler);

    textarea.value = 'const b = 2;';
    textarea.dispatchEvent(new Event('input'));
    textarea.dispatchEvent(new Event('change'));

    expect(el.code).toBe('const b = 2;');
    expect(inputHandler).toHaveBeenCalledTimes(1);
    expect(inputHandler.mock.calls[0][0].detail).toBe('const b = 2;');
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail).toBe('const b = 2;');

    el.remove();
  });

  it('resets editable code to the initial value', async () => {
    const el = await createComponent({ code: 'const a = 1;', editable: true });
    el.code = 'const b = 2;';
    el.value = 'const b = 2;';

    el.formResetCallback();

    expect(el.code).toBe('const a = 1;');
    expect(el.value).toBe('const a = 1;');
    el.remove();
  });

  it('formats code when clicking format button', async () => {
    const el = await createComponent({ code: '{"a":1}', editable: true, language: 'json' });
    const formatBtn = el.shadowRoot.querySelector('.format-btn') as HTMLElement;

    const changeHandler = vi.fn();
    el.addEventListener('qChange', changeHandler);

    formatBtn.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(el.code).toContain('  "a": 1');
    expect(changeHandler).toHaveBeenCalledTimes(1);

    el.remove();
  });
});

