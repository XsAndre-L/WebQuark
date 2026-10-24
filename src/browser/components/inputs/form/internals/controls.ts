import { awaitFormField, FORM_FIELD_READY_TIMEOUT_MS, readFormField } from '../../../../utils/form-field-adapter';
import { isFieldDisabled } from '../../../../utils/form-field-state';
import type { NamedFormControl } from '../form.types';

const skippedInputTypes = new Set(['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit']);

const customFieldTags = new Set(['q-slider', 'q-input', 'q-textarea', 'q-dropdown', 'q-radio-group', 'q-toggle', 'q-syntax-box']);
const actionInputTypes = new Set(['button', 'image', 'reset', 'submit']);

function supported(element: Element): element is NamedFormControl {
  const tag = element.tagName.toLowerCase();
  if (tag === 'input') return !actionInputTypes.has((element as HTMLInputElement).type);
  return tag === 'textarea' || tag === 'select' || customFieldTags.has(tag);
}

function nearestForm(control: Element): Element | undefined {
  for (let parent = control.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'FORM' || parent.tagName === 'Q-FORM') return parent;
  }
  return undefined;
}

/** Named form controls can shadow form.elements; use the native getter. */
function nativeMembers(formEl: HTMLFormElement | undefined): Element[] {
  if (!formEl) return [];
  const prototype = formEl.ownerDocument.defaultView?.HTMLFormElement?.prototype;
  const getter = prototype && Object.getOwnPropertyDescriptor(prototype, 'elements')?.get;
  const elements = getter ? getter.call(formEl) : formEl.elements;
  return elements ? Array.from(elements) : [];
}

function candidates(formEl: HTMLFormElement | undefined, hostEl: HTMLElement): NamedFormControl[] {
  const found = new Set<NamedFormControl>();
  hostEl.querySelectorAll('*').forEach(element => { if (supported(element)) found.add(element); });
  nativeMembers(formEl).forEach(element => { if (supported(element)) found.add(element); });
  return Array.from(found).sort((left, right) => {
    const position = left.compareDocumentPosition(right);
    if (position & Node.DOCUMENT_POSITION_DISCONNECTED) return 0;
    return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  });
}

function owned(control: NamedFormControl, formEl: HTMLFormElement | undefined, hostEl: HTMLElement): boolean {
  const custom = readFormField(control);
  if (customFieldTags.has(control.tagName.toLowerCase()) && !custom) return false;
  const owner = custom ? custom.owner() : (control as HTMLInputElement).form;
  if (owner) return owner === formEl;
  if (control.hasAttribute('form')) return false;
  return nearestForm(control) === hostEl;
}

/** Light DOM and actual native association only; never inspect consumer shadow roots. */
export function getFormControls(formEl: HTMLFormElement | undefined, hostEl: HTMLElement): NamedFormControl[] {
  return candidates(formEl, hostEl).filter(control => owned(control, formEl, hostEl));
}

export async function awaitFormControls(formEl: HTMLFormElement | undefined, hostEl: HTMLElement, signal?: AbortSignal): Promise<void> {
  const deadline = Date.now() + FORM_FIELD_READY_TIMEOUT_MS;
  const possiblyOwned = (control: NamedFormControl): boolean => {
    if (readFormField(control)) return owned(control, formEl, hostEl);
    if (nativeMembers(formEl).includes(control)) return true;
    return !control.hasAttribute('form') && nearestForm(control) === hostEl;
  };
  while (true) {
    if (signal?.aborted) return;
    const pending = candidates(formEl, hostEl).filter(control =>
      control.isConnected && customFieldTags.has(control.tagName.toLowerCase()) &&
      possiblyOwned(control) && !readFormField(control),
    );
    if (!pending.length) return;
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      const error = new Error(`Form fields did not become ready within ${FORM_FIELD_READY_TIMEOUT_MS}ms.`);
      error.name = 'TimeoutError';
      throw error;
    }
    const batch = new AbortController();
    const abort = () => batch.abort();
    signal?.addEventListener('abort', abort, { once: true });
    try {
      await Promise.all(pending.map(async control => {
        const canceled = new AbortController();
        const stop = () => canceled.abort();
        const observer = new MutationObserver(() => {
          if (!control.isConnected || !possiblyOwned(control)) stop();
        });
        batch.signal.addEventListener('abort', stop, { once: true });
        const roots = new Set([hostEl.getRootNode(), formEl?.getRootNode()].filter(Boolean));
        try {
          for (const root of roots) observer.observe(root!, { childList: true, subtree: true, attributes: true, attributeFilter: ['form', 'id'] });
          if (!control.isConnected || !possiblyOwned(control)) stop();
          await awaitFormField(control, canceled.signal, remaining);
        } finally {
          observer.disconnect();
          batch.signal.removeEventListener('abort', stop);
        }
      }));
    } finally {
      signal?.removeEventListener('abort', abort);
      batch.abort();
    }
  }
}

export function getNamedControls(formEl: HTMLFormElement | undefined, hostEl: HTMLElement): NamedFormControl[] {
  return getFormControls(formEl, hostEl).filter(control => Boolean(control.getAttribute('name')));
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
  return getFormControls(formEl, hostEl).filter((control) => isFocusableTextControl(control));
}

function isFocusableTextControl(control: NamedFormControl): boolean {
  const tagName = control.tagName.toLowerCase();
  if (isFieldDisabled(control, Boolean(control.disabled)) || control.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
  const style = control.ownerDocument.defaultView?.getComputedStyle(control);
  if (style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') return false;
  // Stencil's mock DOM has no layout geometry; real browsers also exclude hidden ancestors.
  if (typeof control.getClientRects === 'function' && !control.getClientRects().length) return false;
  if (shouldSkipControl(control, tagName)) return false;

  if (tagName === 'q-input') return !skippedInputTypes.has(control.type ?? 'text');

  if (control instanceof HTMLInputElement) {
    return !skippedInputTypes.has(control.type);
  }

  return false;
}

function controlContainsTarget(control: NamedFormControl, target: HTMLElement): boolean {
  return control === target || control.contains(target) || Boolean(control.shadowRoot?.contains(target));
}
