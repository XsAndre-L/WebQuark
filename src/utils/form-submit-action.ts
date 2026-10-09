import { isFieldDisabled } from './form-field-state';
import { resolveResetOwner } from './form-reset-action';

const activationKey = Symbol.for('webquark.form.submit-activation.v1');
const ownerKey = Symbol.for('webquark.form.submit-owner.v1');
const busyKey = Symbol.for('webquark.form.submit-busy.v1');
const queued = new WeakSet<HTMLElement>();
export interface SubmitActivation { submitter: HTMLElement | null; coordinates?: readonly [number, number] }
interface ImageActivation extends SubmitActivation { click: MouseEvent }
type Action = HTMLElement & { type?: string; disabled?: boolean; loading?: boolean; href?: string };

export function setFormSubmitting(form: HTMLFormElement, submitting: boolean): void {
  if (submitting) (form as any)[busyKey] = true;
  else delete (form as any)[busyKey];
}

export function registerSubmitOwner(control: HTMLElement, owner: () => HTMLFormElement | null): void {
  (control as any)[ownerKey] = owner;
}

export function submitOwner(control: HTMLElement): HTMLFormElement | HTMLQFormElement | undefined {
  const native = control.tagName === 'Q-BUTTON' ? (control as any)[ownerKey]?.() : (control as HTMLButtonElement | HTMLInputElement).form;
  return resolveResetOwner(control, native);
}

export function isSubmitAction(control: HTMLElement, includeDisabled = false): boolean {
  const action = control as Action;
  const tag = control.tagName;
  if (!['BUTTON', 'INPUT', 'Q-BUTTON'].includes(tag) || !['submit', 'image'].includes(action.type ?? '') || action.href) return false;
  return includeDisabled || (!action.loading && !isFieldDisabled(control, Boolean(action.disabled)));
}

export function readSubmitActivation(event: Event): SubmitActivation {
  const supplied = (event as any)[activationKey] as SubmitActivation | undefined;
  if (supplied) return supplied;
  const native = (event as SubmitEvent).submitter as HTMLElement | null | undefined;
  const activation = native && (native as any)[activationKey] as SubmitActivation | ImageActivation | undefined;
  if (activation && 'click' in activation) {
    // requestSubmit() from a click listener is not that click's default action.
    // Native activation runs after dispatch, with eventPhase reset to NONE.
    if (activation.click.eventPhase === 0 && !activation.click.defaultPrevented) {
      delete (native as any)[activationKey];
      return activation;
    }
  } else if (activation) return activation;
  return { submitter: native ?? null };
}

export function dispatchFormSubmit(form: HTMLFormElement, activation: SubmitActivation = { submitter: null }): void {
  const EventConstructor = form.ownerDocument.defaultView!.Event;
  const event = new EventConstructor('submit', { bubbles: true, cancelable: true });
  (event as any)[activationKey] = activation;
  form.dispatchEvent(event);
}

