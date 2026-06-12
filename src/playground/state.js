// ==========================================================================
// CENTRAL REACTIVE SIGNALS ENGINE
// ==========================================================================

let activeEffect = null;

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
      [...subscribers].forEach(run => run());
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
  run();
  return () => {
    // Basic cleanup: remove this effect from all subscriptions
    // In our lightweight implementation, we just return a no-op or let the garbage collector clean it up if needed.
  };
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
    const res = await fetch(`/playground/specs/${tag}.spec.json`);
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
