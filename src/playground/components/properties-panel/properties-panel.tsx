import { h } from '../../dom-factory';
import { activeComponent, activeTab, componentRegistry, effect, ComponentSpec } from '../../state';
import './property-row';
import './slot-row';
import css from './properties-panel.css';

export class PropertiesPanel extends HTMLElement {
  private panel: HTMLElement | null = null;
  private attrContainer: HTMLElement | null = null;
  private slotContainer: HTMLElement | null = null;
  private cleanupEffect?: () => void;
  private lastActiveComponent: string | null = null;

  connectedCallback(): void {
    this.innerHTML = '';
    
    const toggleBtn = (
      <button class="properties-toggle-btn" id="propertiesToggleBtn" type="button" onClick={() => this.openPanel()}>
        <span class="properties-toggle-icon">⚙️</span>
        <span>Properties</span>
      </button>
    );

    const closeBtn = (
      <button class="properties-close-btn" id="propertiesCloseBtn" type="button" onClick={() => this.closePanel()}>&times;</button>
    );

    this.panel = (
      <aside class="properties-panel" id="propertiesPanel">
        <q-scrollable height="100%">
          <div class="properties-scroll-content">
            <div class="properties-panel-header">
              <span>Component Properties</span>
              {closeBtn}
            </div>
            
            <div class="properties-section">
              <h3 class="properties-section-title">Component Properties</h3>
              <div id="attributeProperties">
                {/* Attributes list */}
              </div>
            </div>

            <div class="properties-section" style="margin-top: 10px;">
              <h3 class="properties-section-title">Slots (Content)</h3>
              <div id="slotProperties">
                {/* Slots list */}
              </div>
            </div>
          </div>
        </q-scrollable>
      </aside>
    );

    this.appendChild(toggleBtn);
    this.appendChild(this.panel);

    // Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'properties-panel-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css as any;
      document.head.appendChild(style);
    }

    this.init(toggleBtn);
  }

  private init(toggleBtn: HTMLElement): void {
    this.attrContainer = this.querySelector('#attributeProperties');
    this.slotContainer = this.querySelector('#slotProperties');

    // React to Component state changes
    this.cleanupEffect = effect(() => {
      const active = activeComponent();
      const tab = activeTab();
      const registry = componentRegistry();
      const config = registry[active];

      // Only show Controls on Sandbox tab for normal components
      if (active === 'global-styling' || tab !== 'sandbox') {
        this.style.display = 'none';
        toggleBtn.style.display = 'none';
        if (this.panel) this.panel.classList.remove('open');
        return;
      }

      this.style.display = '';
      toggleBtn.style.display = '';

      if (config) {
        this.buildProperties(config, active);
      }
    });
  }

  private buildProperties(config: ComponentSpec, active: string): void {
    if (!this.attrContainer || !this.slotContainer) return;

    // A. Build Attribute/Property rows
    if (this.lastActiveComponent !== active) {
      this.attrContainer.innerHTML = '';
      if (config.props && Object.keys(config.props).length > 0) {
        Object.keys(config.props).forEach(propName => {
          if (config.props) {
            const prop = config.props[propName];
            const row = document.createElement('property-row') as any;
            row.propName = propName;
            row.prop = prop;
            this.attrContainer!.appendChild(row);
          }
        });
      } else {
        this.attrContainer.appendChild(
          <div class="property-empty-state">No customizable attributes.</div>
        );
      }
    } else {
      // Just update existing controls' values
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

    // B. Build Slot rows
    if (this.lastActiveComponent !== active) {
      this.slotContainer.innerHTML = '';
      if (config.slots && Object.keys(config.slots).length > 0) {
        Object.keys(config.slots).forEach(slotName => {
          if (config.slots) {
            const slot = config.slots[slotName];
            const row = document.createElement('slot-row') as any;
            row.slotName = slotName;
            row.slotConfig = slot;
            row.activeComponentTag = active;
            this.slotContainer!.appendChild(row);
          }
        });
      } else {
        this.slotContainer.appendChild(
          <div class="property-empty-state">No slot options configured.</div>
        );
      }
    } else {
      // Just update existing slot controls' values
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

  private openPanel(): void {
    if (this.panel) this.panel.classList.add('open');
  }

  public closePanel(): void {
    if (this.panel) this.panel.classList.remove('open');
  }

  disconnectedCallback(): void {
    if (this.cleanupEffect) {
      this.cleanupEffect();
    }
  }
}

customElements.define('properties-panel', PropertiesPanel);
