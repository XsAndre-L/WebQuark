import type {
  QIconAttributes,
  QIconConfiguration,
  QIconDefinition,
  QIconNode,
  QIconRegistry,
} from '../icon.types';

const REGISTRY_STATE_KEY = Symbol.for('@webquark/core:q-icon-registry:v1');
const ICON_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/;
const ATTRIBUTE_NAME_PATTERN = /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/;
const MAX_ICON_NAME_LENGTH = 128;
const MAX_NODE_DEPTH = 16;
const MAX_NODE_COUNT = 512;
const SAFE_SVG_ELEMENTS = new Set([
  'circle',
  'clipPath',
  'defs',
  'ellipse',
  'g',
  'line',
  'linearGradient',
  'mask',
  'path',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'stop',
  'symbol',
  'use',
]);

interface QIconRuntimeState {
  version: 1;
  registry: ReadonlyMap<string, QIconDefinition>;
  strict: boolean;
}

function getRuntimeState(): QIconRuntimeState {
  const globalRecord = globalThis as typeof globalThis & { [key: symbol]: unknown };
  const existing = globalRecord[REGISTRY_STATE_KEY] as QIconRuntimeState | undefined;

  if (existing?.version === 1 && existing.registry instanceof Map && typeof existing.strict === 'boolean') {
    return existing;
  }

  const state: QIconRuntimeState = {
    version: 1,
    registry: new Map(),
    strict: false,
  };

  Object.defineProperty(globalRecord, REGISTRY_STATE_KEY, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: state,
  });

  return state;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function containsExternalResourceReference(value: string): boolean {
  const references = Array.from(value.matchAll(/url\s*\(([^)]*)\)/gi));
  return references.some(([, rawReference]) => {
    const reference = rawReference.trim().replace(/^(['"])(.*)\1$/, '$2').trim();
    return !reference.startsWith('#');
  });
}

function assertPositiveDimension(value: unknown, field: string, context: string): void {
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) {
    throw new TypeError(`${context}.${field} must be a positive finite number.`);
  }
}

function cloneAttributes(value: unknown, context: string): QIconAttributes {
  if (!isRecord(value)) {
    throw new TypeError(`${context} must be an object of string SVG attributes.`);
  }

  const attributes: Record<string, string> = {};

  for (const [name, rawValue] of Object.entries(value)) {
    if (!ATTRIBUTE_NAME_PATTERN.test(name) || name.toLowerCase().startsWith('on')) {
      throw new TypeError(`${context} contains an unsafe SVG attribute name: ${name}.`);
    }
    if (name.toLowerCase() === 'style' || name.toLowerCase() === 'src') {
      throw new TypeError(`${context} contains an unsupported SVG attribute: ${name}.`);
    }
    if (typeof rawValue !== 'string') {
      throw new TypeError(`${context}.${name} must be a string.`);
    }

    const normalizedValue = rawValue.trim().toLowerCase();
    if (normalizedValue.includes('javascript:')) {
      throw new TypeError(`${context}.${name} contains an unsafe SVG attribute value.`);
    }
    if ((name.toLowerCase() === 'href' || name.toLowerCase() === 'xlink:href') && !normalizedValue.startsWith('#')) {
      throw new TypeError(`${context}.${name} must reference an element in the same SVG.`);
    }
    if (containsExternalResourceReference(rawValue)) {
      throw new TypeError(`${context}.${name} must not reference an external resource.`);
    }

    attributes[name] = rawValue;
  }

  return Object.freeze(attributes);
}

function cloneNode(value: unknown, context: string, depth: number, nodeCounter: { value: number }): QIconNode {
  if (!Array.isArray(value) || (value.length !== 2 && value.length !== 3)) {
    throw new TypeError(`${context} must be a [tagName, attributes, children?] tuple.`);
  }
  if (depth > MAX_NODE_DEPTH) {
    throw new TypeError(`${context} exceeds the maximum icon node depth of ${MAX_NODE_DEPTH}.`);
  }

  nodeCounter.value += 1;
  if (nodeCounter.value > MAX_NODE_COUNT) {
    throw new TypeError(`Icon definitions may contain at most ${MAX_NODE_COUNT} SVG nodes.`);
  }

  const [tagName, rawAttributes, rawChildren] = value;
  if (typeof tagName !== 'string' || !SAFE_SVG_ELEMENTS.has(tagName)) {
    throw new TypeError(`${context} contains an unsupported SVG element: ${String(tagName)}.`);
  }

  const attributes = cloneAttributes(rawAttributes, `${context}[1]`);
  if (rawChildren === undefined) {
    return Object.freeze([tagName, attributes] as const);
  }
  if (!Array.isArray(rawChildren)) {
    throw new TypeError(`${context}[2] must be an array of SVG nodes.`);
  }

  const children = Object.freeze(rawChildren.map((child, index) => (
    cloneNode(child, `${context}[2][${index}]`, depth + 1, nodeCounter)
  )));

  return Object.freeze([tagName, attributes, children] as const);
}

export function prepareQIconDefinition(value: unknown, context = 'Icon definition'): QIconDefinition {
  if (!isRecord(value) || !Array.isArray(value.node)) {
    throw new TypeError(`${context} must contain a node array.`);
  }

  assertPositiveDimension(value.size, 'size', context);
  assertPositiveDimension(value.width, 'width', context);
  assertPositiveDimension(value.height, 'height', context);

  if ((value.width === undefined) !== (value.height === undefined)) {
    throw new TypeError(`${context}.width and ${context}.height must be provided together.`);
  }
  if (value.name !== undefined && typeof value.name !== 'string') {
    throw new TypeError(`${context}.name must be a string when provided.`);
  }

  const nodeCounter = { value: 0 };
  const node = Object.freeze(value.node.map((child, index) => (
    cloneNode(child, `${context}.node[${index}]`, 1, nodeCounter)
  )));
  const attributes = value.attributes === undefined
    ? undefined
    : cloneAttributes(value.attributes, `${context}.attributes`);

  const definition: QIconDefinition = {
    ...(value.name === undefined ? {} : { name: value.name as string }),
    node,
    ...(value.size === undefined ? {} : { size: value.size as number }),
    ...(value.width === undefined ? {} : { width: value.width as number, height: value.height as number }),
    ...(attributes === undefined ? {} : { attributes }),
  };

  return Object.freeze(definition);
}

/**
 * Atomically replaces the complete icon registry. Call once with an app-owned
 * manifest before defining or bootstrapping WebQuark components.
 */
export function registerQIcons(registry: QIconRegistry): void {
  if (!isRecord(registry)) {
    throw new TypeError('QIcon registry must be an object keyed by icon name.');
  }

  const nextRegistry = new Map<string, QIconDefinition>();

  for (const [rawName, definition] of Object.entries(registry)) {
    const name = rawName.trim();
    if (name !== rawName || name.length > MAX_ICON_NAME_LENGTH || !ICON_NAME_PATTERN.test(name)) {
      throw new TypeError(`Invalid q-icon registry name: ${JSON.stringify(rawName)}.`);
    }
    nextRegistry.set(name, prepareQIconDefinition(definition, `Icon definition ${JSON.stringify(name)}`));
  }

  getRuntimeState().registry = nextRegistry;
}

/** Configures whether unknown icon names may use URL and fetch fallbacks. */
export function configureQIcons(configuration: QIconConfiguration): void {
  if (!isRecord(configuration) || typeof configuration.strict !== 'boolean') {
    throw new TypeError('QIcon configuration must provide a boolean strict value.');
  }

  getRuntimeState().strict = configuration.strict;
}

export function resolveRegisteredQIcon(name: string | undefined): QIconDefinition | undefined {
  const normalizedName = name?.trim();
  return normalizedName ? getRuntimeState().registry.get(normalizedName) : undefined;
}

export function isQIconStrictMode(): boolean {
  return getRuntimeState().strict;
}
