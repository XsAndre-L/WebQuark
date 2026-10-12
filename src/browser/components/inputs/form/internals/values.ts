import type { QFormFieldValue, QFormValue, QFormValues } from '../form.types';
import { getFormControls, shouldSkipControl } from './controls';
import { nativeRadioGroups, snapshotField, type FieldState } from './field-state';

function collectionStates(formEl: HTMLFormElement | undefined, hostEl: HTMLElement): FieldState[] {
  return getFormControls(formEl, hostEl).map(snapshotField).filter(field => field.active && field.name);
}

/** Assignment uses owned names, independent of successful-entry participation. */
function assignmentStates(formEl: HTMLFormElement | undefined, hostEl: HTMLElement): FieldState[] {
  return getFormControls(formEl, hostEl)
    .filter(control => Boolean(control.getAttribute('name')) && !shouldSkipControl(control))
    .map(snapshotField);
}

function groups(fields: FieldState[]): Map<string, FieldState[]> {
  const result = new Map<string, FieldState[]>();
  for (const field of fields) {
    const group = result.get(field.name) ?? [];
    group.push(field);
    result.set(field.name, group);
  }
  return result;
}

function formDataFrom(fields: FieldState[]): FormData {
  const data = new FormData();
  for (const field of fields) {
    for (const [name, value] of field.entries) data.append(name, value);
  }
  return data;
}

export function createFormData(formEl: HTMLFormElement | undefined, hostEl: HTMLElement): FormData {
  return formDataFrom(collectionStates(formEl, hostEl));
}

export function collectValues(formEl: HTMLFormElement | undefined, hostEl: HTMLElement, formData?: FormData): QFormValues {
  const fields = collectionStates(formEl, hostEl);
  const data = formData ?? formDataFrom(fields);
  return projectValues(fields, data);
}

