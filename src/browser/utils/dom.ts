/**
 * @fileoverview DOM, Layout, and Accessibility (a11y) utility library for WebQuark.
 * Standardized helpers for focus trapping, slot traversal, and transition watchers.
 */

/**
 * 1. Shadow-safe helper to retrieve slotted elements projected from the light DOM.
 * Traverses all slots (named and unnamed) and flattens nested slot hierarchies.
 * @param container The container element inside the shadow root holding the slot(s).
 * @param tagName Optional filter to match only specific tag names (e.g. 'q-thumbnail').
 */
export function getSlottedElements(container: HTMLElement, tagName?: string): HTMLElement[] {
  if (!container) return [];

  const slots = Array.from(container.querySelectorAll('slot')) as HTMLSlotElement[];
  if (slots.length === 0) {
    const rawChildren = Array.from(container.children) as HTMLElement[];
    if (tagName) {
      const lowerTag = tagName.toLowerCase();
      return rawChildren.filter(el => el.tagName.toLowerCase() === lowerTag);
    }
    return rawChildren;
  }
  
  const assigned: HTMLElement[] = [];
  slots.forEach(slot => {
    // nodeType === 1 is equivalent to Node.ELEMENT_NODE but safe for Node.js SSR compilation
    const elems = slot.assignedElements({ flatten: true }).filter(el => el.nodeType === 1) as HTMLElement[];
    assigned.push(...elems);
  });

  if (tagName) {
    const lowerTag = tagName.toLowerCase();
    return assigned.filter(el => el.tagName.toLowerCase() === lowerTag);
  }
  return assigned;
}

/**
 * Helper to recursively pierce shadow roots and find the deep active element.
 */
export function getDeepActiveElement(): Element | null {
  let activeEl = document.activeElement;
  while (activeEl && activeEl.shadowRoot && activeEl.shadowRoot.activeElement) {
    activeEl = activeEl.shadowRoot.activeElement;
  }
  return activeEl;
}

/**
 * 2. Recursively retrieves all interactive/focusable elements inside a container,
 * traversing through both slotted elements and nested Shadow DOM boundaries.
 * Filters out keyboard-disabled, hidden, or aria-hidden elements.
 * @param container The root element to scan.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (!container) return [];

  const selector = 'button, [href], input, select, textarea, [tabindex="0"], q-button, q-slider, q-input, q-textarea, q-dropdown, q-radio-group';
  const focusables: HTMLElement[] = [];

  const traverse = (node: Node) => {
    if (node.nodeType !== 1) return;
    const el = node as HTMLElement;

    // Check display: none via computed style to skip subtrees entirely
    const style = typeof window !== 'undefined' ? window.getComputedStyle(el) : null;
    if (style && style.display === 'none') return;

    const isTabEnabled = el.getAttribute('tabindex') !== '-1';
    const isAriaHidden = el.getAttribute('aria-hidden') === 'true';

    if (el.matches(selector) && !(el as any).disabled && isTabEnabled && !isAriaHidden) {
      // Only read layout-triggering properties if the element matches the focusable selector
      const isVisible = el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
      if (isVisible) {
        focusables.push(el);
      }
    }

    // Traverse shadow DOM of nested elements
    if (el.shadowRoot) {
      Array.from(el.shadowRoot.childNodes).forEach(traverse);
    }

    if (el.tagName.toLowerCase() === 'slot') {
      const slot = el as HTMLSlotElement;
      slot.assignedElements({ flatten: true }).forEach(traverse);
    } else {
      const children = Array.from(el.childNodes);
      children.forEach(child => traverse(child));
    }
  };

  traverse(container);
  return focusables;
}

/**
 * 3. Traps Tab keyboard focus inside a modal/lightbox container.
 * Scopes focus transitions and prevents tab leakage to background elements.
 * @param e The native KeyboardEvent.
 * @param container The container inside which focus must be trapped.
 */
export function handleTabTrap(e: KeyboardEvent, container: HTMLElement): void {
  if (e.key !== 'Tab' || !container) return;

  const focusables = getFocusableElements(container);
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const activeEl = getDeepActiveElement();

  // If focus starts outside the loopable elements, redirect focus to boundaries
  const isFocusInside = focusables.includes(activeEl as HTMLElement);
  if (!isFocusInside) {
    if (e.shiftKey) {
      last.focus();
    } else {
      first.focus();
    }
    e.preventDefault();
    return;
  }

  if (e.shiftKey && activeEl === first) {
    last.focus();
    e.preventDefault();
  } else if (!e.shiftKey && activeEl === last) {
    first.focus();
    e.preventDefault();
  }
}

