import type { HandleEnterBehaviorOptions } from '../form.types';
import { focusAdjacentControl, getControlFromEvent } from './controls';
import { activateSubmitAction, defaultSubmitAction } from '../../../../utils/form-submit-action';

export function handleEnterBehavior({ ev, enterBehavior, formEl, hostEl, requestSubmit }: HandleEnterBehaviorOptions): boolean {
  if (ev.key !== 'Enter' || ev.defaultPrevented || ev.ctrlKey || ev.altKey || ev.metaKey || ev.isComposing || ev.keyCode === 229) return false;
  if (ev.composedPath().some(target => target instanceof HTMLElement && target !== hostEl &&
    (target.isContentEditable || ['A','BUTTON','SELECT','TEXTAREA'].includes(target.tagName)))) return false;
  const current = getControlFromEvent(ev, formEl, hostEl);
  if (!current) return false;
  ev.preventDefault();
  if (enterBehavior === 'none') return true;
  if (enterBehavior === 'focus-next' && focusAdjacentControl(current, formEl, hostEl, ev.shiftKey ? -1 : 1)) return true;
  if (enterBehavior === 'focus-next' && ev.shiftKey) return true;
  const action = defaultSubmitAction(formEl, hostEl);
  if (action) activateSubmitAction(action);
  else requestSubmit();
  return true;
}
