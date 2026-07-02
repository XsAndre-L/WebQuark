import type { NamedFormControl } from '../form.types';

const skippedInputTypes = new Set(['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit']);

export function getNamedControls(formEl: HTMLFormElement | undefined, hostEl: HTMLElement): NamedFormControl[] {
  const controls = new Set<NamedFormControl>();

  if (formEl) {
    formEl.querySelectorAll<NamedFormControl>('[name]').forEach((control) => controls.add(control));
  }

  hostEl.querySelectorAll<NamedFormControl>('[name]').forEach((control) => controls.add(control));

  return Array.from(controls);
}

export function shouldSkipControl(control: NamedFormControl, tagName = control.tagName.toLowerCase()): boolean {
  return tagName === 'q-syntax-box' && !control.editable;
}

export function getControlFromEvent(ev: KeyboardEvent, formEl: HTMLFormElement | undefined, hostEl: HTMLElement): NamedFormControl | undefined {
  const controls = getFocusableTextControls(formEl, hostEl);
  const path = ev.composedPath();
  const pathControl = controls.find((control) => path.includes(control));
  if (pathControl) return pathControl;

  const target = ev.target;
  if (target instanceof HTMLElement) {
    const targetControl = controls.find((control) => controlContainsTarget(control, target));
    if (targetControl) return targetControl;
  }

  const activeElement = getDeepActiveElement(hostEl);
  if (activeElement instanceof HTMLElement) {
    return controls.find((control) => controlContainsTarget(control, activeElement));
  }

  return undefined;
}

export function focusAdjacentControl(
  current: NamedFormControl,
  formEl: HTMLFormElement | undefined,
  hostEl: HTMLElement,
  direction: -1 | 1,
): boolean {
  const controls = getFocusableTextControls(formEl, hostEl);
  const currentIndex = controls.indexOf(current);
  if (currentIndex < 0) return false;

  const nextControl = controls[currentIndex + direction];
  if (!nextControl) return false;

  if (typeof nextControl.focusElement === 'function') {
    void nextControl.focusElement();
    return true;
  }

  nextControl.focus();
  return true;
}

function getFocusableTextControls(formEl: HTMLFormElement | undefined, hostEl: HTMLElement): NamedFormControl[] {
  return getNamedControls(formEl, hostEl).filter((control) => isFocusableTextControl(control));
}

function isFocusableTextControl(control: NamedFormControl): boolean {
  const tagName = control.tagName.toLowerCase();
  if (control.disabled || control.hidden || control.getAttribute('aria-hidden') === 'true') return false;
  if (shouldSkipControl(control, tagName)) return false;

  if (tagName === 'q-input') return true;

  if (control instanceof HTMLInputElement) {
    return !skippedInputTypes.has(control.type);
  }

  return false;
}

function controlContainsTarget(control: NamedFormControl, target: HTMLElement): boolean {
  return control === target || control.contains(target) || Boolean(control.shadowRoot?.contains(target));
}

function getDeepActiveElement(hostEl: HTMLElement): Element | null {
  let activeElement: Element | null = hostEl.ownerDocument.activeElement;

  while (activeElement?.shadowRoot?.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement;
  }

  return activeElement;
}
