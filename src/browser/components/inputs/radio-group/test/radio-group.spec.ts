import { describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';

defineCustomElements();

describe('q-radio-group', () => {
  const options = [
    { label: 'Email', value: 'email' },
    { label: 'Username', value: 'username' },
    { label: 'Email and Username', value: 'both' },
  ];

  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const element = document.createElement('q-radio-group');
    Object.assign(element, props);
    document.body.appendChild(element);
    if (typeof (element as any).componentOnReady === 'function') {
      await (element as any).componentOnReady();
    } else {
      await wait(50);
    }
    await wait();
    return element;
  }

  function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  it('renders one native radio per option and marks the current value', async () => {
    const element = await createComponent({ options, value: 'both' });
    const inputs = Array.from(element.shadowRoot.querySelectorAll('input')) as HTMLInputElement[];

    expect(inputs).toHaveLength(3);
    expect(inputs.map(input => input.value)).toEqual(['email', 'username', 'both']);
    expect(inputs[2].checked).toBe(true);
    expect(element.shadowRoot.querySelector('[role="radiogroup"]')).not.toBeNull();
    element.remove();
  });

  it('updates value and emits qChange when a user selects an option', async () => {
    const element = await createComponent({ options, value: 'both' });
    const changeHandler = vi.fn();
    element.addEventListener('qChange', changeHandler);

    const email = element.shadowRoot.querySelector('input[value="email"]') as HTMLInputElement;
    email.click();
    await wait();

    expect(element.value).toBe('email');
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail).toBe('email');
    element.remove();
  });

  it('normalizes JSON and string options', async () => {
    const element = await createComponent({ options: JSON.stringify(['Alpha', { label: 'Beta label', value: 'beta' }]) });
    const labels = Array.from(element.shadowRoot.querySelectorAll('[part="option-label"]')) as HTMLElement[];

    expect(labels.map(label => label.textContent)).toEqual(['Alpha', 'Beta label']);
    element.remove();
  });

  it('disables the fieldset and option inputs', async () => {
    const element = await createComponent({ options, disabled: true });
    const fieldset = element.shadowRoot.querySelector('fieldset') as HTMLFieldSetElement;
    const inputs = Array.from(element.shadowRoot.querySelectorAll('input')) as HTMLInputElement[];

    expect(fieldset.hasAttribute('disabled')).toBe(true);
    expect(inputs.every(input => input.disabled)).toBe(true);
    element.remove();
  });

  it('reports a missing required selection and accepts a selected value', async () => {
    const element = await createComponent({ options, required: true });

    expect(await element.checkValidity()).toBe(false);
    element.value = 'email';
    await wait();
    expect(await element.checkValidity()).toBe(true);
    element.remove();
  });

  it('restores the initial value on form reset', async () => {
    const element = await createComponent({ options, value: 'both' });

    element.value = 'email';
    element.formResetCallback();

    expect(element.value).toBe('both');
    element.remove();
  });

  it('uses aria-label when no visible label is supplied and exposes errors', async () => {
    const element = await createComponent({
      options,
      ariaLabel: 'Sign-in fields',
      errorMessage: 'Choose a sign-in mode',
    });
    const fieldset = element.shadowRoot.querySelector('fieldset') as HTMLFieldSetElement;

    expect(fieldset.getAttribute('aria-label')).toBe('Sign-in fields');
    expect(fieldset.getAttribute('aria-invalid')).toBe('true');
    expect(element.shadowRoot.querySelector('[part~="error-msg"]')?.textContent).toBe('Choose a sign-in mode');
    element.remove();
  });
});
