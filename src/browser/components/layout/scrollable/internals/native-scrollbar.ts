const SCROLLABLE_TARGET_ID_ATTR = 'data-q-scrollable-target-id';

export function resolveNativeScrollTarget(host: HTMLElement, target: string): Element | null {
  if (!target) {
    return host.parentElement;
  }

  const root = host.getRootNode() as Document | ShadowRoot;
  return root.querySelector(target);
}

export function ensureNativeScrollTargetId(targetEl: Element): string {
  let targetId = targetEl.getAttribute(SCROLLABLE_TARGET_ID_ATTR);
  if (!targetId) {
    targetId = `q-scroll-${Math.random().toString(36).slice(2, 11)}`;
    targetEl.setAttribute(SCROLLABLE_TARGET_ID_ATTR, targetId);
  }
  return targetId;
}

export function buildNativeScrollbarStyle(targetId: string): string {
  return `
      [${SCROLLABLE_TARGET_ID_ATTR}="${targetId}"]::-webkit-scrollbar {
        width: var(--q-scrollbar-width, 6px);
        height: var(--q-scrollbar-width, 6px);
      }
      [${SCROLLABLE_TARGET_ID_ATTR}="${targetId}"]::-webkit-scrollbar-track {
        background: var(--q-scrollbar-track-color, transparent);
      }
      [${SCROLLABLE_TARGET_ID_ATTR}="${targetId}"]::-webkit-scrollbar-thumb {
        background: var(--q-scrollbar-thumb-color, var(--q-border-color, #374151));
        border-radius: var(--q-scrollbar-radius, 4px);
      }
      [${SCROLLABLE_TARGET_ID_ATTR}="${targetId}"]::-webkit-scrollbar-thumb:hover {
        background: var(--q-scrollbar-thumb-color-hover, var(--q-color-primary, #60a5fa));
      }
      [${SCROLLABLE_TARGET_ID_ATTR}="${targetId}"] {
        scrollbar-width: var(--q-scrollbar-width-thin, thin);
        scrollbar-color: var(--q-scrollbar-thumb-color, var(--q-border-color, #374151)) var(--q-scrollbar-track-color, transparent);
      }
    `;
}

export function removeNativeScrollTargetId(targetEl: Element | undefined): void {
  targetEl?.removeAttribute(SCROLLABLE_TARGET_ID_ATTR);
}
