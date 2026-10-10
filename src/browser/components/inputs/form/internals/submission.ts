import { submitAttribute, type SubmitActivation } from '../../../../utils/form-submit-action';
import type { FieldState } from './field-state';
import type { NamedFormControl } from '../form.types';

/** Suppress navigation now; distinguish later per-event cancellation until dispatch ends. */
export function cancelSubmitAndAwaitDispatch(event: Event): Promise<boolean> {
  const alreadyCanceled = event.defaultPrevented;
  const preventDefault = event.preventDefault;
  preventDefault.call(event);
  if (alreadyCanceled) return Promise.resolve(true);
  const ownPrevent = Object.getOwnPropertyDescriptor(event, 'preventDefault');
  const ownReturn = Object.getOwnPropertyDescriptor(event, 'returnValue');
  let prototype: object | null = event;
  let returnValue: PropertyDescriptor | undefined;
  while (prototype && !returnValue) {
    returnValue = Object.getOwnPropertyDescriptor(prototype, 'returnValue');
    prototype = Object.getPrototypeOf(prototype);
  }
  let canceled = false;
  const restore = () => {
    if (ownPrevent) Object.defineProperty(event, 'preventDefault', ownPrevent);
    else delete (event as Partial<Event>).preventDefault;
    if (ownReturn) Object.defineProperty(event, 'returnValue', ownReturn);
    else delete (event as Partial<Event>).returnValue;
  };
  try {
    Object.defineProperty(event, 'preventDefault', {
      configurable: true,
      writable: true,
      value: function(this: Event) {
        if (this === event && event.cancelable) canceled = true;
        return preventDefault.call(this);
      },
    });
    if (returnValue?.get && returnValue.set) Object.defineProperty(event, 'returnValue', {
        configurable: true,
        get: function(this: Event) { return returnValue!.get!.call(this); },
        set: function(this: Event, value: boolean) {
          if (this === event && !value && event.cancelable) canceled = true;
          returnValue!.set!.call(this, value);
        },
      });
  } catch (error) {
    restore();
    return Promise.reject(error);
  }
  // A trusted native callback can run microtasks before later submit listeners.
  // A task boundary waits for the entire dispatch, then restores both descriptors.
  return new Promise((resolve, reject) => setTimeout(() => {
    try { restore(); resolve(canceled); }
    catch (error) { reject(error); }
  }, 0));
}

export function submitterFields({ submitter, coordinates = [0, 0] }: SubmitActivation): FieldState[] {
  if (!submitter) return [];
  const name = submitAttribute(submitter, 'name', 'name') ?? '';
  const image = (submitter as HTMLInputElement).type === 'image';
  const value = submitAttribute(submitter, 'value', 'value') ?? '';
  const entries: Array<readonly [string, string]> = image ? [[name ? `${name}.x` : 'x', String(coordinates[0])], [name ? `${name}.y` : 'y', String(coordinates[1])]] : name ? [[name, value]] : [];
  return entries.map(([key, entry]) => ({ control: submitter as NamedFormControl, name: key, kind: 'text', disabled: false, active: true, entries: [[key, entry]], model: entry }));
}

export interface SubmissionSettings { action?: string; method: string; enctype: string; target?: string }

export function submissionSettings(base: SubmissionSettings, submitter: HTMLElement | null): SubmissionSettings {
  if (!submitter) return { ...base };
  return {
    action: submitAttribute(submitter, 'formAction', 'formaction') ?? base.action,
    method: submitAttribute(submitter, 'formMethod', 'formmethod') ?? base.method,
    enctype: submitAttribute(submitter, 'formEnctype', 'formenctype') ?? base.enctype,
    target: submitAttribute(submitter, 'formTarget', 'formtarget') ?? base.target,
  };
}

/** Use native attribute normalization, including invalid/empty override defaults. */
export function normalizedMethod(form: HTMLFormElement, method: string): string {
  const probe = form.ownerDocument.createElement('form');
  probe.setAttribute('method', method);
  return probe.method;
}

export function closeSubmissionDialog(host: HTMLElement, activation: SubmitActivation): void {
  const view = host.ownerDocument.defaultView!;
  let node: Node | null = host;
  while (node) {
    if (node instanceof view.HTMLDialogElement) {
      const submitter = activation.submitter;
      const value = submitter && (submitter as HTMLInputElement).type === 'image' ? (activation.coordinates ?? [0,0]).join(',') : submitter ? submitAttribute(submitter, 'value', 'value') ?? '' : '';
      view.HTMLDialogElement.prototype.close.call(node, value);
      return;
    }
    node = node.parentNode ?? (node instanceof view.ShadowRoot ? node.host : null);
  }
  throw new view.DOMException('method="dialog" requires an actual native dialog ancestor.', 'NotSupportedError');
}

/** Scoped replacement of the native entry list; later formdata listeners remain native. */
export function deliverForm(form: HTMLFormElement, data: FormData, settings: SubmissionSettings): void {
  const saved = ['action','method','enctype','target'].map(name => [name, form.getAttribute(name)] as const);
  const root = form.getRootNode();
  let consumed = false;
  const replace = (event: Event) => {
    if (event.target !== form || consumed) return;
    consumed = true;
    const entries = (event as FormDataEvent).formData;
    const names = new Set<string>();
    entries.forEach((_value, name) => names.add(name));
    for (const name of names) entries.delete(name);
    data.forEach((value, name) => entries.append(name, value));
  };
  root.addEventListener('formdata', replace, true);
  try {
    for (const [name] of saved) {
      const value = settings[name as keyof SubmissionSettings];
      if (value === undefined) form.removeAttribute(name);
      else form.setAttribute(name, value);
    }
    form.ownerDocument.defaultView!.HTMLFormElement.prototype.submit.call(form);
  } finally {
    root.removeEventListener('formdata', replace, true);
    for (const [name, value] of saved) {
      if (value === null) form.removeAttribute(name);
      else form.setAttribute(name, value);
    }
  }
}
