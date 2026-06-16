/**
 * Custom JSX factory that returns real DOM elements.
 * Configured via tsconfig.json to handle JSX transpilation in playground TSX files.
 */

export function h(
  tag: string | ((props: any) => HTMLElement),
  attrs: any,
  ...children: any[]
): HTMLElement {
  if (typeof tag === 'function') {
    return tag(attrs || {});
  }

  const el = document.createElement(tag);

  if (attrs) {
    Object.keys(attrs).forEach(key => {
      const val = attrs[key];
      if (val === undefined || val === null || val === false) {
        return;
      }

      // Handle event listeners: e.g. onClick -> click, onQChange -> qChange
      if (key.startsWith('on') && typeof val === 'function') {
        const rawEventName = key.slice(2);
        const nativeEvents = ['click', 'input', 'change', 'focus', 'blur', 'keydown', 'keyup', 'keypress', 'submit', 'scroll'];
        const lowerEvent = rawEventName.toLowerCase();
        const eventName = nativeEvents.includes(lowerEvent)
          ? lowerEvent
          : rawEventName.charAt(0).toLowerCase() + rawEventName.slice(1);
        el.addEventListener(eventName, val);
      }
      // Handle class names
      else if (key === 'className' || key === 'class') {
        if (typeof val === 'object') {
          const classes = Object.keys(val)
            .filter(k => !!val[k])
            .join(' ');
          el.setAttribute('class', classes);
        } else {
          el.setAttribute('class', String(val));
        }
      }
      // Handle dataset properties
      else if (key.startsWith('data-')) {
        el.setAttribute(key, String(val));
      }
      // Special check for properties that need direct assignment
      else if (key in el && key !== 'style') {
        try {
          (el as any)[key] = val;
        } catch {
          el.setAttribute(key, String(val));
        }
      }
      // Handle standard attributes
      else {
        el.setAttribute(key, String(val));
      }
    });
  }

  // Helper to append children recursively
  const appendChildren = (childList: any[]) => {
    childList.forEach(child => {
      if (child === undefined || child === null || child === false) {
        return;
      }
      if (Array.isArray(child)) {
        appendChildren(child);
      } else if (child instanceof Node) {
        el.appendChild(child);
      } else {
        el.appendChild(document.createTextNode(String(child)));
      }
    });
  };

  appendChildren(children);
  return el;
}

export namespace h {
  export namespace JSX {
    export interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
