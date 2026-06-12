// ==========================================================================
// CENTRAL REACTIVE SIGNALS ENGINE
// ==========================================================================

let activeEffect = null;
const registeredEffects = new Set();

export function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const getter = () => {
    if (activeEffect) {
      subscribers.add(activeEffect);
    }
    return value;
  };

  getter.set = (newValue) => {
    if (value !== newValue) {
      value = newValue;
      // Copy and run all effects to prevent issues if effects modify subscribers
      [...subscribers].filter(fn => registeredEffects.has(fn)).forEach(run => run());
    }
  };

  getter.update = (fn) => {
    getter.set(fn(value));
  };

  return getter;
}

export function effect(fn) {
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

export function computed(fn) {
  const derived = signal();
  effect(() => {
    derived.set(fn());
  });
  return derived;
}

// ==========================================================================
// PLAYGROUND SHARED REACTIVE STATE
// ==========================================================================

const SPEC_BASE_URL = '/playground/specs';

export const activeComponent = signal('q-button');
export const activeTab = signal('sandbox'); // 'sandbox', 'variants', 'edgecases'
export const theme = signal(document.documentElement.getAttribute('data-theme') || 'dark');
export const componentRegistry = signal({});

// Computed active specification
export const activeSpec = computed(() => {
  const registry = componentRegistry();
  const active = activeComponent();
  return registry[active] || null;
});

// Dynamic component spec fetcher
export async function fetchComponentSpec(tag) {
  const registry = { ...componentRegistry() };
  if (registry[tag]) return;

  try {
    const res = await fetch(`${SPEC_BASE_URL}/${tag}.spec.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const spec = await res.json();

    // Seed spec props and slots with defaults
    if (spec.props) {
      Object.keys(spec.props).forEach(p => {
        spec.props[p].currentValue = spec.props[p].default;
      });
    }
    if (spec.slots) {
      Object.keys(spec.slots).forEach(s => {
        spec.slots[s].currentValue = spec.slots[s].default || '';
      });
    }

    registry[tag] = spec;
    componentRegistry.set(registry);
  } catch (err) {
    console.error(`Failed to fetch spec for ${tag}:`, err);
  }
}

// Updates prop/slot values from controls
export function updateKnobValue(type, name, value) {
  const registry = { ...componentRegistry() };
  const spec = registry[activeComponent()];
  if (!spec) return;

  if (type === 'prop') {
    spec.props[name].currentValue = value;
  } else if (type === 'slot') {
    spec.slots[name].currentValue = value;
  }

  // Trigger signal change to update all subscribers
  componentRegistry.set(registry);
}

export function serializeComponentCode(tag, props, slots, appendScript = null) {
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
