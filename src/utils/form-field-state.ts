/** Reflect current props before consulting native FACE disabling and association. */
export function syncFieldHost(host: HTMLElement | undefined, disabled: boolean, name?: string, required?: boolean): boolean {
  if (!host) return Boolean(disabled);
  const flag = (name: string, enabled: boolean) => {
    if (enabled && !host.hasAttribute(name)) {
      host.setAttribute(name, '');
    } else if (!enabled && host.hasAttribute(name)) {
      host.removeAttribute(name);
    }
  };
  flag('disabled', Boolean(disabled));
  if (arguments.length >= 3) {
    if (name === undefined || name === null) {
      host.removeAttribute('name');
    } else if (host.getAttribute('name') !== name) {
      host.setAttribute('name', name);
    }
  }
  if (required !== undefined) flag('required', required);
  return isFieldDisabled(host, disabled);
}

export function isFieldDisabled(host: HTMLElement | undefined, explicit: boolean): boolean {
  if (explicit || host?.matches(':disabled')) return true;
  for (let parent = host?.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName !== 'FIELDSET' || !(parent as HTMLFieldSetElement).disabled) continue;
    const legend = Array.from(parent.children).find(child => child.tagName === 'LEGEND');
    if (!legend?.contains(host!)) return true;
  }
  return false;
}

export function syncNativeAttribute(control: Element, name: string, value: string | number | undefined | null): void {
  if (value === undefined || value === null) {
    control.removeAttribute(name);
  } else if (control.getAttribute(name) !== String(value)) {
    control.setAttribute(name, String(value));
  }
}
