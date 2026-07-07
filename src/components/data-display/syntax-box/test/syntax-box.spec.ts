import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';
import { getSyntaxBoxEditorKeyAction } from '../syntax-box.utils';

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

  function mockClipboard(writeText: any) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    return () => {
      if (originalDescriptor) {
        Object.defineProperty(navigator, 'clipboard', originalDescriptor);
      } else {
        delete (navigator as any).clipboard;
      }
    };
  }

  function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  it('syncs value-only initialization into code', async () => {
    const el = await createComponent({ value: 'const a = 1;' });

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

  it('copies code and clears copied state after the timeout', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const restoreClipboard = mockClipboard(writeText);
    const el = await createComponent({ code: 'const a = 1;', copyable: true });

    try {
      const copyBtn = el.shadowRoot.querySelector('.panel-actions q-button:not(.format-btn)') as HTMLElement;
      copyBtn.click();
      await wait(20);

      expect(writeText).toHaveBeenCalledWith('const a = 1;');
      let tooltip = el.shadowRoot.querySelector('.panel-actions q-button:not(.format-btn) q-tooltip') as any;
      expect(tooltip.content || tooltip.getAttribute('content')).toBe('Copied!');

      await wait(1550);

      tooltip = el.shadowRoot.querySelector('.panel-actions q-button:not(.format-btn) q-tooltip') as any;
      expect(tooltip.content || tooltip.getAttribute('content')).toBe('Copy');
    } finally {
      restoreClipboard();
      el.remove();
    }
  });

  it('surfaces clipboard failures without an unhandled rejection', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const restoreClipboard = mockClipboard(writeText);
    const el = await createComponent({ code: 'const a = 1;', copyable: true });

    try {
      const copyBtn = el.shadowRoot.querySelector('.panel-actions q-button:not(.format-btn)') as HTMLElement;
      copyBtn.click();
      await wait(20);

      expect(writeText).toHaveBeenCalledTimes(1);
      const tooltip = el.shadowRoot.querySelector('.panel-actions q-button:not(.format-btn) q-tooltip') as any;
      expect(tooltip.content || tooltip.getAttribute('content')).toBe('Copy failed');
    } finally {
      restoreClipboard();
      el.remove();
    }
  });

  it('does not copy or format while disabled', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const restoreClipboard = mockClipboard(writeText);
    const el = await createComponent({ code: '{"a":1}', editable: true, language: 'json', copyable: true, disabled: true });
    const originalCode = el.code;

    const formatBtn = el.shadowRoot.querySelector('.format-btn') as HTMLElement;
    const copyBtn = el.shadowRoot.querySelector('.panel-actions q-button:not(.format-btn)') as HTMLElement;
    formatBtn.click();
    copyBtn.click();
    await Promise.resolve();

    expect(writeText).not.toHaveBeenCalled();
    expect(el.code).toBe(originalCode);

    restoreClipboard();
    el.remove();
  });

  it('delegates scrollToBottom to q-scrollable in read-only scroll mode', async () => {
    const el = await createComponent({ code: 'line 1\nline 2', height: '20px' });
    const scrollable = el.shadowRoot.querySelector('q-scrollable') as any;

    expect(scrollable).not.toBeNull();
    await el.scrollToBottom();
    el.remove();
  });

  it('renders the plain variant without a panel header', async () => {
    const el = await createComponent({ code: 'const a = 1;', variant: 'plain' });

    expect(el.shadowRoot.querySelector('.plain-container')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.panel-header')).toBeNull();
    el.remove();
  });

  it('renders language-specific highlighting output', async () => {
    const el = await createComponent({ code: '<div class="x">1</div>', language: 'html' });

    expect(el.shadowRoot.querySelector('.code-tag')?.textContent).toContain('div');
    expect(el.shadowRoot.querySelector('.code-attr')?.textContent).toContain('class');
    el.remove();
  });

  it('exposes an editable keyboard hint for leaving the code editor', async () => {
    const el = await createComponent({ code: 'const a = 1;', editable: true });
    const textarea = el.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;
    const hint = el.shadowRoot.querySelector('#syntax-box-keyboard-help') as HTMLElement;

    expect(textarea.getAttribute('aria-describedby')).toBe('syntax-box-keyboard-help');
    expect(hint.textContent).toContain('Escape');
    el.remove();
  });

  it('resolves editor keyboard actions without trapping modified Tab', () => {
    const baseEvent = { key: 'Tab', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };

    expect(getSyntaxBoxEditorKeyAction(baseEvent, 'const a = 1;', 0, 0)).toEqual({
      type: 'indent',
      value: '  const a = 1;',
      caret: 2,
    });

    expect(getSyntaxBoxEditorKeyAction({ ...baseEvent, shiftKey: true }, 'const a = 1;', 0, 0)).toEqual({ type: 'none' });
    expect(getSyntaxBoxEditorKeyAction({ ...baseEvent, key: 'Escape' }, 'const a = 1;', 0, 0)).toEqual({ type: 'blur' });
  });
});

