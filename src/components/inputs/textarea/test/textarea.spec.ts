import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-textarea', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-textarea');
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

  function setScrollHeight(el: HTMLTextAreaElement, value: number) {
    Object.defineProperty(el, 'scrollHeight', {
      configurable: true,
      value
    });
  }

  it('renders value label and validation state', async () => {
    const el = await createComponent({ label: 'Notes', value: 'hello', required: true, errorMessage: 'Required' });
    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;
    const label = el.shadowRoot.querySelector('.textarea-label') as HTMLLabelElement;
    const error = el.shadowRoot.querySelector('#q-field-error') as HTMLElement;

    expect(label.textContent).toBe('Notes');
    expect(el.value).toBe('hello');
    expect(textarea.hasAttribute('required')).toBe(true);
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.getAttribute('aria-describedby')).toBe('q-field-error');
    expect(error.textContent).toBe('Required');

    el.remove();
  });

  it('uses placeholder as an accessible name when label is omitted', async () => {
    const el = await createComponent({ placeholder: 'Enter notes' });
    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea.getAttribute('aria-label')).toBe('Enter notes');

    el.remove();
  });

  it('does not add fallback aria-label when a visible label is present', async () => {
    const el = await createComponent({ label: 'Description', placeholder: 'Enter description' });
    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea.getAttribute('aria-label')).toBeNull();

    el.remove();
  });

  it('prefers an explicit aria-label over the placeholder fallback', async () => {
    const el = await createComponent({ ariaLabel: 'Private notes', placeholder: 'Enter notes' });
    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea.getAttribute('aria-label')).toBe('Private notes');
    el.remove();
  });

  it('emits input change focus blur and click events', async () => {
    const el = await createComponent({ value: 'old' });
    const inputHandler = vi.fn();
    const changeHandler = vi.fn();
    const focusHandler = vi.fn();
    const blurHandler = vi.fn();
    const clickHandler = vi.fn();
    el.addEventListener('qInput', inputHandler);
    el.addEventListener('qChange', changeHandler);
    el.addEventListener('qFocus', focusHandler);
    el.addEventListener('qBlur', blurHandler);
    el.addEventListener('qClick', clickHandler);

    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'new';
    textarea.dispatchEvent(new Event('input'));
    textarea.dispatchEvent(new Event('change'));
    textarea.dispatchEvent(new FocusEvent('focus'));
    textarea.dispatchEvent(new FocusEvent('blur'));
    textarea.click();
    await wait();

    expect(el.value).toBe('new');
    expect(inputHandler).toHaveBeenCalledTimes(1);
    expect(inputHandler.mock.calls[0][0].detail).toBe('new');
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(focusHandler).toHaveBeenCalledTimes(1);
    expect(blurHandler).toHaveBeenCalledTimes(1);
    expect(clickHandler).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it('restores the initial value on form reset', async () => {
    const form = document.createElement('form');
    const el = document.createElement('q-textarea') as any;
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

  it('includes border height when auto-growing a border-box textarea', async () => {
    const el = await createComponent({ resizeMode: 'auto', autoGrow: true });
    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;
    const getComputedStyleMock = vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
      borderTopWidth: '2px',
      borderBottomWidth: '3px'
    } as CSSStyleDeclaration);
    setScrollHeight(textarea, 72);

    try {
      await el.adjustHeight();

      expect(textarea.style.height).toBe('77px');
    } finally {
      getComputedStyleMock.mockRestore();
      el.remove();
    }
  });

  it('skips auto-grow height changes in manual resize mode', async () => {
    const el = await createComponent({ resizeMode: 'manual' });
    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;
    textarea.style.height = '24px';
    setScrollHeight(textarea, 72);

    await el.adjustHeight();

    expect(textarea.classList.contains('resize-manual')).toBe(true);
    expect(textarea.style.height).toBe('24px');

    el.remove();
  });

  it('treats auto resize as fixed when autoGrow is false', async () => {
    const el = await createComponent({ resizeMode: 'auto', autoGrow: false });
    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;
    textarea.style.height = '24px';
    setScrollHeight(textarea, 72);

    await el.adjustHeight();

    expect(textarea.classList.contains('resize-manual')).toBe(false);
    expect(textarea.style.height).toBe('24px');

    el.remove();
  });

  it('recalculates height when resize mode changes to auto', async () => {
    const el = await createComponent({ resizeMode: 'manual' });
    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;
    textarea.style.borderTopWidth = '0';
    textarea.style.borderBottomWidth = '0';
    setScrollHeight(textarea, 84);

    el.resizeMode = 'auto';
    await wait(20);

    expect(textarea.style.height).toBe('84px');

    el.remove();
  });
});
