/**
 * Utility functions for DOM property manipulation in the WebQuark Playground.
 */

export type ElementWithHelpers = HTMLElement & {
  setChecked?: (v: any) => void;
  options?: any;
  _resizeObserver?: ResizeObserver;
  [key: string]: any;
};

/**
 * Updates properties and attributes on a DOM element based on a properties configuration map.
 * Correctly handles booleans, empty string values, and custom Stencil component properties
 * (like setChecked on q-toggle).
 */
export function setElementProperties(el: ElementWithHelpers, props: Record<string, any>): void {
  if (!el || !props) return;
  const tag = el.tagName?.toLowerCase();
  Object.keys(props).forEach(pName => {
    const val = props[pName];
    const isBoolean = typeof val === 'boolean' || val === 'true' || val === 'false';
    if (isBoolean) {
      const boolVal = val === true || val === 'true';
      if (tag === 'q-toggle' && pName === 'checked' && typeof el.setChecked === 'function') {
        el.setChecked(boolVal);
        return;
      }
      el[pName] = boolVal;
      if (boolVal) el.setAttribute(pName, '');
      else el.removeAttribute(pName);
    } else {
      el[pName] = val;
      if (val !== undefined && val !== null && val !== '') {
        el.setAttribute(pName, val);
      } else {
        el.removeAttribute(pName);
      }
    }
  });
}
