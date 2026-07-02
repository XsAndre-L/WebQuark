import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-form', () => {
  async function createComponent(html = ''): Promise<any> {
    const el = document.createElement('q-form');
    el.innerHTML = html;
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
    await new Promise(resolve => setTimeout(resolve, 10));

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
});
