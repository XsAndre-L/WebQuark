import { loadComponentResources } from '../loader-helper.js';
import { activeComponent, activeTab, componentRegistry, updateKnobValue, effect } from '../../state.js';

const CONTROL_FACTORY = {
  boolean: (propName, prop) => {
    const toggle = document.createElement('q-toggle');
    toggle.type = 'switch';
    toggle.dataset.prop = propName;
    toggle.checked = prop.currentValue;
    toggle.addEventListener('qChange', e => updateKnobValue('prop', propName, e.detail));
    return toggle;
  },
  select: (propName, prop) => {
    const dropdown = document.createElement('q-dropdown');
    dropdown.dataset.prop = propName;
    dropdown.value = prop.currentValue;
    dropdown.options = prop.options.map(opt => ({ label: opt || '(none)', value: opt }));
    dropdown.addEventListener('qChange', e => updateKnobValue('prop', propName, e.detail));
    return dropdown;
  },
  number: (propName, prop) => {
    const input = document.createElement('q-input');
    input.type = 'number';
    input.dataset.prop = propName;
    input.value = prop.currentValue;
    input.addEventListener('qInput', e => updateKnobValue('prop', propName, e.detail));
    return input;
  },
};

function createPropControl(propName, prop) {
  const factory = CONTROL_FACTORY[prop.type];
  if (factory) return factory(propName, prop);
  const input = document.createElement('q-input');
  input.type = 'text';
  input.dataset.prop = propName;
  input.value = prop.currentValue;
  input.addEventListener('qInput', e => updateKnobValue('prop', propName, e.detail));
  return input;
}

class PlaygroundKnobs extends HTMLElement {
  async connectedCallback() {
    try {
      const html = await loadComponentResources('playground-knobs');
      this.innerHTML = html;
      this.init();
    } catch (err) {
      console.error('Failed to load knobs component:', err);
    }
  }

  init() {
    const toggleBtn = this.querySelector('#knobsToggleBtn');
    const closeBtn = this.querySelector('#knobsCloseBtn');
    this.panel = this.querySelector('#knobsPanel');
    this.attrContainer = this.querySelector('#attributeKnobs');
    this.slotContainer = this.querySelector('#slotKnobs');

    // Mobile drawer toggles
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.panel.classList.add('open');
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.panel.classList.remove('open');
      });
    }

    // React to Component state changes (Angular-style Signal Effect)
    this.cleanupKnobsEffect = effect(() => {
      const active = activeComponent();
      const tab = activeTab();
      const registry = componentRegistry();
      const config = registry[active];

      // 1. Manage visibility: only show Controls on Sandbox tab for normal components
      if (active === 'global-styling' || tab !== 'sandbox') {
        this.style.display = 'none';
        if (toggleBtn) toggleBtn.style.display = 'none';
        this.panel.classList.remove('open');
        return;
      }

      this.style.display = '';
      if (toggleBtn) toggleBtn.style.display = '';

      // 2. Build customization panels if config is loaded
      if (config) {
        this.buildKnobs(config);
      }
    });
  }

  buildKnobs(config) {
    if (!this.attrContainer || !this.slotContainer) return;

    // A. Build Attribute Knobs
    this.attrContainer.innerHTML = '';
    if (config.props && Object.keys(config.props).length > 0) {
      Object.keys(config.props).forEach(propName => {
        const prop = config.props[propName];
        const row = document.createElement('div');
        row.className = 'knob-row';

        const meta = document.createElement('div');
        meta.className = 'knob-meta';
        meta.innerHTML = `
          <span class="knob-label">${propName}</span>
          <span class="knob-label-sub">${prop.desc || ''}</span>
        `;
        row.appendChild(meta);

        const inputWrapper = document.createElement('div');
        inputWrapper.appendChild(createPropControl(propName, prop));
        row.appendChild(inputWrapper);
        this.attrContainer.appendChild(row);
      });
    } else {
      this.attrContainer.innerHTML = '<div class="knob-empty-state">No customizable attributes.</div>';
    }

    // B. Build Slot Knobs
    this.slotContainer.innerHTML = '';
    if (config.slots && Object.keys(config.slots).length > 0) {
      Object.keys(config.slots).forEach(slotName => {
        const slot = config.slots[slotName];
        const row = document.createElement('div');
        row.className = 'knob-row vertical';

        row.innerHTML = `
          <div class="knob-meta">
            <span class="knob-label">${slotName === 'default' ? 'default (Inner content)' : `slot="${slotName}"`}</span>
            <span class="knob-label-sub">${slot.desc || ''}</span>
          </div>
        `;

        let input;
        if (slot.type === 'textarea' || slot.type === 'html') {
          input = document.createElement('q-textarea');
          input.rows = 4;
        } else {
          input = document.createElement('q-input');
          input.type = 'text';
        }

        input.dataset.slot = slotName;
        input.value = slot.currentValue;
        input.addEventListener('qInput', (e) => {
          updateKnobValue('slot', slotName, e.detail);
        });

        row.appendChild(input);
        this.slotContainer.appendChild(row);
      });
    } else {
      this.slotContainer.innerHTML = '<div class="knob-empty-state">No slot options configured.</div>';
    }
  }

  closeKnobs() {
    if (this.panel) this.panel.classList.remove('open');
  }

  disconnectedCallback() {
    if (this.cleanupKnobsEffect) {
      this.cleanupKnobsEffect();
    }
  }
}

customElements.define('playground-knobs', PlaygroundKnobs);
export { PlaygroundKnobs };
