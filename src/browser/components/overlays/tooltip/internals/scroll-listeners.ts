export function addTooltipScrollListeners(trigger: HTMLElement | null, listener: EventListener): void {
  window.addEventListener('scroll', listener, { passive: true });
  window.addEventListener('resize', listener);

  let parent = trigger;
  while (parent) {
    parent.addEventListener('scroll', listener, { passive: true });
    parent = parent.parentElement;
  }
}

export function removeTooltipScrollListeners(trigger: HTMLElement | null, listener: EventListener): void {
  window.removeEventListener('scroll', listener);
  window.removeEventListener('resize', listener);

  let parent = trigger;
  while (parent) {
    parent.removeEventListener('scroll', listener);
    parent = parent.parentElement;
  }
}
