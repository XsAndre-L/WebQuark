export interface Signal<T> {
  (): T;
  set(value: T): void;
  update(fn: (value: T) => T): void;
}

interface Subscriber {
  run(): void;
  dependencies: Set<Set<Subscriber>>;
}

let activeEffect: Subscriber | undefined;

export function signal<T>(initialValue: T): Signal<T> {
  const subscribers = new Set<Subscriber>();
  let value = initialValue;

  const read = () => {
    if (activeEffect) {
      subscribers.add(activeEffect);
      activeEffect.dependencies.add(subscribers);
    }
    return value;
  };

  read.set = (next: T) => {
    if (Object.is(value, next)) return;
    value = next;
    for (const subscriber of [...subscribers]) {
      if (subscribers.has(subscriber)) subscriber.run();
    }
  };
  read.update = (fn: (previous: T) => T) => read.set(fn(value));
  return read;
}

export function effect(fn: () => void): () => void {
  const detach = () => {
    for (const source of subscriber.dependencies) source.delete(subscriber);
    subscriber.dependencies.clear();
  };
  const subscriber: Subscriber = {
    dependencies: new Set(),
    run() {
      detach();
      const previous = activeEffect;
      activeEffect = subscriber;
      try { fn(); } finally { activeEffect = previous; }
    },
  };
  subscriber.run();
  return detach;
}

export interface PropSpec {
  type: string;
  default?: any;
  currentValue?: any;
  options?: any[];
  description?: string;
  desc?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface SlotSpec {
  type?: string;
  default?: string;
  currentValue?: string;
  description?: string;
  desc?: string;
}

export interface Example {
  name: string;
  props?: Record<string, any>;
  slots?: Record<string, string>;
  slot?: string;
}

export interface ComponentSpec {
  tag: string;
  name: string;
  description?: string;
  props?: Record<string, PropSpec>;
  slots?: Record<string, SlotSpec>;
  options?: any[];
  stageHelper?: { label: string; buttonId: string; buttonLabel: string };
  variants?: Example[];
  edgeCases?: Example[];
}

export const activeComponent = signal('q-button');
export const activeTab = signal('sandbox');
export const theme = signal(document.documentElement.getAttribute('data-theme') || 'dark');
export const componentRegistry = signal<Record<string, ComponentSpec>>({});
export const specErrors = signal<Record<string, string>>({});
const pending = new Map<string, Promise<void>>();

export function fetchComponentSpec(tag: string): Promise<void> {
  if (componentRegistry()[tag]) return Promise.resolve();
  const loading = pending.get(tag);
  if (loading) return loading;

  specErrors.update(previous => ({ ...previous, [tag]: '' }));
  const task = loadSpec(tag).finally(() => pending.delete(tag));
  pending.set(tag, task);
  return task;
}

async function loadSpec(tag: string): Promise<void> {
  try {
    const response = await fetch('/playground/specs/' + encodeURIComponent(tag) + '.sandbox.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const spec: ComponentSpec = await response.json();
    if (spec.tag !== tag) throw new Error('Unexpected component tag');

    for (const prop of Object.values(spec.props || {})) prop.currentValue = prop.default;
    for (const slot of Object.values(spec.slots || {})) slot.currentValue = slot.default ?? '';
    componentRegistry.update(current => ({ ...current, [tag]: spec }));
  } catch (error) {
    specErrors.update(previous => ({ ...previous, [tag]: String(error) }));
  }
}

export function updateKnobValue(type: 'prop' | 'slot', name: string, value: any, tag = activeComponent()): void {
  if (tag !== activeComponent()) return;
  const registry = componentRegistry();
  const spec = registry[tag];
  const field = (type === 'prop' ? spec?.props : spec?.slots)?.[name];
  if (!field || Object.is(field.currentValue, value)) return;
  field.currentValue = value;
  componentRegistry.set({ ...registry });
}

export function resetComponentProperties(): void {
  const registry = componentRegistry();
  const properties = registry[activeComponent()]?.props;
  if (!properties) return;

  for (const prop of Object.values(properties)) {
    prop.currentValue = prop.default;
  }
  componentRegistry.set({ ...registry });
}
