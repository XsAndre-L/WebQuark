import type { QIconAttributes, QIconNode } from '../icon.types';

export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
export const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';
export const MAX_ICON_DEPTH = 16;
export const MAX_ICON_NODES = 512;
export const MAX_ICON_ATTRIBUTES = 64;
export const MAX_ICON_ATTRIBUTE_BYTES = 65_536;
export const MAX_ICON_SVG_BYTES = 131_072;
export const MAX_ICON_EXPANDED_NODES = 4_096;

const PRESENTATION = new Set([
  'id', 'class', 'fill', 'fill-opacity', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width',
  'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray',
  'stroke-dashoffset', 'opacity', 'transform', 'clip-path', 'mask', 'vector-effect', 'paint-order',
  'color', 'color-interpolation', 'display', 'visibility',
]);
const ELEMENT_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
  svg: ['xmlns', 'xmlns:xlink', 'viewBox', 'width', 'height', 'preserveAspectRatio', 'version', 'role', 'aria-hidden', 'focusable'],
  circle: ['cx', 'cy', 'r'], ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'x2', 'y1', 'y2'], rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  path: ['d', 'pathLength'], polygon: ['points', 'pathLength'], polyline: ['points', 'pathLength'],
  g: [], defs: [],
  clipPath: ['clipPathUnits'],
  mask: ['x', 'y', 'width', 'height', 'maskUnits', 'maskContentUnits', 'mask-type'],
  linearGradient: ['x1', 'x2', 'y1', 'y2', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'href', 'xlink:href'],
  radialGradient: ['cx', 'cy', 'r', 'fx', 'fy', 'fr', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'href', 'xlink:href'],
  stop: ['offset', 'stop-color', 'stop-opacity'],
  symbol: ['viewBox', 'preserveAspectRatio', 'x', 'y', 'width', 'height', 'refX', 'refY'],
  use: ['x', 'y', 'width', 'height', 'href', 'xlink:href'],
};
const LOCAL_FRAGMENT = /^#[^\s#"'()<>\\]+$/;
const LOCAL_URL = /^url\(\s*(['"]?)(#[^\s#"'()<>\\]+)\1\s*\)(?:\s+(none|currentColor|[a-z]+|#[a-f\d]{3,8}))?$/i;
const COLOR = /^(?:[a-z]+|#[a-f\d]{3,8}|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+/-]+\))$/i;

export interface IconBudget { nodes: number; attributeBytes: number }

export function createIconBudget(): IconBudget {
  return { nodes: 0, attributeBytes: 0 };
}

export function assertIconNode(tag: unknown, depth: number, budget: IconBudget, context: string): asserts tag is string {
  if (typeof tag !== 'string' || tag === 'svg' || !Object.prototype.hasOwnProperty.call(ELEMENT_ATTRIBUTES, tag)) {
    throw new TypeError(`${context} contains an unsupported SVG element: ${String(tag)}.`);
  }
  if (depth > MAX_ICON_DEPTH) throw new TypeError(`${context} exceeds the maximum icon node depth of ${MAX_ICON_DEPTH}.`);
  if (++budget.nodes > MAX_ICON_NODES) throw new TypeError(`Icon definitions may contain at most ${MAX_ICON_NODES} SVG nodes.`);
}

function reference(value: string): string | undefined {
  const match = LOCAL_URL.exec(value.trim());
  return match?.[2].slice(1);
}

export function cloneIconAttributes(value: unknown, tag: string, budget: IconBudget, context: string): QIconAttributes {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${context} must be an object of string SVG attributes.`);
  }
  const attributes: Record<string, string> = {};
  let count = 0;
  for (const name in value) {
    if (!Object.prototype.hasOwnProperty.call(value, name)) continue;
    if (++count > MAX_ICON_ATTRIBUTES) throw new TypeError(`${context} exceeds ${MAX_ICON_ATTRIBUTES} attributes.`);
    if (!PRESENTATION.has(name) && !ELEMENT_ATTRIBUTES[tag]?.includes(name) && !/^(?:data|aria)-[a-z][a-z\d_.-]*$/.test(name)) {
      throw new TypeError(`${context} contains an unsupported SVG attribute: ${name}.`);
    }
    const raw = (value as Record<string, unknown>)[name];
    if (typeof raw !== 'string') throw new TypeError(`${context}.${name} must be a string.`);
    if (raw.length > MAX_ICON_ATTRIBUTE_BYTES) throw new TypeError(`${context} exceeds the icon attribute byte budget.`);
    const bytes = new TextEncoder().encode(raw).byteLength;
    budget.attributeBytes += bytes;
    if (bytes > MAX_ICON_ATTRIBUTE_BYTES || budget.attributeBytes > MAX_ICON_SVG_BYTES) {
      throw new TypeError(`${context} exceeds the icon attribute byte budget.`);
    }
    const trimmed = raw.trim();
    if (/javascript\s*:|vbscript\s*:/i.test(raw)) throw new TypeError(`${context}.${name} contains an unsafe SVG attribute value.`);
    if (name === 'xmlns' && raw !== SVG_NAMESPACE || name === 'xmlns:xlink' && raw !== XLINK_NAMESPACE) {
      throw new TypeError(`${context}.${name} contains an unsupported SVG namespace.`);
    }
    if (name === 'href' || name === 'xlink:href') {
      if (!LOCAL_FRAGMENT.test(trimmed)) throw new TypeError(`${context}.${name} must reference an element in the same SVG.`);
    } else if (['fill', 'stroke', 'color', 'stop-color'].includes(name)) {
      if (!COLOR.test(trimmed) && !LOCAL_URL.test(trimmed)) throw new TypeError(`${context}.${name} must be an inert color or local SVG resource.`);
    } else if (name === 'clip-path' || name === 'mask') {
      if (trimmed !== 'none' && !LOCAL_URL.test(trimmed)) throw new TypeError(`${context}.${name} must reference a local SVG resource.`);
    } else if (/url\s*\(/i.test(raw)) {
      throw new TypeError(`${context}.${name} contains an unsupported SVG resource reference.`);
    }
    attributes[name] = raw;
  }
  return Object.freeze(attributes);
}

export function cloneIconNodes(value: unknown, budget: IconBudget, context: string, depth = 1,
  cloneAttributes = cloneIconAttributes): readonly QIconNode[] {
  if (!Array.isArray(value)) throw new TypeError(`${context} must be an array of SVG nodes.`);
  if (value.length > MAX_ICON_NODES - budget.nodes) throw new TypeError(`Icon definitions may contain at most ${MAX_ICON_NODES} SVG nodes.`);
  return Object.freeze(value.map((node, index): QIconNode => {
    const nodeContext = `${context}[${index}]`;
    if (!Array.isArray(node) || node.length < 2 || node.length > 3) throw new TypeError(`${nodeContext} must be a [tagName, attributes, children?] tuple.`);
    const [tag, rawAttributes, children] = node;
    assertIconNode(tag, depth, budget, nodeContext);
    const attributes = cloneAttributes(rawAttributes, tag, budget, `${nodeContext}[1]`);
    return Object.freeze(children === undefined ? [tag, attributes] as const
      : [tag, attributes, cloneIconNodes(children, budget, `${nodeContext}[2]`, depth + 1, cloneAttributes)] as const);
  }));
}

/** Local references must stay in this icon and cannot hide cyclic/exponential trees. */
export function validateIconReferences(nodes: readonly QIconNode[], rootAttributes?: QIconAttributes): void {
  const all: QIconNode[] = [];
  const ids = new Map<string, QIconNode>();
  const collect = (items: readonly QIconNode[]) => {
    for (const node of items) {
      all.push(node);
      const id = node[1].id;
      if (id !== undefined) {
        if (!LOCAL_FRAGMENT.test(`#${id}`) || ids.has(id)) throw new TypeError('SVG IDs must be nonempty and unique within the icon.');
        ids.set(id, node);
      }
      if (node[2]) collect(node[2]);
    }
  };
  collect(nodes);
  const rootId = rootAttributes?.id;
  if (rootId !== undefined && (!LOCAL_FRAGMENT.test(`#${rootId}`) || ids.has(rootId))) {
    throw new TypeError('SVG IDs must be nonempty and unique within the icon.');
  }
  const edges = (attributes: QIconAttributes): QIconNode[] => Object.entries(attributes).flatMap(([name, value]) => {
    const id = name === 'href' || name === 'xlink:href' ? value.trim().slice(1) : reference(value);
    if (id === undefined) return [];
    if (id === rootId) throw new TypeError('SVG references must target child elements, not the SVG root.');
    const target = ids.get(id);
    if (!target) throw new TypeError(`SVG reference #${id} must resolve within the same SVG.`);
    if (name === 'mask' && target[0] !== 'mask' || name === 'clip-path' && target[0] !== 'clipPath'
      || ['fill', 'stroke', 'color', 'stop-color'].includes(name) && !['linearGradient', 'radialGradient'].includes(target[0])) {
      throw new TypeError(`SVG reference #${id} has an unsupported resource target.`);
    }
    return [target];
  });
  const references = new Map(all.map(node => [node, edges(node[1])]));
  const rootReferences = rootAttributes ? edges(rootAttributes) : [];
  const memo = new Map<QIconNode, { count: number; height: number }>();
  const active = new Set<QIconNode>();
  const cost = (node: QIconNode, depth: number): number => {
    if (active.has(node)) throw new TypeError('SVG references must not form a cycle.');
    if (depth > MAX_ICON_DEPTH * 2) throw new TypeError('SVG reference expansion exceeds the depth budget.');
    const cached = memo.get(node);
    if (cached !== undefined) {
      if (depth + cached.height - 1 > MAX_ICON_DEPTH * 2) throw new TypeError('SVG reference expansion exceeds the depth budget.');
      return cached.count;
    }
    active.add(node);
    let count = 1;
    let height = 1;
    for (const child of [...(node[2] ?? []), ...(references.get(node) ?? [])]) {
      count += cost(child, depth + 1);
      height = Math.max(height, 1 + memo.get(child)!.height);
      if (count > MAX_ICON_EXPANDED_NODES) throw new TypeError('SVG reference expansion exceeds the node budget.');
    }
    active.delete(node);
    memo.set(node, { count, height });
    return count;
  };
  let count = 0;
  for (const node of [...nodes, ...rootReferences]) {
    count += cost(node, 1);
    if (count > MAX_ICON_EXPANDED_NODES) throw new TypeError('SVG reference expansion exceeds the node budget.');
  }
}
