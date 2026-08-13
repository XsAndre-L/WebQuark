import { afterEach, describe, expect, it, vi } from 'vitest';

import '../../../inputs/input/input';
import '../../../inputs/textarea/textarea';
import '../../../inputs/toggle/toggle';
import '../form';

async function nextFrame(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

async function createForm(
  html: string,
  props: Partial<HTMLQFormElement> = {},
): Promise<HTMLQFormElement> {
  const element = document.createElement('q-form');
  Object.assign(element, props);
  element.innerHTML = html;
  document.body.append(element);
  await Promise.all([
    customElements.whenDefined('q-form'),
    customElements.whenDefined('q-input'),
    customElements.whenDefined('q-textarea'),
    customElements.whenDefined('q-toggle'),
  ]);
  await nextFrame();
  await nextFrame();
  return element;
}

describe('q-form form association in Chromium', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('bridges slotted controls across the internal shadow-form boundary', async () => {
    const element = await createForm(
      '<q-input name="email" value="user@example.com"></q-input>',
    );
    const input = element.querySelector('q-input');
    const nativeForm = element.shadowRoot?.querySelector('form');
    const handler = vi.fn();
    element.addEventListener('qSubmit', handler);

    expect(nativeForm?.elements.namedItem('email')).toBeNull();
    expect(input).toBeTruthy();

    await element.submitForm();
    await nextFrame();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.formData.get('email')).toBe(
      'user@example.com',
    );
  });

  it('blocks submit while a required q-input is empty', async () => {
    const element = await createForm(`
      <q-input name="email" label="Email" required></q-input>
      <button slot="actions" type="submit">Continue</button>
    `);
    const handler = vi.fn();
    element.addEventListener('qSubmit', handler);

    await element.submitForm();
    await nextFrame();

    expect(handler).not.toHaveBeenCalled();
    expect(
      element.querySelector('q-input')?.matches(':invalid'),
    ).toBe(true);
  });

  it('validates required native controls slotted across the shadow boundary', async () => {
    const element = await createForm(
      '<input name="email" aria-label="Email" required />',
    );
    const input = element.querySelector('input') as HTMLInputElement;
    const handler = vi.fn();
    element.addEventListener('qSubmit', handler);

    await element.submitForm();
    await nextFrame();
    expect(handler).not.toHaveBeenCalled();

    input.value = 'user@example.com';
    await element.submitForm();
    await nextFrame();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.formData.get('email')).toBe(
      'user@example.com',
    );
  });

  it('submits required input and textarea values after they become valid', async () => {
    const element = await createForm(`
      <q-input name="email" label="Email" required></q-input>
      <q-textarea name="notes" label="Notes" required></q-textarea>
    `);
    const input = element.querySelector('q-input') as HTMLQInputElement;
    const textarea = element.querySelector('q-textarea') as HTMLQTextareaElement;
    input.value = 'user@example.com';
    textarea.value = 'Ready to submit';
    await nextFrame();
    const handler = vi.fn();
    element.addEventListener('qSubmit', handler);

    await element.submitForm();

    expect(handler).toHaveBeenCalledTimes(1);
    const detail = handler.mock.calls[0][0].detail;
    expect(detail.formData.get('email')).toBe('user@example.com');
    expect(detail.formData.get('notes')).toBe('Ready to submit');
    expect(detail.values).toMatchObject({
      email: 'user@example.com',
      notes: 'Ready to submit',
    });
  });

  it('blocks submit while a required toggle is unchecked', async () => {
    const element = await createForm(
      '<q-toggle name="terms" label="Accept terms" required></q-toggle>',
    );
    const handler = vi.fn();
    element.addEventListener('qSubmit', handler);

    await element.submitForm();
    await nextFrame();
    expect(handler).not.toHaveBeenCalled();

    const toggle = element.querySelector('q-toggle') as HTMLQToggleElement;
    toggle.checked = true;
    await nextFrame();
    await element.submitForm();
    await nextFrame();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.formData.get('terms')).toBe('true');
  });

  it('treats a component error message as a custom validity error', async () => {
    const element = await createForm(
      '<q-input name="email" value="user@example.com"></q-input>',
    );
    const input = element.querySelector('q-input') as HTMLQInputElement;
    input.errorMessage = 'That account is unavailable.';
    await nextFrame();

    expect(await input.checkValidity()).toBe(false);
    expect(input.matches(':invalid')).toBe(true);

    input.errorMessage = undefined;
    await nextFrame();

    expect(await input.checkValidity()).toBe(true);
    expect(input.matches(':valid')).toBe(true);
  });

  it('allows noValidate consumers to submit incomplete required controls', async () => {
    const element = await createForm(
      '<q-input name="email" required></q-input>',
      { noValidate: true },
    );
    const handler = vi.fn();
    element.addEventListener('qSubmit', handler);

    await element.submitForm();
    await nextFrame();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.values.email).toBe('');
  });

  it('restores initial WebQuark values through resetForm', async () => {
    const element = await createForm(`
      <q-input name="email" value="initial@example.com"></q-input>
      <q-toggle name="enabled" checked></q-toggle>
    `);
    const input = element.querySelector('q-input') as HTMLQInputElement;
    const toggle = element.querySelector('q-toggle') as HTMLQToggleElement;
    input.value = 'changed@example.com';
    toggle.checked = false;
    await nextFrame();

    await element.resetForm();
    await nextFrame();

    expect(input.value).toBe('initial@example.com');
    expect(toggle.checked).toBe(true);
  });

  it('participates in native forms when no shadow boundary is present', async () => {
    const nativeForm = document.createElement('form');
    const input = document.createElement('q-input');
    input.name = 'email';
    input.required = true;
    nativeForm.append(input);
    document.body.append(nativeForm);
    await customElements.whenDefined('q-input');
    await nextFrame();

    expect(nativeForm.elements.namedItem('email')).toBe(input);
    expect(nativeForm.checkValidity()).toBe(false);

    input.value = 'user@example.com';
    await nextFrame();

    expect(nativeForm.checkValidity()).toBe(true);
    expect(new FormData(nativeForm).get('email')).toBe('user@example.com');
  });
});
