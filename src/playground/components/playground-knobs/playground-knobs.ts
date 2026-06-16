import { activeComponent, activeTab, componentRegistry, updateKnobValue, effect, PropSpec, ComponentSpec } from '../../state';
import html from './playground-knobs.html';
import css from './playground-knobs.css';

const CONTROL_FACTORY: Record<string, (propName: string, prop: PropSpec) => HTMLElement> = {
  boolean: (propName, prop) => {
    const toggle = document.createElement('q-toggle') as any;
    toggle.type = 'switch';
    toggle.dataset.prop = propName;
    toggle.checked = prop.currentValue;
    toggle.addEventListener('qChange', (e: CustomEvent) => updateKnobValue('prop', propName, e.detail));
    return toggle;
  },
  select: (propName, prop) => {
    const dropdown = document.createElement('q-dropdown') as any;
    dropdown.dataset.prop = propName;
    dropdown.value = prop.currentValue;
    if (prop.options) {
      dropdown.options = prop.options.map(opt => ({ label: opt || '(none)', value: opt }));
    }
    dropdown.addEventListener('qChange', (e: CustomEvent) => updateKnobValue('prop', propName, e.detail));
    return dropdown;
  },
  number: (propName, prop) => {
    const input = document.createElement('q-input') as any;
    input.type = 'number';
    input.dataset.prop = propName;
    input.value = prop.currentValue;
    input.addEventListener('qInput', (e: CustomEvent) => updateKnobValue('prop', propName, e.detail));
    return input;
  },
};

function createPropControl(propName: string, prop: PropSpec): HTMLElement {
  const factory = CONTROL_FACTORY[prop.type];
  if (factory) return factory(propName, prop);
  const input = document.createElement('q-input') as any;
  input.type = 'text';
  input.dataset.prop = propName;
  input.value = prop.currentValue;
  input.addEventListener('qInput', (e: CustomEvent) => updateKnobValue('prop', propName, e.detail));
  return input;
}

class PlaygroundKnobs extends HTMLElement {
  private panel: HTMLElement | null = null;
  private attrContainer: HTMLElement | null = null;
  private slotContainer: HTMLElement | null = null;
  private cleanupKnobsEffect?: () => void;

  connectedCallback(): void {
    // 1. Inject template HTML
    this.innerHTML = html;

    // 2. Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'playground-knobs-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css;
      document.head.appendChild(style);
    }

    this.init();
  }

  private init(): void {
    const toggleBtn = this.querySelector('#knobsToggleBtn') as HTMLElement | null;
    const closeBtn = this.querySelector('#knobsCloseBtn') as HTMLElement | null;
    this.panel = this.querySelector('#knobsPanel');
    this.attrContainer = this.querySelector('#attributeKnobs');
    this.slotContainer = this.querySelector('#slotKnobs');

    // Mobile drawer toggles
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.panel) this.panel.classList.add('open');
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.panel) this.panel.classList.remove('open');
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
        if (this.panel) this.panel.classList.remove('open');
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

  private buildKnobs(config: ComponentSpec): void {
    if (!this.attrContainer || !this.slotContainer) return;

    // A. Build Attribute Knobs
    this.attrContainer.innerHTML = '';
    if (config.props && Object.keys(config.props).length > 0) {
      Object.keys(config.props).forEach(propName => {
        if (config.props) {
          const prop = config.props[propName];
          const row = document.createElement('div');
          row.className = 'knob-row';

          const meta = document.createElement('div');
          meta.className = 'knob-meta';
          meta.innerHTML = `
            <span class="knob-label">${propName}</span>
            <span class="knob-label-sub">${prop.description || ''}</span>
          `;
          row.appendChild(meta);

          const inputWrapper = document.createElement('div');
          inputWrapper.appendChild(createPropControl(propName, prop));
          row.appendChild(inputWrapper);
          if (this.attrContainer) {
            this.attrContainer.appendChild(row);
          }
        }
      });
    } else {
      this.attrContainer.innerHTML = '<div class="knob-empty-state">No customizable attributes.</div>';
    }

    // B. Build Slot Knobs
    this.slotContainer.innerHTML = '';
    if (config.slots && Object.keys(config.slots).length > 0) {
      Object.keys(config.slots).forEach(slotName => {
        if (config.slots) {
          const slot = config.slots[slotName];
          const row = document.createElement('div');
          row.className = 'knob-row vertical';

          row.innerHTML = `
            <div class="knob-meta">
              <span class="knob-label">${slotName === 'default' ? 'default (Inner content)' : `slot="${slotName}"`}</span>
              <span class="knob-label-sub">${slot.description || ''}</span>
            </div>
          `;

          let input: any;
          if (slot.description && (slot.description.includes('textarea') || slot.description.includes('html'))) {
            input = document.createElement('q-textarea');
            input.rows = 4;
          } else {
            input = document.createElement('q-input');
            input.type = 'text';
          }

          input.dataset.slot = slotName;
          input.value = slot.currentValue;
          input.addEventListener('qInput', (e: CustomEvent) => {
            updateKnobValue('slot', slotName, e.detail);
          });

          row.appendChild(input);
          if (this.slotContainer) {
            this.slotContainer.appendChild(row);
          }
        }
      });
    } else {
      this.slotContainer.innerHTML = '<div class="knob-empty-state">No slot options configured.</div>';
    }
  }

  public closeKnobs(): void {
    if (this.panel) this.panel.classList.remove('open');
  }

  disconnectedCallback(): void {
    if (this.cleanupKnobsEffect) {
      this.cleanupKnobsEffect();
    }
  }
}

customElements.define('playground-knobs', PlaygroundKnobs);
export { PlaygroundKnobs };
