import type { QTooltipPosition } from '../tooltip.types';

export interface TooltipPosition {
  left: number;
  top: number;
}

export function getContainingBlock(el: HTMLElement): HTMLElement | null {
  let current: Node | null = el;
  while (current) {
    let parent: Node | null = (current as HTMLElement).parentElement;
    if (!parent && current.parentNode) {
      const node = current.parentNode;
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && (node as ShadowRoot).host) {
        parent = (node as ShadowRoot).host;
      } else {
        parent = node;
      }
    }

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE) {
      current = parent;
      continue;
    }

    const parentEl = parent as HTMLElement;
    const style = window.getComputedStyle(parentEl);
    const backdropFilter = style.backdropFilter || (style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter;

    if (
      (style.transform && style.transform !== 'none') ||
      (style.perspective && style.perspective !== 'none') ||
      (style.filter && style.filter !== 'none') ||
      (backdropFilter && backdropFilter !== 'none') ||
      (style.willChange && (
        style.willChange.includes('transform') ||
        style.willChange.includes('perspective') ||
        style.willChange.includes('filter') ||
        style.willChange.includes('backdrop-filter')
      )) ||
      (style.contain && (
        style.contain.includes('paint') ||
        style.contain.includes('contain') ||
        style.contain.includes('layout') ||
        style.contain.includes('content') ||
        style.contain.includes('strict')
      ))
    ) {
      return parentEl;
    }

    current = parent;
  }

  return null;
}

export function getTooltipPosition(host: HTMLElement, trigger: HTMLElement, position: QTooltipPosition, viewportPadding?: number): TooltipPosition {
  const triggerRect = trigger.getBoundingClientRect();
  const container = getContainingBlock(host);
  const containerRect = container?.getBoundingClientRect();
  const offsetLeft = containerRect?.left || 0;
  const offsetTop = containerRect?.top || 0;

  let anchor: TooltipPosition;
  switch (position) {
    case 'bottom':
      anchor = {
        left: triggerRect.left + triggerRect.width / 2 - offsetLeft,
        top: triggerRect.bottom - offsetTop,
      };
      break;
    case 'left':
      anchor = {
        left: triggerRect.left - offsetLeft,
        top: triggerRect.top + triggerRect.height / 2 - offsetTop,
      };
      break;
    case 'right':
      anchor = {
        left: triggerRect.right - offsetLeft,
        top: triggerRect.top + triggerRect.height / 2 - offsetTop,
      };
      break;
    case 'top':
    default:
      anchor = {
        left: triggerRect.left + triggerRect.width / 2 - offsetLeft,
        top: triggerRect.top - offsetTop,
      };
      break;
  }
  if (!Number.isFinite(viewportPadding) || viewportPadding! < 0) return anchor;

  const width = host.offsetWidth;
  const height = host.offsetHeight;
  const x = position === 'left' ? -width - 8 : position === 'right' ? 8 : -width / 2;
  const y = position === 'top' ? -height - 8 : position === 'bottom' ? 8 : -height / 2;
  const padding = viewportPadding!;
  const left = Math.max(padding, Math.min(anchor.left + offsetLeft + x, window.innerWidth - padding - width));
  const top = Math.max(padding, Math.min(anchor.top + offsetTop + y, window.innerHeight - padding - height));
  return { left: left - offsetLeft - x, top: top - offsetTop - y };
}
