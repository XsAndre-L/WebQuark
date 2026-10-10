import type { QIconNode } from '../icon.types';
import {
  SVG_NAMESPACE, XLINK_NAMESPACE, MAX_ICON_ATTRIBUTES, MAX_ICON_SVG_BYTES,
  assertIconNode, cloneIconAttributes, cloneIconNodes, createIconBudget, validateIconReferences,
} from './policy';

/** Fail closed without a real XML parser; no regex recovery or browser work at import. */
export function sanitizeIconSvg(svgText: string): string {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined'
    || typeof svgText !== 'string' || svgText.length > MAX_ICON_SVG_BYTES
    || new TextEncoder().encode(svgText).byteLength > MAX_ICON_SVG_BYTES
    || /<!\s*(?:DOCTYPE|ENTITY)/i.test(svgText)) return '';
  try {
    const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const root = parsed.documentElement;
    if (parsed.doctype || !root || root.tagName !== 'svg'
      || parsed.getElementsByTagName('parsererror').length || ![null, SVG_NAMESPACE].includes(root.namespaceURI)) return '';
    for (const child of Array.from(parsed.childNodes)) {
      if (child !== root && child.nodeType !== 8 && !(child.nodeType === 3 && !child.textContent?.trim())) return '';
    }
    const namespace = root.namespaceURI;
    const readAttributes = (element: Element): Record<string, string> => {
      if (element.attributes.length > MAX_ICON_ATTRIBUTES) throw new TypeError('SVG attribute limit exceeded.');
      const attributes: Record<string, string> = {};
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name === 'xlink:href') {
          if (attribute.namespaceURI !== XLINK_NAMESPACE) throw new TypeError('Unsupported SVG attribute namespace.');
        } else if (attribute.namespaceURI && attribute.namespaceURI !== 'http://www.w3.org/2000/xmlns/') {
          throw new TypeError('Unsupported SVG attribute namespace.');
        }
        attributes[attribute.name] = attribute.value;
      }
      return attributes;
    };
    const parseBudget = createIconBudget();
    const readChildren = (element: Element, depth: number): QIconNode[] => {
      const children: QIconNode[] = [];
      for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === 8 || child.nodeType === 3 && !child.textContent?.trim()) continue;
        if (child.nodeType !== 1) throw new TypeError('Unsupported SVG content.');
        const node = child as Element;
        if (node.namespaceURI !== namespace) throw new TypeError('Unsupported SVG element namespace.');
        assertIconNode(node.tagName, depth, parseBudget, 'Fetched SVG');
        children.push([node.tagName, readAttributes(node), readChildren(node, depth + 1)]);
      }
      return children;
    };
    const rawNodes = readChildren(root, 1);
    const budget = createIconBudget();
    const attributes = cloneIconAttributes(readAttributes(root), 'svg', budget, 'Fetched SVG root');
    const nodes = cloneIconNodes(rawNodes, budget, 'Fetched SVG nodes');
    validateIconReferences(nodes, attributes);
    const output = parsed.implementation.createDocument(SVG_NAMESPACE, 'svg', null);
    const apply = (element: Element, attrs: Readonly<Record<string, string>>) => {
      for (const [name, value] of Object.entries(attrs)) {
        if (name === 'xmlns' || name === 'xmlns:xlink') continue;
        if (name === 'xlink:href') element.setAttributeNS(XLINK_NAMESPACE, name, value);
        else element.setAttribute(name, value);
      }
    };
    const append = (parent: Element, items: readonly QIconNode[]) => {
      for (const [tag, attrs, children] of items) {
        const element = output.createElementNS(SVG_NAMESPACE, tag);
        apply(element, attrs);
        if (children) append(element, children);
        parent.appendChild(element);
      }
    };
    apply(output.documentElement, attributes);
    output.documentElement.setAttribute('aria-hidden', 'true');
    output.documentElement.setAttribute('focusable', 'false');
    append(output.documentElement, nodes);
    return new XMLSerializer().serializeToString(output.documentElement);
  } catch (_) {
    return '';
  }
}
