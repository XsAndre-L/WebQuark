import type { NamedFormControl, QFormFieldValue, QFormValues } from '../form.types';
import { getNamedControls, shouldSkipControl } from './controls';

export function createFormData(formEl: HTMLFormElement | undefined, hostEl: HTMLElement): FormData {
  if (!formEl) return new FormData();

  let formData: FormData;
  try {
    formData = new FormData(formEl);
  } catch {
    formData = new FormData();
  }

  const nativelyAssociatedControls = new Set(
    formEl.elements ? Array.from(formEl.elements) : [],
  );
  getNamedControls(formEl, hostEl).forEach((control) => {
    if (!nativelyAssociatedControls.has(control)) {
      appendControlToFormData(formData, control);
    }
  });

  return formData;
}

export function collectValues(
  formEl: HTMLFormElement | undefined,
  hostEl: HTMLElement,
  formData: FormData = createFormData(formEl, hostEl),
): QFormValues {
  const values: QFormValues = {};
  if (!formEl) return values;

  formData.forEach((value, key) => {
    appendValue(values, key, value);
  });

  getNamedControls(formEl, hostEl).forEach((control) => {
    const tagName = control.tagName.toLowerCase();
    const name = control.getAttribute('name');
    if (!name || control.disabled || shouldSkipControl(control, tagName)) return;

    if (tagName === 'q-toggle') {
      values[name] = Boolean(control.checked);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(values, name)) return;

    values[name] = tagName.startsWith('q-') ? readControlValue(control) : readNativeControlValue(control);
  });

  return values;
}

export function applyValues(formEl: HTMLFormElement | undefined, hostEl: HTMLElement, values: QFormValues) {
  if (!formEl) return;

  Object.entries(values).forEach(([name, value]) => {
    const controls = getNamedControls(formEl, hostEl).filter((control) => control.getAttribute('name') === name);
    const nextValue = Array.isArray(value) ? value[0] : value;

    controls.forEach((control) => {
      if (control instanceof HTMLInputElement && control.type === 'checkbox') {
        control.checked = toBoolean(nextValue);
        return;
      }

      if (control.tagName.toLowerCase() === 'q-toggle') {
        control.checked = toBoolean(nextValue);
        return;
      }

      if ('value' in control) {
        control.value = nextValue as string | number | boolean | null;
      }
    });
  });
}

export function resetValues(formEl: HTMLFormElement | undefined, hostEl: HTMLElement) {
  getNamedControls(formEl, hostEl).forEach((control) => {
    if (typeof control.formResetCallback === 'function') {
      control.formResetCallback();
      return;
    }

    const tagName = control.tagName.toLowerCase();

    if (tagName === 'input') {
      const input = control as HTMLInputElement;
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = input.defaultChecked;
      } else if (input.type !== 'file') {
        input.value = input.getAttribute('value') ?? input.defaultValue ?? '';
      }
      return;
    }

    if (tagName === 'textarea') {
      const textarea = control as HTMLTextAreaElement;
      textarea.value = textarea.textContent ?? textarea.defaultValue ?? '';
      return;
    }

    if (tagName === 'select') {
      const select = control as HTMLSelectElement;
      Array.from(select.options).forEach(option => {
        option.selected = option.defaultSelected;
      });
    }
  });
}

function appendControlToFormData(formData: FormData, control: NamedFormControl) {
  const name = control.getAttribute('name');
  if (!name || control.disabled) return;

  const tagName = control.tagName.toLowerCase();
  if (shouldSkipControl(control, tagName)) return;

  if (tagName === 'q-toggle') {
    if (control.checked) formData.append(name, 'true');
    return;
  }

  if (tagName === 'input') {
    const input = control as HTMLInputElement;
    if (['button', 'image', 'reset', 'submit'].includes(input.type)) return;

    if (input.type === 'checkbox' || input.type === 'radio') {
      if (input.checked) formData.append(name, input.value || 'on');
      return;
    }

    if (input.type === 'file') {
      Array.from(input.files ?? []).forEach(file => formData.append(name, file));
      return;
    }
  }

  if (tagName === 'select' && (control as HTMLSelectElement).multiple) {
    Array.from((control as HTMLSelectElement).selectedOptions).forEach(option => {
      if (!option.disabled) formData.append(name, option.value);
    });
    return;
  }

  const value = tagName.startsWith('q-') ? readControlValue(control) : readNativeControlValue(control);
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    if (value !== null) formData.append(name, String(value));
    return;
  }

  formData.append(name, value);
}

function appendValue(values: QFormValues, key: string, value: FormDataEntryValue) {
  if (Object.prototype.hasOwnProperty.call(values, key)) {
    const current = values[key];
    values[key] = Array.isArray(current) ? [...current, value] : [current, value];
    return;
  }

  values[key] = value;
}

function readControlValue(control: NamedFormControl): QFormFieldValue {
  if ('value' in control) {
    const value = control.value;
    if (value === undefined) return null;
    return value;
  }

  return null;
}

function readNativeControlValue(control: NamedFormControl): QFormFieldValue {
  if (control instanceof HTMLInputElement) {
    if (control.type === 'checkbox' || control.type === 'radio') {
      return control.checked ? control.value || 'on' : null;
    }

    if (control.type === 'file') {
      return control.files?.[0] || null;
    }
  }

  if ('value' in control) {
    const value = control.value;
    if (value === undefined) return null;
    return value;
  }

  return null;
}

function toBoolean(value: QFormFieldValue): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return ['true', '1', 'on', 'yes'].includes(value.toLowerCase());
  return false;
}