/** Defer until both qClick and native click listeners have had a chance to cancel. */
export function scheduleSubmitAction(control: HTMLElement, originalEvent: MouseEvent, emittedEvent?: Event): void {
  const currentOwner = submitOwner(control);
  const currentForm = currentOwner?.tagName === 'Q-FORM' ? currentOwner.shadowRoot?.querySelector('form') : currentOwner;
  if (currentForm && (currentForm as any)[busyKey]) return;
  const coordinates: readonly [number, number] = originalEvent.detail > 0 ? [Math.max(0, Math.floor(originalEvent.offsetX)), Math.max(0, Math.floor(originalEvent.offsetY))] : [0, 0];
  const activation: SubmitActivation = { submitter: control, coordinates };
  // Trusted event callbacks can run microtasks before later click listeners or
  // the native default action. Keep coordinates through dispatch/default action,
  // and run logical bridges in the next task so every listener can cancel.
  const nativeImage = control.tagName === 'INPUT' && (control as HTMLInputElement).type === 'image' && (control as HTMLInputElement).form;
  const imageActivation: ImageActivation = { ...activation, click: originalEvent };
  if (nativeImage) (control as any)[activationKey] = imageActivation;
  else {
    if (queued.has(control)) return;
    queued.add(control);
  }
  setTimeout(() => {
    if (!nativeImage) queued.delete(control);
    if (nativeImage && (control as any)[activationKey] === imageActivation) delete (control as any)[activationKey];
    if (originalEvent.defaultPrevented || emittedEvent?.defaultPrevented || !control.isConnected || !isSubmitAction(control)) return;
    const owner = submitOwner(control);
    if (!owner) return;
    // A native associated button already ran its own activation/submit algorithm.
    if (control.tagName !== 'Q-BUTTON' && (control as HTMLButtonElement | HTMLInputElement).form) return;
    originalEvent.preventDefault();
    if (owner.tagName === 'Q-FORM') {
      const form = owner.shadowRoot?.querySelector('form');
      if (form) dispatchFormSubmit(form, activation);
      return;
    }
    const form = owner as HTMLFormElement;
    const proxy = form.ownerDocument.createElement('button');
    proxy.type = 'submit';
    proxy.hidden = true;
    copySubmitAttributes(control, proxy);
    (proxy as any)[activationKey] = activation;
    form.append(proxy);
    try {
      form.ownerDocument.defaultView!.HTMLFormElement.prototype.requestSubmit.call(form, proxy);
    } finally {
      proxy.remove();
    }
  });
}

export function submitAttribute(control: HTMLElement, property: string, attribute: string): string | undefined {
  if (control.tagName === 'Q-BUTTON') {
    const value = (control as any)[property];
    if (value !== undefined && value !== null) return String(value);
  }
  return control.hasAttribute(attribute) ? control.getAttribute(attribute)! : undefined;
}

export function submitterNoValidate(control: HTMLElement | null): boolean {
  // Stencil reflects asynchronously; a live false must beat a stale attribute.
  if (control?.tagName === 'Q-BUTTON') return Boolean((control as HTMLQButtonElement).formNoValidate);
  return Boolean(control && ((control as HTMLButtonElement).formNoValidate || control.hasAttribute('formnovalidate')));
}

function copySubmitAttributes(control: HTMLElement, proxy: HTMLButtonElement): void {
  for (const [property, attribute] of [['name','name'],['value','value'],['formAction','formaction'],['formMethod','formmethod'],['formEnctype','formenctype'],['formTarget','formtarget']]) {
    const value = submitAttribute(control, property, attribute);
    if (value !== undefined) proxy.setAttribute(attribute, value);
  }
  proxy.formNoValidate = submitterNoValidate(control);
}

/** First owned submit button, including a disabled default that blocks Enter. */
export function defaultSubmitAction(form: HTMLFormElement | undefined, host: HTMLElement): HTMLElement | undefined {
  if (!form) return;
  const candidates = new Set<HTMLElement>();
  host.querySelectorAll<HTMLElement>('button,input,q-button').forEach(control => candidates.add(control));
  const root = form.getRootNode() as Document | ShadowRoot;
  root.querySelectorAll<HTMLElement>('button,input,q-button').forEach(control => { if (submitOwner(control) === form) candidates.add(control); });
  return Array.from(candidates).filter(control => isSubmitAction(control, true) && [form, host].includes(submitOwner(control)!)).sort((a, b) => {
    const position = a.compareDocumentPosition(b);
    return position & Node.DOCUMENT_POSITION_DISCONNECTED ? 0 : position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  })[0];
}

export function activateSubmitAction(control: HTMLElement): void {
  if (!isSubmitAction(control)) return;
  if (control.tagName === 'Q-BUTTON') control.shadowRoot?.querySelector<HTMLButtonElement>('button')?.click();
  else control.click();
}
