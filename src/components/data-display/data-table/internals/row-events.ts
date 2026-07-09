export function isInteractiveDataTableTarget(event: MouseEvent): boolean {
  return event.composedPath().some(target => isInteractiveElement(target));
}

function isInteractiveElement(target: EventTarget): boolean {
  if (!hasTagName(target)) return false;

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'button' || tagName === 'a' || getElementRole(target) === 'button';
}

function getElementRole(target: EventTarget & { tagName: string }): string | null {
  if (!('getAttribute' in target) || typeof target.getAttribute !== 'function') return null;
  return target.getAttribute('role');
}

function hasTagName(target: EventTarget): target is EventTarget & { tagName: string } {
  return 'tagName' in target && typeof target.tagName === 'string';
}
