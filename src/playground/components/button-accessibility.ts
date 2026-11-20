// q-button forwards its accessible name. The shell also exposes drawer and toggle state on its focusable part.
export async function setButtonState(
  button: HTMLQButtonElement,
  attribute: 'aria-expanded' | 'aria-pressed',
  value: boolean,
): Promise<void> {
  button.setAttribute(attribute, String(value));
  await customElements.whenDefined('q-button');
  await button.componentOnReady();
  const control = button.shadowRoot?.querySelector<HTMLButtonElement>('[part~="button"]');
  if (!control || !button.isConnected) return;

  control.setAttribute(attribute, button.getAttribute(attribute)!);
  const targetId = button.getAttribute('aria-controls');
  if (targetId) {
    const target = document.getElementById(targetId);
    if (target && 'ariaControlsElements' in Element.prototype) control.ariaControlsElements = [target];
    else control.setAttribute('aria-controls', targetId);
  }
}
