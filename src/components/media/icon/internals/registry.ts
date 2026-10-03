import type {
  QIconConfiguration,
  QIconAttributes,
  QIconDefinition,
  QIconRegistry,
} from '../icon.types';

import {
  cloneIconAttributes, cloneIconNodes, createIconBudget, validateIconReferences,
  MAX_ICON_ATTRIBUTES, MAX_ICON_ATTRIBUTE_BYTES, MAX_ICON_SVG_BYTES,
} from './policy';
import type { IconBudget } from './policy';

const REGISTRY_STATE_KEY = Symbol.for('@webquark/core:q-icon-registry:v1');
const ICON_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/;
const MAX_ICON_NAME_LENGTH = 128;

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

function assertPositiveDimension(value: unknown, field: string, context: string): void {
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) {
    throw new TypeError(`${context}.${field} must be a positive finite number.`);
  }
}

/** Lucide node keys are inert library metadata, never SVG attributes. */
function cloneRegisteredIconAttributes(value: unknown, tag: string, budget: IconBudget, context: string): QIconAttributes {
  if (!isRecord(value) || !Object.prototype.propertyIsEnumerable.call(value, 'key')) {
    return cloneIconAttributes(value, tag, budget, context);
  }
  const descriptor = Object.getOwnPropertyDescriptor(value, 'key')!;
  if (!('value' in descriptor) || typeof descriptor.value !== 'string') {
    throw new TypeError(`${context}.key must be a string data property.`);
  }
  const key = descriptor.value;
  if (key.length > MAX_ICON_ATTRIBUTE_BYTES) throw new TypeError(`${context} exceeds the icon attribute byte budget.`);
  const bytes = new TextEncoder().encode(key).byteLength;
  budget.attributeBytes += bytes;
  if (bytes > MAX_ICON_ATTRIBUTE_BYTES || budget.attributeBytes > MAX_ICON_SVG_BYTES) {
    throw new TypeError(`${context} exceeds the icon attribute byte budget.`);
  }
  const attributes = Object.create(null);
  let count = 0;
  for (const name in value) {
    if (!Object.prototype.hasOwnProperty.call(value, name)) continue;
    if (++count > MAX_ICON_ATTRIBUTES) throw new TypeError(`${context} exceeds ${MAX_ICON_ATTRIBUTES} attributes.`);
    if (name !== 'key') {
      // Preserve strict validation order: unknown attributes are rejected before getters are read.
      Object.defineProperty(attributes, name, Object.getOwnPropertyDescriptor(value, name)!);
    }
  }
  return cloneIconAttributes(attributes, tag, budget, context);
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

  const budget = createIconBudget();
  const node = cloneIconNodes(value.node, budget, `${context}.node`, 1, cloneRegisteredIconAttributes);
  const attributes = value.attributes === undefined
    ? undefined
    : cloneIconAttributes(value.attributes, 'svg', budget, `${context}.attributes`);

  validateIconReferences(node, attributes);

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
