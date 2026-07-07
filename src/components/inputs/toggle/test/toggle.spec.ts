import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';
import { isToggleActivationKey } from '../toggle.utils';

defineCustomElements();

describe('q-toggle', () => {
  async function createComponent(props: Record<string, any> = {}, children: HTMLElement[] = []): Promise<any> {
    const el = document.createElement('q-toggle');
    Object.assign(el, props);
    children.forEach(child => el.appendChild(child));
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

  it('renders default switch structure with switch semantics', async () => {
    const el = await createComponent();
    const wrapper = el.shadowRoot.querySelector('.toggle-wrapper') as HTMLElement;

    expect(wrapper).not.toBeNull();
    expect(wrapper.getAttribute('role')).toBe('switch');
    expect(el.shadowRoot.querySelector('.switch-track')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.switch-track')?.getAttribute('part')).toBe('track');

    el.remove();
  });

  it('renders checkbox structure with checkbox semantics', async () => {
    const el = await createComponent({ type: 'checkbox' });
    const wrapper = el.shadowRoot.querySelector('.toggle-wrapper') as HTMLElement;
    const box = el.shadowRoot.querySelector('.checkbox-box') as HTMLElement;

    expect(wrapper.getAttribute('role')).toBe('checkbox');
    expect(box).not.toBeNull();
    expect(box.getAttribute('part')).toBe('box');

    el.remove();
  });

  it('toggles checked state and emits qClick/qChange on click', async () => {
    const el = await createComponent({ checked: false });
    const wrapper = el.shadowRoot.querySelector('.toggle-wrapper') as HTMLElement;

    const changeHandler = vi.fn();
    const clickHandler = vi.fn();
    el.addEventListener('qChange', changeHandler);
    el.addEventListener('qClick', clickHandler);

    wrapper.click();
    await wait();

    expect(el.checked).toBe(true);
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail).toBe(true);
    expect(clickHandler).toHaveBeenCalledTimes(1);

    wrapper.click();
    await wait();

    expect(el.checked).toBe(false);
    expect(changeHandler).toHaveBeenCalledTimes(2);
    expect(changeHandler.mock.calls[1][0].detail).toBe(false);

    el.remove();
  });

  it('recognizes keyboard activation keys', () => {
    expect(isToggleActivationKey(' ')).toBe(true);
    expect(isToggleActivationKey('Enter')).toBe(true);
    expect(isToggleActivationKey('Tab')).toBe(false);
  });

  it('does not toggle or emit qChange when disabled', async () => {
    const el = await createComponent({ checked: false, disabled: true });
    const wrapper = el.shadowRoot.querySelector('.toggle-wrapper') as HTMLElement;

    const changeHandler = vi.fn();
    const clickHandler = vi.fn();
    el.addEventListener('qChange', changeHandler);
    el.addEventListener('qClick', clickHandler);

    wrapper.click();
    await wait();

    expect(el.checked).toBe(false);
    expect(changeHandler).not.toHaveBeenCalled();
    expect(clickHandler).not.toHaveBeenCalled();

    el.remove();
  });

  it('emits qFocus and qBlur from the focusable wrapper', async () => {
    const el = await createComponent();
    const wrapper = el.shadowRoot.querySelector('.toggle-wrapper') as HTMLElement;
    const focusHandler = vi.fn();
    const blurHandler = vi.fn();
    el.addEventListener('qFocus', focusHandler);
    el.addEventListener('qBlur', blurHandler);

    wrapper.dispatchEvent(new FocusEvent('focus'));
    wrapper.dispatchEvent(new FocusEvent('blur'));
    await wait();

    expect(focusHandler).toHaveBeenCalledTimes(1);
    expect(blurHandler).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it('renders required and error ARIA state with error text', async () => {
    const el = await createComponent({ required: true, error: 'Required' });
    const wrapper = el.shadowRoot.querySelector('.toggle-wrapper') as HTMLElement;
    const error = el.shadowRoot.querySelector('#toggle-error-msg') as HTMLElement;

    expect(wrapper.getAttribute('aria-required')).toBe('true');
    expect(wrapper.getAttribute('aria-invalid')).toBe('true');
    expect(wrapper.getAttribute('aria-describedby')).toBe('toggle-error-msg');
    expect(error.textContent).toBe('Required');

    el.remove();
  });

  it('restores the initial checked value on form reset', async () => {
    const form = document.createElement('form');
    const el = document.createElement('q-toggle') as any;
    el.checked = true;
    form.appendChild(el);
    document.body.appendChild(form);

    if (typeof el.componentOnReady === 'function') {
      await el.componentOnReady();
    } else {
      await wait(50);
    }

    el.checked = false;
    el.formResetCallback();

    expect(el.checked).toBe(true);

    form.remove();
  });

  it('exposes checked and unchecked icon slots for checkbox mode', async () => {
    const checkedIcon = document.createElement('span');
    checkedIcon.slot = 'checked-icon';
    checkedIcon.textContent = 'on';

    const uncheckedIcon = document.createElement('span');
    uncheckedIcon.slot = 'unchecked-icon';
    uncheckedIcon.textContent = 'off';

    const el = await createComponent({ type: 'checkbox', checked: true }, [checkedIcon, uncheckedIcon]);

    expect(el.shadowRoot.querySelector('slot[name="checked-icon"]')).not.toBeNull();
    expect(el.shadowRoot.querySelector('slot[name="unchecked-icon"]')).not.toBeNull();
    expect(el.shadowRoot.querySelector('[part="icon-checked"]')?.classList.contains('is-hidden')).toBe(false);
    expect(el.shadowRoot.querySelector('[part="icon-unchecked"]')?.classList.contains('is-hidden')).toBe(true);

    el.remove();
  });

  it('toggle method flips checked and emits qChange', async () => {
    const el = await createComponent({ checked: false });
    const changeHandler = vi.fn();
    el.addEventListener('qChange', changeHandler);

    await el.toggle();
    await wait();

    expect(el.checked).toBe(true);
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail).toBe(true);

    el.remove();
  });
});