/**
 * 4. Automatically propagates a property from a parent custom element to its slotted children.
 * If no direct children match, checks deep slotted descendants.
 * @param hostEl The parent custom element host.
 * @param childTagName The tag name of the child custom element (e.g. 'q-step-diagram-item').
 * @param propName The property name to synchronize (e.g. 'layout').
 * @param value The value to apply.
 */
export function syncPropertyToSlottedChildren(
  hostEl: HTMLElement,
  childTagName: string,
  propName: string,
  value: any
): void {
  if (!hostEl) return;

  const slot = hostEl.shadowRoot?.querySelector('slot');
  const children = slot ? slot.assignedElements({ flatten: true }) : Array.from(hostEl.children);
  const lowerTag = childTagName.toLowerCase();
  
  let matchedCount = 0;
  children.forEach((child: any) => {
    if (child.tagName.toLowerCase() === lowerTag) {
      child[propName] = value;
      matchedCount++;
    }
  });

  // Deep fallback if children are wrapped inside nested slots/wrappers
  if (matchedCount === 0) {
    const nestedChildren = Array.from(hostEl.querySelectorAll(childTagName)) as any[];
    nestedChildren.forEach(child => {
      child[propName] = value;
    });
  }
}

/**
 * 5. Computes a dynamic font size style based on text length to prevent circular/card text overflows.
 * @param text The text string to evaluate.
 * @param baseSize The base CSS size token (e.g. '1.125rem' or 'var(--q-font-size-lg)').
 * @param lengthThreshold The character length above which scaling begins (defaults to 5).
 */
export function calculateDynamicFontSize(
  text: string,
  baseSize: string,
  lengthThreshold = 5
): { fontSize: string } {
  if (!text || text.length <= lengthThreshold) {
    return { fontSize: baseSize };
  }
  const scale = lengthThreshold / text.length;
  const cappedScale = Math.max(0.4, scale); // Clamp to minimum of 40%
  return { fontSize: `calc(${baseSize} * ${cappedScale.toFixed(3)})` };
}

/**
 * 6. OSR-safe listener that waits for a CSS transition to end, running a callback.
 * Employs a fallback setTimeout timer to ensure execution inside busy OSR render threads.
 * Clears timers when completed to prevent resource leaks.
 * @param element The HTML element undergoing transition.
 * @param callback The callback function to run on transition completion.
 * @param timeout Optional explicit timeout override. Defaults to parsed CSS transition duration + 50ms buffer.
 */
export function waitForTransitionEnd(element: HTMLElement, callback: () => void, timeout?: number): () => void {
  if (!element) {
    callback();
    return () => undefined;
  }

  let called = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cleanup = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    element.removeEventListener('transitionend', done);
  };

  const done = () => {
    if (called) return;
    called = true;
    cleanup();
    callback();
  };

  // Determine safety timeout buffer
  let fallbackTimeout = timeout;
  if (fallbackTimeout === undefined && typeof window !== 'undefined') {
    const durationStr = window.getComputedStyle(element).transitionDuration || '';
    const durationMs = parseFloat(durationStr) * (durationStr.includes('ms') ? 1 : 1000);
    fallbackTimeout = isNaN(durationMs) || durationMs === 0 ? 350 : durationMs + 50;
  } else if (fallbackTimeout === undefined) {
    fallbackTimeout = 350;
  }

  element.addEventListener('transitionend', done);
  timer = setTimeout(done, fallbackTimeout);

  return cleanup;
}

/**
 * 7. Safely focuses an HTML element if it exists and supports the focus method.
 * Useful for offscreen renderers or server-side pre-rendering checks.
 * @param element The element to focus.
 */
export function safeFocus(element: HTMLElement | null | undefined): void {
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
}

/**
 * 8. Focuses the first focusable/interactive descendant inside a container.
 * If no focusable descendants are found, falls back to focusing the container itself.
 * @param container The container element to search.
 */
export function focusFirstElement(container: HTMLElement | null | undefined): void {
  if (!container) return;
  const focusables = getFocusableElements(container);
  if (focusables.length > 0) {
    focusables[0].focus();
  } else {
    safeFocus(container);
  }
}