export function collectFormState(formEl: HTMLFormElement | undefined, hostEl: HTMLElement, extraFields: FieldState[] = []): { values: QFormValues; formData: FormData } {
  const fields = [...collectionStates(formEl, hostEl), ...extraFields].sort((a, b) => {
    const position = a.control.compareDocumentPosition(b.control);
    return position & Node.DOCUMENT_POSITION_DISCONNECTED ? 0 : position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
  const formData = formDataFrom(fields);
  return { values: projectValues(fields, formData), formData };
}

function projectValues(fields: FieldState[], data: FormData): QFormValues {
  const values: QFormValues = {};
  const entries = new Map<string, FormDataEntryValue[]>();
  data.forEach((value, name) => {
    const group = entries.get(name) ?? [];
    group.push(value);
    entries.set(name, group);
  });
  const put = (name: string, value: QFormValue) => Object.defineProperty(values, name, { value, enumerable: true, writable: true, configurable: true });
  const fieldGroups = groups(fields);
  for (const [name, group] of fieldGroups) {
    const eligible = group.filter(field => !field.disabled);
    if (!eligible.length) continue;
    if (group.every(field => field.kind === 'toggle')) {
      const booleans = eligible.map(field => Boolean(field.model));
      put(name, group.length === 1 ? booleans[0] : booleans);
      entries.delete(name);
      continue;
    }
    const successful = entries.get(name) ?? [];
    const radios = group.every(field => field.kind === 'radio');
    const arrayShape = group.some(field => field.kind === 'multiselect' || (field.kind === 'file' && (field.control as HTMLInputElement).multiple)) ||
      (radios ? nativeRadioGroups(group).length > 1 : group.length > 1);
    const emptyArray = group.every(field => field.kind === 'checkbox' || field.kind === 'multiselect');
    if (successful.length || (arrayShape && emptyArray)) put(name, arrayShape ? successful : successful.length > 1 ? successful : successful[0]);
    entries.delete(name);
  }
  // Includes native dirname and, later, the submission transaction's extra entries.
  for (const [name, successful] of entries) put(name, successful.length > 1 ? successful : successful[0]);
  return values;
}

function fail(name: string, reason: string): never {
  throw new TypeError(`Cannot assign form field "${name}": ${reason}`);
}

function textValue(value: QFormFieldValue, name: string): string {
  if (value === null) return '';
  if (typeof value === 'string' || typeof value === 'boolean') return String(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fail(name, 'expected text, a finite number, Boolean or null');
}

function identity(value: QFormFieldValue, name: string): string | null {
  if (typeof value === 'string') return value;
  if (value === null) return null;
  return fail(name, 'expected an option identity string or null');
}

function identities(value: QFormValue, name: string): string[] {
  if (value === null) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) return value as string[];
  return fail(name, 'expected option identity strings or null');
}

function toBoolean(value: QFormFieldValue, name: string): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value !== 0;
  if (typeof value === 'string') return ['true', '1', 'on', 'yes'].includes(value.toLowerCase());
  if (value === null) return false;
  return fail(name, 'expected a Boolean-compatible scalar');
}

function assignScalar(field: FieldState, value: string | boolean): () => void {
  return () => {
    if (field.custom) {
      field.custom.assign(value);
      field.custom.reconcile();
    } else {
      (field.control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value = String(value);
    }
  };
}

function prepareGroup(name: string, fields: FieldState[], value: QFormValue): Array<() => void> {
  const kinds = new Set(fields.map(field => field.kind));
  const scalarGroup = fields.every(field => field.kind === 'text' || field.kind === 'selection');
  if (kinds.size > 1 && !scalarGroup) return fail(name, 'mixed control kinds have an ambiguous assignment shape');
  const kind = fields[0].kind;

  if (kind === 'file') {
    if (value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) return fail(name, 'file controls support clearing only');
    return fields.map(field => () => { (field.control as HTMLInputElement).value = ''; });
  }
  if (kind === 'radio') {
    const radioGroups = nativeRadioGroups(fields);
    if (Array.isArray(value) && radioGroups.length === 1) return fail(name, 'a lone native radio group takes one identity');
    const positional = Array.isArray(value) ? value : radioGroups.map(() => value);
    if (positional.length !== radioGroups.length) return fail(name, 'radio array length must match the native group count');
    return radioGroups.flatMap((group, index) => {
      const selected = identity(positional[index], name);
      const match = group.find(field => (field.control as HTMLInputElement).value === selected);
      return group.map(field => () => { (field.control as HTMLInputElement).checked = field === match; });
    });
  }
  if (kind === 'checkbox') {
    if (fields.length === 1 && typeof value === 'boolean') return [() => { (fields[0].control as HTMLInputElement).checked = value; }];
    const selected = identities(value, name);
    return fields.map(field => () => { const input = field.control as HTMLInputElement; input.checked = selected.includes(input.value); });
  }
  if (kind === 'multiselect') {
    if (fields.length !== 1) return fail(name, 'repeated multiselect containers have an ambiguous assignment shape');
    const selected = identities(value, name);
    const select = fields[0].control as HTMLSelectElement;
    return [() => { Array.from(select.options).forEach(option => { option.selected = selected.includes(option.value); }); }];
  }
  if (kind === 'toggle') {
    if (fields.length === 1) {
      if (Array.isArray(value)) return fail(name, 'a lone toggle takes one scalar');
      return [assignScalar(fields[0], toBoolean(value, name))];
    }
    if (!Array.isArray(value) || value.length !== fields.length || !value.every(item => typeof item === 'boolean')) {
      return fail(name, 'repeated toggles take one Boolean per owned toggle');
    }
    return fields.map((field, index) => assignScalar(field, value[index] as boolean));
  }
  if (kind === 'selection' && fields.length === 1 && Array.isArray(value)) return fail(name, 'a lone selection takes one identity string or null');
  const positional = Array.isArray(value) ? value : fields.map(() => value);
  if (positional.length !== fields.length) return fail(name, 'positional array length must match the owned field count');
  return fields.map((field, index) => {
    const item = positional[index];
    const next = field.kind === 'selection' ? identity(item, name) ?? '' : textValue(item, name);
    return assignScalar(field, next);
  });
}

/** Validate the entire partial update before mutating any control. */
export function applyValues(formEl: HTMLFormElement | undefined, hostEl: HTMLElement, values: QFormValues): void {
  const owned = groups(assignmentStates(formEl, hostEl));
  const assignments: Array<() => void> = [];
  for (const [name, value] of Object.entries(values)) {
    const fields = owned.get(name);
    if (fields?.length) assignments.push(...prepareGroup(name, fields, value));
  }
  for (const apply of assignments) apply();
}
