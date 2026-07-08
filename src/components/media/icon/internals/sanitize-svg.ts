const BLOCKED_SVG_ELEMENTS = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'link', 'meta']);
const BLOCKED_SVG_TAG_PATTERN = /<\s*(script|foreignObject|iframe|object|embed|link|meta)\b[\s\S]*?(?:<\/\s*\1\s*>|\/\s*>)/gi;
const EVENT_HANDLER_ATTR_PATTERN = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const BLOCKED_ATTR_PATTERN = /\s+(style|tabindex)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const HREF_ATTR_PATTERN = /\s+(xlink:href|href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_ATTR_VALUE_PATTERN = /\s+[a-z_:.-]+\s*=\s*("[^"]*javascript:[^"]*"|'[^']*javascript:[^']*'|[^\s>]*javascript:[^\s>]*)/gi;

export function sanitizeIconSvg(svgText: string): string {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    return sanitizeIconSvgString(svgText);
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(svgText, 'image/svg+xml');
  const parserError = document.querySelector('parsererror');
  const svg = document.documentElement;

  if (parserError || !svg || svg.tagName.toLowerCase() !== 'svg') {
    return sanitizeIconSvgString(svgText);
  }

  const walk = (element: Element) => {
    const tagName = element.tagName.toLowerCase();
    if (BLOCKED_SVG_ELEMENTS.has(tagName)) {
      element.remove();
      return;
    }

    Array.from(element.attributes).forEach(attribute => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (
        name.startsWith('on') ||
        name === 'style' ||
        name === 'tabindex' ||
        value.startsWith('javascript:') ||
        value.includes('url(javascript:') ||
        ((name === 'href' || name === 'xlink:href') && tagName === 'use' && !value.startsWith('#'))
      ) {
        element.removeAttribute(attribute.name);
      }
    });

    Array.from(element.children).forEach(walk);
  };

  walk(svg);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  return new XMLSerializer().serializeToString(svg);
}

export function sanitizeIconSvgString(svgText: string): string {
  if (!/<svg[\s>]/i.test(svgText)) {
    return '';
  }

  return svgText
    .replace(BLOCKED_SVG_TAG_PATTERN, '')
    .replace(EVENT_HANDLER_ATTR_PATTERN, '')
    .replace(BLOCKED_ATTR_PATTERN, '')
    .replace(JAVASCRIPT_ATTR_VALUE_PATTERN, '')
    .replace(HREF_ATTR_PATTERN, (match, _name, rawValue) => {
      const value = String(rawValue).replace(/^['"]|['"]$/g, '').trim().toLowerCase();
      return value.startsWith('#') ? match : '';
    })
    .replace(/<svg\b([^>]*)>/i, (_match, attributes) => {
      const cleanAttributes = String(attributes)
        .replace(/\s+aria-hidden\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/\s+focusable\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
      return `<svg${cleanAttributes} aria-hidden="true" focusable="false">`;
    })
    .trim();
}
