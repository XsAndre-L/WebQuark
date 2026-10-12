export function isInteractiveDataTableTarget(event: Event): boolean {
  return event.composedPath().some(target => isInteractiveElement(target));
}

function isInteractiveElement(target: EventTarget): boolean {
  if (!hasTagName(target)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'button' ||
    tagName === 'a' ||
    tagName === 'select' ||
    tagName === 'textarea' ||
    tagName === 'summary' ||
    getElementRole(target) === 'button' ||
    getElementAttribute(target, 'contenteditable') === 'true'
  );
}

function getElementRole(target: EventTarget & { tagName: string }): string | null {
  return getElementAttribute(target, 'role');
}

function getElementAttribute(target: EventTarget & { tagName: string }, attribute: string): string | null {
  if (!('getAttribute' in target) || typeof target.getAttribute !== 'function') return null;
  return target.getAttribute(attribute);
}

function hasTagName(target: EventTarget): target is EventTarget & { tagName: string } {
  return 'tagName' in target && typeof target.tagName === 'string';
}
