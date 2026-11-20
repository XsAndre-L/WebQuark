import { Settings, X } from '@lucide/icons';
import { h } from '../../dom-factory';
import { setButtonState } from '../button-accessibility';
import { activeComponent, activeTab, componentRegistry, effect, resetComponentProperties, ComponentSpec } from '../../state';
import { getPropertySections } from './property-categories';
import { createResetAction } from './reset-action';
import './property-row';
import type { PropertyRow } from './property-row';
import './slot-row';
import type { SlotRow } from './slot-row';
import css from './properties-panel.css';

export class PropertiesPanel extends HTMLElement {
  private panel: HTMLElement | null = null;
  private attrContainer: HTMLElement | null = null;
  private slotContainer: HTMLElement | null = null;
  private cleanupEffect?: () => void;
  private lastActiveComponent: string | null = null;
  private resetAction!: HTMLElement;

  private mobile = matchMedia('(max-width: 900px)');
  private listeners?: AbortController;

  connectedCallback(): void {
    this.lastActiveComponent = null;
    this.innerHTML = '';
    
    const toggleBtn = (
      <q-button
        class="properties-toggle-btn"
        id="propertiesToggleBtn"
        aria-controls="propertiesPanel"
        aria-expanded="false"
        shape="pill"
        onClick={() => this.openPanel()}
      >
        {Object.assign(<q-icon slot="icon-left" size="16" />, { definition: Settings })}
        Properties
      </q-button>
    );

    const closeBtn = (
      <q-button
        class="properties-close-btn"
        id="propertiesCloseBtn"
        aria-label="Close component properties"
        variant="text"
        icon-only="true"
        onClick={() => this.closePanel()}
      >
        {Object.assign(<q-icon slot="icon-left" size="20" />, { definition: X })}
      </q-button>
    );

    this.resetAction = createResetAction('Reset all properties to sandbox defaults', () => this.resetProperties());
    this.resetAction.hidden = true;

    this.panel = (
      <q-sidepanel
        class="properties-panel"
        id="propertiesPanel"
        variant="panel"
        side="right" aria-label="Component properties"
      >
        <q-scrollable height="100%">
          <div class="properties-scroll-content">
            <div class="properties-panel-header">
              <span>Component Properties</span>
              {closeBtn}
            </div>
            
            <div class="properties-section">
              <div class="properties-section-header">
                <h3 class="properties-section-title">Properties</h3>
                {this.resetAction}
              </div>
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
      </q-sidepanel>
    );

    this.appendChild(toggleBtn);
    this.appendChild(this.panel);

    // Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'properties-panel-style';
    let style = document.getElementById(styleId) as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = css as any;

    this.listeners = new AbortController();
    const { signal } = this.listeners;
    this.mobile.addEventListener('change', () => this.closePanel(false), { signal });
    this.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.panel?.classList.contains('open')) this.closePanel();
    }, { signal });
    this.closePanel(false);
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
        this.closePanel(false);
        return;
      }

      this.style.display = '';
      toggleBtn.style.display = '';

      if (config) {
        this.buildProperties(config, active);
      } else {
        this.lastActiveComponent = null;
        this.resetAction.hidden = true;
        this.attrContainer?.replaceChildren();
        this.slotContainer?.replaceChildren();
      }
    });
  }

  private buildProperties(config: ComponentSpec, active: string): void {
    if (!this.attrContainer || !this.slotContainer) return;

    if (this.lastActiveComponent !== active) {
      const sections = this.renderPropertySections(config);
      const slots = Object.entries(config.slots ?? {}).map(([slotName, slotConfig]) =>
        Object.assign(document.createElement('slot-row') as SlotRow, { slotName, slotConfig, activeComponentTag: active }));

      this.attrContainer.replaceChildren(...(sections.length ? sections : [<div class="property-empty-state">No customizable attributes.</div>]));
      this.slotContainer.replaceChildren(...(slots.length ? slots : [<div class="property-empty-state">No slot options configured.</div>]));
      this.lastActiveComponent = active;

      this.resetAction.hidden = sections.length === 0;
      return;
    }

    for (const row of this.attrContainer.querySelectorAll<PropertyRow>('property-row')) {
      row.sync(config.props?.[row.propName]?.currentValue);
    }
    for (const row of Array.from(this.slotContainer.children) as SlotRow[]) {
      if (row.slotName) row.sync(config.slots?.[row.slotName]?.currentValue);
    }
  }

  private renderPropertySections(config: ComponentSpec): HTMLElement[] {
    const properties = config.props ?? {};
    const sections = getPropertySections(config.tag, Object.keys(properties));

    return sections.map(({ name, categories }) => (
      <div class="property-section">
        {name && <h4 class="property-section-heading">{name}</h4>}

        {categories.map(({ label, props }) => (
          <div class="property-category">
            {h(name ? 'h5' : 'h4', { class: 'property-category-heading' }, label)}

            <div class="property-category-rows">
              {props.map(propName => Object.assign(document.createElement('property-row') as PropertyRow, {
                propName,
                prop: properties[propName],
                activeComponentTag: config.tag,
              }))}
            </div>
          </div>
        ))}
      </div>
    ));
  }

  private resetProperties(): void {
    resetComponentProperties();
    for (const row of this.querySelectorAll<PropertyRow>('property-row')) {
      row.sync(row.prop.default, true);
    }
  }

  private openPanel(): void {
    if (!this.panel) return;
    this.panel.inert = false;
    this.panel.classList.add('open');
    const toggle = this.querySelector<HTMLQButtonElement>('#propertiesToggleBtn');
    if (toggle) void setButtonState(toggle, 'aria-expanded', true);
    this.querySelector<HTMLQButtonElement>('#propertiesCloseBtn')?.focus();
  }

  public closePanel(restoreFocus = true): void {
    if (!this.panel) return;
    this.panel.classList.remove('open');
    this.panel.inert = this.mobile.matches;
    const toggle = this.querySelector<HTMLQButtonElement>('#propertiesToggleBtn');
    if (toggle) void setButtonState(toggle, 'aria-expanded', false);
    if (restoreFocus && this.mobile.matches) toggle?.focus();
  }

  disconnectedCallback(): void {
    this.listeners?.abort();
    if (this.cleanupEffect) {
      this.cleanupEffect();
    }
  }
}

customElements.define('properties-panel', PropertiesPanel);
