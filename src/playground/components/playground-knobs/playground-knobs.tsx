import { h } from '../../dom-factory';
import { activeComponent, activeTab, componentRegistry, updateKnobValue, effect, PropSpec, ComponentSpec } from '../../state';
import css from './playground-knobs.css';

const CONTROL_FACTORY: Record<string, (propName: string, prop: PropSpec) => HTMLElement> = {
  boolean: (propName, prop) => (
    <q-toggle
      type="switch"
      data-prop={propName}
      checked={prop.currentValue}
      onQChange={(e: CustomEvent) => updateKnobValue('prop', propName, e.detail)}
    />
  ),
  select: (propName, prop) => {
    const options = prop.options ? prop.options.map(opt => ({ label: opt || '(none)', value: opt })) : [];
    const dropdown = (
      <q-dropdown
        data-prop={propName}
        value={prop.currentValue}
        onQChange={(e: CustomEvent) => updateKnobValue('prop', propName, e.detail)}
      />
    ) as any;
    dropdown.options = options;
    return dropdown;
  },
  number: (propName, prop) => (
    <q-input
      type="number"
      data-prop={propName}
      value={prop.currentValue}
      onQInput={(e: CustomEvent) => updateKnobValue('prop', propName, e.detail)}
    />
  ),
};

function createPropControl(propName: string, prop: PropSpec): HTMLElement {
  const factory = CONTROL_FACTORY[prop.type];
  if (factory) return factory(propName, prop);
  return (
    <q-input
      type="text"
      data-prop={propName}
      value={prop.currentValue}
      onQInput={(e: CustomEvent) => updateKnobValue('prop', propName, e.detail)}
    />
  );
}

class PlaygroundKnobs extends HTMLElement {
  private panel: HTMLElement | null = null;
  private attrContainer: HTMLElement | null = null;
  private slotContainer: HTMLElement | null = null;
  private cleanupKnobsEffect?: () => void;
  private lastActiveComponent: string | null = null;

  connectedCallback(): void {
    // 1. Render template via TSX
    this.innerHTML = '';
    
    const toggleBtn = (
      <button class="knobs-toggle-btn" id="knobsToggleBtn" type="button" onClick={() => this.openKnobsPanel()}>
        <span class="knobs-toggle-icon">⚙️</span>
        <span>Controls</span>
      </button>
    );

    const closeBtn = (
      <button class="knobs-close-btn" id="knobsCloseBtn" type="button" onClick={() => this.closeKnobs()}>&times;</button>
    );

    this.panel = (
      <aside class="knobs-panel" id="knobsPanel">
        <q-scrollable height="100%">
          <div class="knobs-scroll-content">
            <div class="knobs-panel-header">
              <span>Customizations</span>
              {closeBtn}
            </div>
            
            <div class="knobs-section">
              <h3 class="knobs-section-title">Attributes (Properties)</h3>
              <div id="attributeKnobs">
                {/* Attributes list */}
              </div>
            </div>

            <div class="knobs-section" style="margin-top: 10px;">
              <h3 class="knobs-section-title">Slots (Content)</h3>
              <div id="slotKnobs">
                {/* Slots list */}
              </div>
            </div>
          </div>
        </q-scrollable>
      </aside>
    );

    this.appendChild(toggleBtn);
    this.appendChild(this.panel);

    // 2. Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'playground-knobs-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css as any;
      document.head.appendChild(style);
    }

