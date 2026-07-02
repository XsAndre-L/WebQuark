import type { HandleEnterBehaviorOptions } from '../form.types';
import { focusAdjacentControl, getControlFromEvent } from './controls';

export function handleEnterBehavior({ ev, enterBehavior, formEl, hostEl, requestSubmit }: HandleEnterBehaviorOptions): boolean {
  if (ev.key !== 'Enter' || enterBehavior === 'submit') return false;

  if (shouldIgnoreEnterBehavior(ev)) return false;

  ev.preventDefault();

  if (enterBehavior === 'none') return true;

  const current = getControlFromEvent(ev, formEl, hostEl);
  if (!current) return true;

  const direction = ev.shiftKey ? -1 : 1;
  const didFocus = focusAdjacentControl(current, formEl, hostEl, direction);

  if (!didFocus && direction > 0) {
    requestSubmit();
  }

  return true;
}

function shouldIgnoreEnterBehavior(ev: KeyboardEvent): boolean {
  if (ev.ctrlKey || ev.altKey || ev.metaKey || ev.isComposing) return true;

  return ev.composedPath().some((target) => {
    if (!(target instanceof HTMLElement)) return false;

    const tagName = target.tagName.toLowerCase();
    if (target.isContentEditable) return true;

    return [
      'a',
      'button',
      'textarea',
      'q-button',
      'q-dropdown',
      'q-link',
      'q-syntax-box',
      'q-textarea',
      'q-toggle',
    ].includes(tagName);
  });
}
