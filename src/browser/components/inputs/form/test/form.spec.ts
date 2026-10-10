import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';

defineCustomElements();

describe('q-form', () => {
  async function createComponent(html = '', props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-form');
    Object.assign(el, props);
    el.innerHTML = html;
    // Restore host identity after the mock custom-element innerHTML setter.
    for (const child of Array.from(el.childNodes) as Node[]) el.append(child);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  function dispatchEnter(control: any, shiftKey = false): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey, bubbles: true, composed: true, cancelable: true });
    control.dispatchEvent(event);
    return event;
  }

  it('hides empty header and actions regions', async () => {
    const el = await createComponent();

    expect(el.shadowRoot.querySelector('.form-header')?.classList.contains('is-hidden')).toBe(true);
    expect(el.shadowRoot.querySelector('.form-actions')?.classList.contains('is-hidden')).toBe(true);
    el.remove();
  });

  it('links the visible label to the native form accessible name', async () => {
    const el = await createComponent('', { label: 'Profile settings' });
    const title = el.shadowRoot.querySelector('.form-title') as HTMLHeadingElement;
    const form = el.shadowRoot.querySelector('form') as HTMLFormElement;

    expect(title.textContent).toBe('Profile settings');
    expect(form.getAttribute('aria-labelledby')).toBe(title.id);
    expect(el.shadowRoot.querySelector('.form-header')?.classList.contains('is-hidden')).toBe(false);
    el.remove();
  });

  it('reveals slotted header and action regions', async () => {
    const el = await createComponent(`
      <span slot="header">Account</span>
      <q-button slot="actions" type="submit">Save</q-button>
    `);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(el.shadowRoot.querySelector('.form-header')?.classList.contains('is-hidden')).toBe(false);
    expect(el.shadowRoot.querySelector('.form-actions')?.classList.contains('is-hidden')).toBe(false);
    el.remove();
  });

  it('collects named native input values on submit', async () => {
    const el = await createComponent('<input name="email" value="user@example.com" />');
    const handler = vi.fn();
    el.addEventListener('qSubmit', handler);

    const form = el.shadowRoot.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.values.email).toBe('user@example.com');
    el.remove();
  });

  it('gets and sets named control values through public methods', async () => {
    const el = await createComponent(`
      <input name="email" value="old@example.com" />
      <q-toggle name="enabled"></q-toggle>
    `);

    await el.setValues({ email: 'new@example.com', enabled: true });
    const input = el.querySelector('input') as HTMLInputElement;
    const toggle = el.querySelector('q-toggle') as any;
    const values = await el.getValues();

    expect(input.value).toBe('new@example.com');
    expect(toggle.checked).toBe(true);
    expect(values.email).toBe('new@example.com');
    expect(values.enabled).toBe(true);
    el.remove();
  });

  it('dispatches one native reset through resetForm', async () => {
    // Mock DOM has no native reset/default-value algorithm. The unchanged-value
    // assertion lives in form-reset-state.cmp.test.ts against the real browser.
    const el = await createComponent();
    const form = el.shadowRoot.querySelector('form') as HTMLFormElement;
    const prototype = form.ownerDocument.defaultView!.HTMLFormElement.prototype;
    const original = Object.getOwnPropertyDescriptor(prototype, 'reset');
    const nativeReset = vi.fn(function (this: HTMLFormElement) {
      this.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }));
    });
    Object.defineProperty(prototype, 'reset', { configurable: true, value: nativeReset });
    const handler = vi.fn();
    el.addEventListener('qReset', handler);

    try {
      await el.resetForm();
      expect(nativeReset).toHaveBeenCalledTimes(1);
      expect(nativeReset.mock.contexts[0]).toBe(form);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.originalEvent.type).toBe('reset');
    } finally {
      if (original) Object.defineProperty(prototype, 'reset', original);
      else Reflect.deleteProperty(prototype, 'reset');
      el.remove();
    }
  });

  it('submits the native form through submitForm', async () => {
    const el = await createComponent('<input name="email" value="user@example.com" />');
    const handler = vi.fn();
    el.addEventListener('qSubmit', handler);

    await el.submitForm();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.values.email).toBe('user@example.com');
    el.remove();
  });

  it('bridges slotted q-button submit clicks to the internal form', async () => {
    const el = await createComponent(`
      <input name="email" value="user@example.com" />
      <q-button slot="actions" type="submit">Save</q-button>
    `);
    const handler = vi.fn();
    el.addEventListener('qSubmit', handler);

    const button = el.querySelector('q-button') as any;
    await button.componentOnReady?.();
    button.shadowRoot.querySelector('button').click();
    await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.values.email).toBe('user@example.com');
    el.remove();
  });

  it('does not include readonly syntax boxes in submitted values', async () => {
    const el = await createComponent('<q-syntax-box name="example" code="const a = 1;"></q-syntax-box>');
    const handler = vi.fn();
    el.addEventListener('qSubmit', handler);

    const form = el.shadowRoot.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.values.example).toBeUndefined();
    el.remove();
  });

  it('moves focus to the next text control when enterBehavior is focus-next', async () => {
    const el = await createComponent(`
      <q-input name="email"></q-input>
      <q-input name="password"></q-input>
    `);
    el.enterBehavior = 'focus-next';

    const [email, password] = Array.from(el.querySelectorAll('q-input')) as any[];
    await email.componentOnReady?.();
    await password.componentOnReady?.();
    await email.focusElement?.();

    const focusPassword = vi.spyOn(password, 'focusElement');
    const event = dispatchEnter(email);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(event.defaultPrevented).toBe(true);
    expect(focusPassword).toHaveBeenCalledTimes(1);
    el.remove();
  });

  it('moves focus to the previous text control on Shift+Enter', async () => {
    const el = await createComponent(`
      <q-input name="email"></q-input>
      <q-input name="password"></q-input>
    `);
    el.enterBehavior = 'focus-next';

    const [email, password] = Array.from(el.querySelectorAll('q-input')) as any[];
    await email.componentOnReady?.();
    await password.componentOnReady?.();
    await password.focusElement?.();

    const focusEmail = vi.spyOn(email, 'focusElement');
    const event = dispatchEnter(password, true);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(event.defaultPrevented).toBe(true);
    expect(focusEmail).toHaveBeenCalledTimes(1);
    el.remove();
  });

  it('submits when Enter is pressed on the last text control', async () => {
    const el = await createComponent(`
      <q-input name="email" value="user@example.com"></q-input>
      <q-input name="password" value="secret"></q-input>
    `);
    el.enterBehavior = 'focus-next';
    const handler = vi.fn();
    el.addEventListener('qSubmit', handler);

    const password = el.querySelectorAll('q-input')[1] as any;
    await password.componentOnReady?.();
    await password.focusElement?.();
    const event = dispatchEnter(password);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(event.defaultPrevented).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.values.email).toBe('user@example.com');
    expect(handler.mock.calls[0][0].detail.values.password).toBe('secret');
    el.remove();
  });

  it('prevents Enter submit when enterBehavior is none', async () => {
    const el = await createComponent('<q-input name="email" value="user@example.com"></q-input>');
    el.enterBehavior = 'none';
    const handler = vi.fn();
    el.addEventListener('qSubmit', handler);

    const input = el.querySelector('q-input') as any;
    await input.componentOnReady?.();
    await input.focusElement?.();
    const event = dispatchEnter(input);
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(event.defaultPrevented).toBe(true);
    expect(handler).not.toHaveBeenCalled();
    el.remove();
  });

  it('does not intercept Enter from non-input custom controls', async () => {
    const el = await createComponent(`
      <q-quantity-selector name="qty" value="1"></q-quantity-selector>
      <q-input name="next"></q-input>
    `);
    el.enterBehavior = 'focus-next';

    const quantity = el.querySelector('q-quantity-selector') as any;
    await quantity.componentOnReady?.();
    const event = dispatchEnter(quantity);

    expect(event.defaultPrevented).toBe(false);
    el.remove();
  });
});