    this.init(toggleBtn);
  }

  private init(toggleBtn: HTMLElement): void {
    this.attrContainer = this.querySelector('#attributeKnobs');
    this.slotContainer = this.querySelector('#slotKnobs');

    // React to Component state changes (Angular-style Signal Effect)
    this.cleanupKnobsEffect = effect(() => {
      const active = activeComponent();
      const tab = activeTab();
      const registry = componentRegistry();
      const config = registry[active];

      // 1. Manage visibility: only show Controls on Sandbox tab for normal components
      if (active === 'global-styling' || tab !== 'sandbox') {
        this.style.display = 'none';
        toggleBtn.style.display = 'none';
        if (this.panel) this.panel.classList.remove('open');
        return;
      }

      this.style.display = '';
      toggleBtn.style.display = '';

      // 2. Build customization panels if config is loaded
      if (config) {
        this.buildKnobs(config, active);
      }
    });
  }

  private buildKnobs(config: ComponentSpec, active: string): void {
    if (!this.attrContainer || !this.slotContainer) return;

    // A. Build Attribute Knobs
    if (this.lastActiveComponent !== active) {
      this.attrContainer.innerHTML = '';
      if (config.props && Object.keys(config.props).length > 0) {
        Object.keys(config.props).forEach(propName => {
          if (config.props) {
            const prop = config.props[propName];
            this.attrContainer!.appendChild(
              <div class="knob-row">
                <div class="knob-meta">
                  <span class="knob-label">{propName}</span>
                  <span class="knob-label-sub">{prop.description || ''}</span>
                </div>
                <div>
                  {createPropControl(propName, prop)}
                </div>
              </div>
            );
          }
        });
      } else {
        this.attrContainer.appendChild(
          <div class="knob-empty-state">No customizable attributes.</div>
        );
      }
    } else {
      // Just update existing controls' values!
      if (config.props) {
        Object.keys(config.props).forEach(propName => {
          const prop = config.props![propName];
          const control = this.attrContainer!.querySelector(`[data-prop="${propName}"]`) as any;
          if (control) {
            if (prop.type === 'boolean') {
              if (control.checked !== prop.currentValue) {
                control.checked = prop.currentValue;
              }
            } else {
              // Only update value if different and the element is not currently focused by the user
              if (control.value !== prop.currentValue && document.activeElement !== control) {
                control.value = prop.currentValue;
              }
            }
          }
        });
      }
    }

    // B. Build Slot Knobs
    if (this.lastActiveComponent !== active) {
      this.slotContainer.innerHTML = '';
      if (config.slots && Object.keys(config.slots).length > 0) {
        Object.keys(config.slots).forEach(slotName => {
          if (config.slots) {
            const slot = config.slots[slotName];

            let input: HTMLElement;
            if (active === 'q-data-table' && slotName === 'footer') {
              input = (
                <q-syntax-box
                  editable={true}
                  language="html"
                  height="110px"
                  data-slot={slotName}
                  value={slot.currentValue}
                  onQInput={(e: CustomEvent) => updateKnobValue('slot', slotName, e.detail)}
                />
              );
            } else if (slot.description && (slot.description.includes('textarea') || slot.description.includes('html'))) {
              input = (
                <q-textarea
                  rows={4}
                  data-slot={slotName}
                  value={slot.currentValue}
                  onQInput={(e: CustomEvent) => updateKnobValue('slot', slotName, e.detail)}
                />
              );
            } else {
              input = (
                <q-input
                  type="text"
                  data-slot={slotName}
                  value={slot.currentValue}
                  onQInput={(e: CustomEvent) => updateKnobValue('slot', slotName, e.detail)}
                />
              );
            }

            this.slotContainer!.appendChild(
              <div class="knob-row vertical">
                <div class="knob-meta">
                  <span class="knob-label">{slotName === 'default' ? 'default (Inner content)' : `slot="${slotName}"`}</span>
                  <span class="knob-label-sub">{slot.description || ''}</span>
                </div>
                {input}
              </div>
            );
          }
        });
      } else {
        this.slotContainer.appendChild(
          <div class="knob-empty-state">No slot options configured.</div>
        );
      }
    } else {
      // Just update existing controls' values!
      if (config.slots) {
        Object.keys(config.slots).forEach(slotName => {
          const slot = config.slots![slotName];
          const control = this.slotContainer!.querySelector(`[data-slot="${slotName}"]`) as any;
          if (control) {
            if (control.value !== slot.currentValue && document.activeElement !== control) {
              control.value = slot.currentValue;
            }
          }
        });
      }
    }

    this.lastActiveComponent = active;
  }

  private openKnobsPanel(): void {
    if (this.panel) this.panel.classList.add('open');
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
