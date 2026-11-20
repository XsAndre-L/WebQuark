import { readFormField, type CustomFormField } from '../../../../utils/form-field-adapter';
import type { NamedFormControl } from '../form.types';

export type FieldKind = 'text' | 'selection' | 'toggle' | 'checkbox' | 'radio' | 'multiselect' | 'file';
export type SuccessfulEntry = readonly [string, FormDataEntryValue];
export interface FieldState {
  control: NamedFormControl;
  name: string;
  kind: FieldKind;
  disabled: boolean;
  active: boolean;
  entries: SuccessfulEntry[];
  model: string | string[] | boolean | null;
  custom?: CustomFormField;
}

/** Radio exclusivity belongs to the native owner, tree and name, not q-form. */
export function nativeRadioGroups(fields: FieldState[]): FieldState[][] {
  const result: Array<{ owner: HTMLFormElement | null; root: Node; name: string; fields: FieldState[] }> = [];
  for (const field of fields) {
    const input = field.control as HTMLInputElement;
    const owner = input.form || null;
    const root = input.getRootNode();
    let group = result.find(candidate => candidate.owner === owner && candidate.root === root && candidate.name === field.name);
    if (!group) {
      group = { owner, root, name: field.name, fields: [] };
      result.push(group);
    }
    group.fields.push(field);
  }
  return result.map(group => group.fields);
}

export function effectiveDisabled(control: NamedFormControl): boolean {
  return Boolean(control.disabled || control.matches(':disabled'));
}

function enabledOption(option: HTMLOptionElement): boolean {
  return !option.disabled && !(option.parentElement?.tagName === 'OPTGROUP' && (option.parentElement as HTMLOptGroupElement).disabled);
}

function nativeDatalistParticipation(control: NamedFormControl): boolean {
  if (!control.closest('datalist')) return true;
  try {
    const document = control.ownerDocument;
    const form = document.createElement('form');
    const list = document.createElement('datalist');
    const input = document.createElement('input');
    input.name = '_q_datalist_probe';
    input.value = '1';
    list.append(input);
    form.append(list);
    return new FormData(form).has(input.name);
  } catch {
    return false;
  }
}

/** Let the browser serialize a detached native copy; never move consumer fields. */
function nativeTextEntries(control: NamedFormControl, fallback: SuccessfulEntry[]): SuccessfulEntry[] {
  try {
    const form = control.ownerDocument.createElement('form');
    const clone = control.cloneNode(false) as HTMLInputElement | HTMLTextAreaElement;
    clone.removeAttribute('form');
    clone.value = (control as HTMLInputElement | HTMLTextAreaElement).value;
    if (control.tagName === 'INPUT') (clone as HTMLInputElement).checked = (control as HTMLInputElement).checked;
    clone.dir = control.matches(':dir(rtl)') ? 'rtl' : 'ltr';
    form.append(clone);
    const entries: SuccessfulEntry[] = [];
    new FormData(form).forEach((value, name) => entries.push([name, value]));
    return entries;
  } catch {
    // Mock/non-browser DOMs cannot construct FormData from a native form.
    return fallback;
  }
}

export function snapshotField(control: NamedFormControl): FieldState {
  const custom = readFormField(control);
  custom?.reconcile();
  const name = control.getAttribute('name') ?? '';
  const disabled = effectiveDisabled(control);
  const active = (custom?.active() ?? true) && nativeDatalistParticipation(control);
  const state: FieldState = { control, name, kind: custom?.kind ?? 'text', disabled, active, entries: [], model: null, custom };
  if (custom) {
    state.model = custom.value();
    if (name && active && !disabled && state.model !== null && (state.kind !== 'toggle' || state.model === true)) {
      if (state.kind === 'multiselect' && Array.isArray(state.model)) {
        state.entries.push(...state.model.map(value => [name, value] as const));
      } else {
        state.entries.push([name, String(state.model)]);
      }
    }
    return state;
  }

  if (control.tagName === 'INPUT') {
    const input = control as HTMLInputElement;
    if (input.type === 'checkbox' || input.type === 'radio') {
      state.kind = input.type;
      state.model = input.checked ? input.value : null;
    } else if (input.type === 'file') {
      state.kind = 'file';
      if (name && active && !disabled) {
        const files = Array.from(input.files ?? []);
        const FileConstructor = input.ownerDocument.defaultView?.File ?? File;
        const values = files.length ? files : [new FileConstructor([], '', { type: 'application/octet-stream' })];
        state.entries = values.map(file => [name, file]);
      }
      return state;
    } else {
      state.model = input.value;
    }
  } else if (control.tagName === 'SELECT') {
    const select = control as HTMLSelectElement;
    state.kind = select.multiple ? 'multiselect' : 'selection';
    const options = Array.from(select.selectedOptions).filter(enabledOption);
    state.model = options[0]?.value ?? null;
    if (name && active && !disabled) state.entries = options.map(option => [name, option.value]);
    return state;
  } else {
    state.model = (control as HTMLTextAreaElement).value;
  }

  if (name && active && !disabled && state.model !== null) {
    state.entries.push([name, String(state.model)]);
    const dirname = control.getAttribute('dirname');
    const input = control as HTMLInputElement;
    const supportsDirection = control.tagName === 'TEXTAREA' || ['hidden', 'text', 'search', 'tel', 'url', 'email', 'password'].includes(input.type);
    if (dirname && supportsDirection) state.entries.push([dirname, control.matches(':dir(rtl)') ? 'rtl' : 'ltr']);
    state.entries = nativeTextEntries(control, state.entries);
  }
  return state;
}

export function validateField(control: NamedFormControl, report: boolean): boolean {
  const custom = readFormField(control);
  custom?.reconcile();
  if (effectiveDisabled(control) || (custom && !custom.active())) return true;
  if (custom) return custom.validate(report);
  const native = control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const validate = report ? native.reportValidity : native.checkValidity;
  return typeof validate === 'function' ? validate.call(native) : true;
}
