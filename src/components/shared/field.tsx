import { h } from '@stencil/core';

export function feedbackStyle(reserve: boolean | undefined): Record<string, string> {
  return { '--_q-feedback-min': reserve === undefined ? 'var(--q-context-feedback-min, calc(var(--_q-context-feedback-reserve, 0) * var(--q-field-text-line, 1rem)))' : reserve ? 'var(--q-field-text-line, 1rem)' : '0px' };
}

/** Kept in the control's own shadow root so describedby never crosses a boundary. */
export function fieldFeedback(id: string, error?: string, description?: string) {
  return <span id={id} aria-live="polite" class={{ 'q-field-feedback': true, 'error-msg': !!error }} part={error ? 'feedback error-msg' : 'feedback description'}>{error || description}</span>;
}
