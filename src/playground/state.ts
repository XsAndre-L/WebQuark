// ==========================================================================
// CENTRAL REACTIVE SIGNALS ENGINE
// ==========================================================================

export interface Signal<T> {
  (): T;
  set(newValue: T): void;
  update(fn: (v: T) => T): void;
}

let activeEffect: (() => void) | null = null;
const registeredEffects = new Set<() => void>();

export function signal<T>(initialValue: T): Signal<T>;
export function signal<T = undefined>(): Signal<T | undefined>;
export function signal<T>(initialValue?: T): Signal<any> {
  let value = initialValue;
  const subscribers = new Set<() => void>();

  const getter = () => {
    if (activeEffect) {
      subscribers.add(activeEffect);
    }
    return value;
  };

  getter.set = (newValue: T) => {
    if (value !== newValue) {
      value = newValue;
      // Copy and run all effects to prevent issues if effects modify subscribers
      [...subscribers].filter(fn => registeredEffects.has(fn)).forEach(run => run());
    }
  };

  getter.update = (fn: (v: T) => T) => {
    getter.set(fn(value as T));
  };

  return getter;
}

export function effect(fn: () => void): () => void {
  const run = () => {
    activeEffect = run;
    try {
      fn();
    } finally {
      activeEffect = null;
    }
  };
  registeredEffects.add(run);
  run();
  return () => registeredEffects.delete(run);
}

export function computed<T>(fn: () => T): () => T {
  const derived = signal<T>();
  effect(() => {
    derived.set(fn());
  });
  return derived as unknown as () => T;
}

// ==========================================================================
// PLAYGROUND SHARED REACTIVE STATE
// ==========================================================================

export interface PropSpec {
  type: string;
  default: any;
  currentValue?: any;
  options?: any[];
  description?: string;
}

export interface SlotSpec {
  default?: string;
  currentValue?: string;
  description?: string;
}

export interface ComponentSpec {
  tag: string;
  name: string;
  description?: string;
  props?: Record<string, PropSpec>;
  slots?: Record<string, SlotSpec>;
  options?: any[];
  stageHelper?: {
    label: string;
    buttonId: string;
    buttonLabel: string;
  };
  variants?: any[];
  edgeCases?: any[];
}

const SPEC_BASE_URL = '/playground/specs';

export const activeComponent = signal<string>('q-button');
export const activeTab = signal<string>('sandbox'); // 'sandbox', 'variants', 'edgecases'
export const theme = signal<string>(document.documentElement.getAttribute('data-theme') || 'dark');
export const componentRegistry = signal<Record<string, ComponentSpec>>({});

// Computed active specification
export const activeSpec = computed<ComponentSpec | null>(() => {
  const registry = componentRegistry();
  const active = activeComponent();
  return registry[active] || null;
});

// Dynamic component spec fetcher
export async function fetchComponentSpec(tag: string): Promise<void> {
  const registry = { ...componentRegistry() };
  if (registry[tag]) return;

  try {
    const res = await fetch(`${SPEC_BASE_URL}/${tag}.sandbox.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const spec = (await res.json()) as ComponentSpec;

    // Seed spec props and slots with defaults
    if (spec.props) {
      Object.keys(spec.props).forEach(p => {
        if (spec.props) {
          spec.props[p].currentValue = spec.props[p].default;
        }
      });
    }
    if (spec.slots) {
      Object.keys(spec.slots).forEach(s => {
        if (spec.slots) {
          spec.slots[s].currentValue = spec.slots[s].default || '';
        }
      });
    }

    registry[tag] = spec;
    componentRegistry.set(registry);
  } catch (err) {
    console.error(`Failed to fetch spec for ${tag}:`, err);
  }
}

// Updates prop/slot values from controls
export function updateKnobValue(type: 'prop' | 'slot', name: string, value: any): void {
  const registry = { ...componentRegistry() };
  const spec = registry[activeComponent()];
  if (!spec) return;

  if (type === 'prop' && spec.props) {
    spec.props[name].currentValue = value;
  } else if (type === 'slot' && spec.slots) {
    spec.slots[name].currentValue = value;
  }

  // Trigger signal change to update all subscribers
  componentRegistry.set(registry);
}

export function serializeComponentCode(
  tag: string,
  props?: Record<string, PropSpec | any>,
  slots?: Record<string, SlotSpec | any> | string,
  appendScript: string | null = null
): string {
  let code = `<${tag}`;

  if (props) {
    Object.keys(props).forEach(k => {
      const p = props[k];
      const val = (p && typeof p === 'object' && 'currentValue' in p) ? p.currentValue : p;
      if (val === true) {
        code += ` ${k}`;
      } else if (val !== undefined && val !== null && val !== '') {
        code += ` ${k}="${val}"`;
      }
    });
  }

  code += '>';

  let slotContent = '';
  if (slots) {
    if (typeof slots === 'string') {
      if (slots) {
        slotContent += `\n  ${slots.replace(/\n/g, '\n  ')}\n`;
      }
    } else {
      Object.keys(slots).forEach(slotName => {
        const s = slots[slotName];
        const val = (s && typeof s === 'object' && 'currentValue' in s) ? s.currentValue : s;
        if (val) {
          if (slotName === 'default') {
            slotContent += `\n  ${val.replace(/\n/g, '\n  ')}\n`;
          } else {
            if (typeof val === 'string' && val.includes(`slot="${slotName}"`)) {
              slotContent += `\n  ${val.replace(/\n/g, '\n  ')}\n`;
            } else {
              slotContent += `\n  <span slot="${slotName}">${val.replace(/\n/g, '\n  ')}</span>\n`;
            }
          }
        }
      });
    }
  }

  if (slotContent) {
    code += slotContent + `</${tag}>`;
  } else {
    code += `</${tag}>`;
  }

  if (appendScript) {
    code += appendScript;
  }

  return code;
}
