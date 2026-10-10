import { readFormField } from '../../../../utils/form-field-adapter';
import { getFormControls, shouldSkipControl } from './controls';
import type { NamedFormControl } from '../form.types';

function resetNative(control: NamedFormControl): void {
  const native = control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const clone = native.cloneNode(true) as typeof native;
  clone.removeAttribute('form');
  const form = native.ownerDocument.createElement('form');
  form.append(clone);
  native.ownerDocument.defaultView!.HTMLFormElement.prototype.reset.call(form);

  if (native.tagName === 'SELECT') {
    const source = clone as HTMLSelectElement;
    const select = native as HTMLSelectElement;
    if (select.multiple) {
      Array.from(select.options).forEach((option, index) => {
        option.selected = source.options[index].selected;
      });
    } else {
      select.selectedIndex = source.selectedIndex;
    }
  } else if (native.tagName === 'INPUT' && ['checkbox', 'radio'].includes((native as HTMLInputElement).type)) {
    (native as HTMLInputElement).checked = (clone as HTMLInputElement).checked;
  } else {
    native.value = clone.value;
  }
}

/** Native reset already handles natively owned fields. Reset only logical fields. */
export function resetLogicalControls(formEl: HTMLFormElement, hostEl: HTMLElement): void {
  for (const control of getFormControls(formEl, hostEl)) {
    if (shouldSkipControl(control)) continue;
    const custom = readFormField(control);
    const owner = custom?.owner() ?? (control as HTMLInputElement).form;
    if (owner) continue;
    if (custom) {
      custom.reset();
    } else {
      resetNative(control);
    }
  }
}

export function reconcileControls(formEl: HTMLFormElement, hostEl: HTMLElement): void {
  for (const control of getFormControls(formEl, hostEl)) {
    readFormField(control)?.reconcile();
  }
}
