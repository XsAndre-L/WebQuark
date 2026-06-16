import { activeComponent, activeTab, componentRegistry, effect, serializeComponentCode, ComponentSpec } from '../../state';
import html from './playground-stage.html';
import css from './playground-stage.css';

type ElementWithHelpers = HTMLElement & {
  setChecked?: (v: any) => void;
  options?: any;
  _resizeObserver?: ResizeObserver;
  [key: string]: any;
};

function setElementProperties(el: ElementWithHelpers, props: Record<string, any>): void {
  if (!el || !props) return;
  const tag = el.tagName?.toLowerCase();
  Object.keys(props).forEach(pName => {
    const val = props[pName];
    
    // Normalize stringified booleans ('true' / 'false') to avoid browser truthy attribute bugs
    const isBoolean = typeof val === 'boolean' || val === 'true' || val === 'false';
    
    if (isBoolean) {
      const boolVal = val === true || val === 'true';
      if (tag === 'q-toggle' && pName === 'checked' && typeof el.setChecked === 'function') {
        el.setChecked(boolVal);
        return;
      }
      el[pName] = boolVal;
      if (boolVal) el.setAttribute(pName, '');
      else el.removeAttribute(pName);
    } else {
      el[pName] = val;
      if (val !== undefined && val !== null && val !== '') {
        el.setAttribute(pName, val);
      } else {
        el.removeAttribute(pName);
      }
    }
  });
}

const SYNCBACK_MAP: Record<string, Record<string, (cfg: ComponentSpec, det: any) => void>> = {
  'q-sidepanel': { qClose:  (cfg, _det) => { if (cfg.props) cfg.props.open.currentValue = false; } },
  'q-dialog':    { qClose:  (cfg, _det) => { if (cfg.props) cfg.props.open.currentValue = false; } },
  'q-dropdown':  { qChange: (cfg, det)  => { if (cfg.props) cfg.props.value.currentValue = det; } },
  'q-input':     { qChange: (cfg, det)  => { if (cfg.props) cfg.props.value.currentValue = det; } },
  'q-textarea':  { qChange: (cfg, det)  => { if (cfg.props) cfg.props.value.currentValue = det; } },
  'q-toggle':    { qChange: (cfg, det)  => { if (cfg.props) cfg.props.checked.currentValue = det; } },
};

function emptyState(msg: string): string {
  return `<div class="grid-empty-state">${msg}</div>`;
}

class PlaygroundStage extends HTMLElement {
  private tabsBar: HTMLElement | null = null;
  private activeCompBadge: HTMLElement | null = null;
  private stageContainer: HTMLElement | null = null;
  private variantsGrid: HTMLElement | null = null;
  private edgecasesGrid: HTMLElement | null = null;
  private activeModule: any = null;
  private loadedTag: string | null = null;
  private syncedComponents = new Set<string>();
  private handleStageClick?: (e: MouseEvent) => void;
  private handleGlobalClick?: (e: MouseEvent) => void;
  private cleanupStageEffect?: () => void;

  connectedCallback(): void {
    // 1. Inject template HTML
    this.innerHTML = html;

    // 2. Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'playground-stage-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css as any;
      document.head.appendChild(style);
    }

    this.init();
  }

  private init(): void {
    this.tabsBar = this.querySelector('#tabsBar');
    this.activeCompBadge = this.querySelector('#activeCompBadge');
    this.stageContainer = this.querySelector('#stageContainer');
    this.variantsGrid = this.querySelector('#variantsGrid');
    this.edgecasesGrid = this.querySelector('#edgecasesGrid');
    this.activeModule = null;
    this.loadedTag = null;
    this.syncedComponents = new Set<string>();

    if (!this.stageContainer) return;

    // 1. Tab switching buttons event listeners
    const tabBtns = this.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextTab = (btn as HTMLElement).dataset.tab;
        if (nextTab) {
          activeTab.set(nextTab);
        }
      });
    });

    // 2. Intercept click actions inside interactive Sandbox stage
    this.handleStageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!this.stageContainer) return;
      
      if (target && target.id === 'closePanelBtn') {
        const panel = this.stageContainer.querySelector('q-sidepanel') as ElementWithHelpers | null;
        if (panel) {
          panel.open = false;
          const registry = componentRegistry();
          if (registry['q-sidepanel'] && registry['q-sidepanel'].props) {
            registry['q-sidepanel'].props.open.currentValue = false;
            componentRegistry.set({ ...registry });
          }
        }
      }
      if (target && target.id === 'stageOpenPanelBtn') {
        const panel = this.stageContainer.querySelector('q-sidepanel') as ElementWithHelpers | null;
        if (panel) {
          panel.open = true;
          const registry = componentRegistry();
          if (registry['q-sidepanel'] && registry['q-sidepanel'].props) {
            registry['q-sidepanel'].props.open.currentValue = true;
            componentRegistry.set({ ...registry });
          }
        }
      }
      if (target && target.id === 'stageOpenDialogBtn') {
        const dialog = this.stageContainer.querySelector('q-dialog') as ElementWithHelpers | null;
        if (dialog) {
          dialog.open = true;
          const registry = componentRegistry();
          if (registry['q-dialog'] && registry['q-dialog'].props) {
            registry['q-dialog'].props.open.currentValue = true;
            componentRegistry.set({ ...registry });
          }
        }
      }
    };
    this.stageContainer.addEventListener('click', this.handleStageClick as EventListener);

    // 3. Intercept click triggers for panels in Variants and Edge Cases grids
    this.handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.classList.contains('var-open-panel-btn')) {
        const card = target.closest('.variant-card');
        if (card) {
          const panel = card.querySelector('q-sidepanel') as ElementWithHelpers | null;
          if (panel) panel.open = true;
        }
      }
      if (target && target.classList.contains('var-open-dialog-btn')) {
        const card = target.closest('.variant-card');
        if (card) {
          const dialog = card.querySelector('q-dialog') as ElementWithHelpers | null;
          if (dialog) dialog.open = true;
        }
      }
    };
    document.addEventListener('click', this.handleGlobalClick as EventListener);

    // 4. React to Active Component, Tab, and Registry modifications
    this.cleanupStageEffect = effect(async () => {
      const active = activeComponent();
      const tab = activeTab();
      const registry = componentRegistry();
      const spec = registry[active];
      console.log('[stage effect] active component:', active, 'has spec:', !!spec, 'tab:', tab);

      this.setAttribute('active-component', active);

      // A. Update Active Component Badge
      if (this.activeCompBadge) {
        this.activeCompBadge.innerText = active === 'global-styling' ? 'Global Styling' : active;
      }

      // B. Manage Header Tabs Bar visibility
      if (this.tabsBar) {
        this.tabsBar.style.display = active === 'global-styling' ? 'none' : '';
      }

      // C. Highlight selected tab button
      tabBtns.forEach(btn => {
        btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === tab);
      });

      // D. Toggle visibility of content wrappers
      this.querySelectorAll('.stage-content-wrapper > .tab-content').forEach(c => {
        if (active === 'global-styling') {
          c.classList.toggle('active', c.id === 'content-global-styling');
        } else {
          c.classList.toggle('active', c.id === `content-${tab}`);
        }
      });

      // E. Render selected view content based on Tab choice
      if (active !== 'global-styling' && spec && this.stageContainer) {
        if (tab === 'sandbox') {
          // If we haven't rendered this component or are switching back to sandbox, re-render
          if (this.loadedTag !== active) {
            console.log('[stage effect] switching view to:', active);
            this.loadedTag = active;
            const CUSTOM_VIEW_TAGS = ['q-button', 'q-input'];
            if (CUSTOM_VIEW_TAGS.includes(active)) {
              await this.loadComponentSandboxView(active, spec, registry);
            } else {
              this.renderFallback(active, spec);
            }
          } else {
            const activeEl = this.stageContainer.querySelector(active) as ElementWithHelpers | null;
            console.log('[stage effect] component already loaded, updating props:', active, 'activeEl found:', !!activeEl);
            if (activeEl) {
              const STRUCTURAL_PROPS = ['type', 'variant'];
              const hasStructuralChange = STRUCTURAL_PROPS.some(propName => {
                if (!spec.props?.[propName]) return false;
                const currentVal = activeEl.getAttribute(propName) ?? '';
                const newVal = String(spec.props[propName].currentValue ?? '');
                console.log(`[stage structural check] prop: ${propName}, attrVal: "${activeEl.getAttribute(propName)}", currentVal: "${currentVal}", newVal: "${newVal}", changed: ${currentVal !== newVal}`);
                return currentVal !== newVal;
              });
              console.log('[stage effect] hasStructuralChange:', hasStructuralChange);
              if (hasStructuralChange) {
                this.loadedTag = null;
                const CUSTOM_VIEW_TAGS = ['q-button', 'q-input'];
                if (CUSTOM_VIEW_TAGS.includes(active)) {
                  console.log('[stage effect] reloading custom sandbox view for:', active);
                  await this.loadComponentSandboxView(active, spec, registry);
                } else {
                  console.log('[stage effect] rendering fallback for:', active);
                  this.renderFallback(active, spec);
                }
                this.loadedTag = active;
              } else {
                console.log('[stage effect] applying simple property updates to existing element');
                this.updateElementFromSpec(activeEl, spec);
              }
              console.log('[stage effect] applying property updates to existing element');
              this.updateElementFromSpec(activeEl, spec);
            }
          }
        } else if (tab === 'variants') {
          this.loadedTag = null; // Reset sandbox tracking
          this.renderVariantsMatrix(active, spec);
        } else if (tab === 'edgecases') {
          this.loadedTag = null; // Reset sandbox tracking
          this.renderEdgeCases(active, spec);
        }
      } else {
        this.loadedTag = null;
      }
    });
  }

  private async loadComponentSandboxView(tag: string, spec: ComponentSpec, registry: Record<string, ComponentSpec>): Promise<void> {
    if (!this.stageContainer) return;
    const isFirstLoad = !this.syncedComponents.has(tag);
    if (isFirstLoad) {
      this.syncedComponents.add(tag);
    }

    // 2. Destroy previous active module
    if (this.activeModule && typeof this.activeModule.destroy === 'function') {
      try {
        this.activeModule.destroy(this.stageContainer);
      } catch (err) {
        console.error(`Error destroying previous module:`, err);
      }
    }
    this.activeModule = null;

    // 3. Remove custom style link
    const existingStyle = document.getElementById('custom-view-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // 4. Fetch and render custom view HTML
    let customHtmlLoaded = false;
    const htmlUrl = `/views/${tag}-view/${tag}-view.html`;
    try {
      const htmlRes = await fetch(htmlUrl);
      if (htmlRes.ok) {
        const htmlText = await htmlRes.text();
        if (htmlText.trim().startsWith('<!DOCTYPE') || htmlText.includes('<html')) {
          throw new Error('SPA fallback page returned instead of view fragment');
        }
        this.stageContainer.innerHTML = htmlText;

        const el = this.stageContainer.querySelector(tag) as ElementWithHelpers | null;
        if (el) {
          customHtmlLoaded = true;
          // Sync spec properties and slots from HTML definitions only on first load
          if (isFirstLoad) {
            if (spec.props) {
              Object.keys(spec.props).forEach(propName => {
                if (spec.props) {
                  const prop = spec.props[propName];
                  if (prop.type === 'boolean') {
                    prop.currentValue = el.hasAttribute(propName);
                  } else {
                    const attrVal = el.getAttribute(propName);
                    if (attrVal !== null) {
                      prop.currentValue = attrVal;
                    }
                  }
                }
              });
            }
            if (spec.slots) {
              Object.keys(spec.slots).forEach(slotName => {
                if (spec.slots) {
                  const slot = spec.slots[slotName];
                  if (slotName === 'default') {
                    const clone = el.cloneNode(true) as HTMLElement;
                    Array.from(clone.children).forEach(child => {
                      if (child.hasAttribute('slot')) child.remove();
                    });
                    slot.currentValue = clone.innerHTML.trim();
                  } else {
                    const slotEl = el.querySelector(`[slot="${slotName}"]`);
                    if (slotEl) {
                      slot.currentValue = slotEl.innerHTML.trim();
                    }
                  }
                }
              });
            }
            // Notify other components of synced spec values
            componentRegistry.set({ ...registry });
          } else {
            // Apply existing spec properties to the newly loaded HTML element
            this.updateElementFromSpec(el, spec);
          }
        }
      }
    } catch (err) {
      console.warn(`Error fetching custom view for ${tag}:`, err);
    }

    if (!customHtmlLoaded) {
      this.renderFallback(tag, spec);
    }

    const activeEl = this.stageContainer.querySelector(tag) as ElementWithHelpers | null;

    // 5. Bind events to log dispatches
    if (activeEl) {
      this.bindEvents(activeEl, tag);
    }

    // 6. Programmatic overrides
    if (spec.options && activeEl) {
      activeEl.options = spec.options;
    }
    if (spec.hasOwnProperty('stageHelper') && (spec as any).stageHelper && activeEl) {
      const stageHelper = (spec as any).stageHelper;
      const helper = document.createElement('div');
      helper.className = 'stage-helper-bar';
      helper.innerHTML = `
        <span class="stage-helper-text">${stageHelper.label}</span>
        <q-button variant="secondary" size="sm" id="${stageHelper.buttonId}">${stageHelper.buttonLabel}</q-button>
      `;
      this.stageContainer.appendChild(helper);
    }

    // 7. Load custom view styles
    const cssUrl = `/views/${tag}-view/${tag}-view.css`;
    try {
      const cssRes = await fetch(cssUrl, { method: 'HEAD' });
      if (cssRes.ok) {
        const link = document.createElement('link');
        link.id = 'custom-view-style';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
      }
    } catch (err) {
      // Ignore CSS loading error
    }

    // 8. Load custom view logic
    const jsUrl = `/views/${tag}-view/${tag}-view.js`;
    try {
      const jsRes = await fetch(jsUrl, { method: 'HEAD' });
      if (jsRes.ok) {
        const mod = await import(jsUrl);
        this.activeModule = mod;
        if (mod && typeof mod.init === 'function') {
          mod.init(this.stageContainer);
        }
      }
    } catch (err) {
      console.warn(`Could not initialize custom JS module for ${tag}:`, err);
    }
  }

  private renderFallback(tag: string, spec: ComponentSpec): void {
    if (!this.stageContainer) return;
    const el = document.createElement(tag) as ElementWithHelpers;
    this.updateElementFromSpec(el, spec);
    this.stageContainer.innerHTML = '';
    this.stageContainer.appendChild(el);
  }

  private bindEvents(activeEl: ElementWithHelpers, tag: string): void {
    const eventsToLog = ['qChange', 'qSelect', 'qClose', 'qSlideChange', 'qLightboxOpen', 'qLightboxClose', 'qItemClick', 'qScroll'];
    eventsToLog.forEach(eventName => {
      activeEl.addEventListener(eventName, e => {
        const customEvent = e as CustomEvent;
        // Dispatch event logging window notification
        window.dispatchEvent(new CustomEvent('playground:event-dispatched', {
          detail: { name: eventName, detail: customEvent.detail }
        }));

        // Interactive states syncback
        let changed = false;
        const registry = componentRegistry();
        const config = registry[tag];
        if (!config) return;

        const handler = SYNCBACK_MAP[tag]?.[eventName];
        if (handler) {
          handler(config, customEvent.detail);
          changed = true;
        }

        if (changed) {
          componentRegistry.set({ ...registry });
        }
      });
    });
  }

  private updateElementFromSpec(el: ElementWithHelpers, spec: ComponentSpec): void {
    if (!el || !spec) return;

    if (spec.props) {
      const flatProps: Record<string, any> = {};
      Object.keys(spec.props).forEach(pName => {
        if (spec.props) {
          flatProps[pName] = spec.props[pName].currentValue;
        }
      });
      setElementProperties(el, flatProps);
    }

    if (spec.slots) {
      this.updateElementSlots(el, spec);
    }

    if (spec.options) {
      el.options = spec.options;
    }
  }

  private updateElementSlots(el: ElementWithHelpers, config: ComponentSpec): void {
    if (!config.slots) return;

    // Save named slots elements
    const namedSlots: Record<string, HTMLElement> = {};
    Array.from(el.children).forEach(child => {
      const slotName = child.getAttribute('slot');
      if (slotName) {
        namedSlots[slotName] = child as HTMLElement;
      }
    });

    el.innerHTML = '';

    // Default slot
    const defaultSlot = config.slots.default;
    if (defaultSlot && defaultSlot.currentValue) {
      el.innerHTML = defaultSlot.currentValue;
    }

    // Named slots
    Object.keys(config.slots).forEach(slotName => {
      if (slotName === 'default') return;
      if (config.slots) {
        const slot = config.slots[slotName];
        if (slot.currentValue) {
          const wrapper = document.createElement('span');
          wrapper.setAttribute('slot', slotName);
          wrapper.innerHTML = slot.currentValue;
          el.appendChild(wrapper);
        }
      }
    });
  }

  private renderPlaygroundCard(tag: string, config: ComponentSpec, item: any): HTMLElement {
    const card = document.createElement('div');
    card.className = 'variant-card';

    const titleRow = document.createElement('div');
    titleRow.className = 'variant-title-row';
    titleRow.innerHTML = `<h4 class="variant-card-title">${item.name}</h4>`;
    card.appendChild(titleRow);

    const stage = document.createElement('div');
    stage.className = 'variant-card-stage';

    const el = document.createElement(tag) as ElementWithHelpers;
    setElementProperties(el, item.props);

    const defaultSlot = item.slot !== undefined ? item.slot : config.slots?.default?.default || '';
    if (defaultSlot !== undefined && defaultSlot !== '') {
      el.innerHTML = defaultSlot;
    }
    if (item.slots) {
      Object.keys(item.slots).forEach(slotName => {
        const wrapper = document.createElement('span');
        wrapper.setAttribute('slot', slotName);
        wrapper.innerHTML = item.slots[slotName];
        el.appendChild(wrapper);
      });
    } else if (config.slots) {
      Object.keys(config.slots).forEach(slotName => {
        if (config.slots) {
          if (slotName !== 'default' && config.slots[slotName].default) {
            const wrapper = document.createElement('span');
            wrapper.setAttribute('slot', slotName);
            wrapper.innerHTML = config.slots[slotName].default;
            el.appendChild(wrapper);
          }
        }
      });
    }

    stage.appendChild(el);
    
    // Add real-time dimensions badge
    const dimensionsBadge = document.createElement('span');
    dimensionsBadge.className = 'variant-card-dimensions';
    dimensionsBadge.innerText = '0px × 0px';
    stage.appendChild(dimensionsBadge);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        const rect = el.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        dimensionsBadge.innerText = `${width}px × ${height}px`;
      });
      observer.observe(el);
      el._resizeObserver = observer;
    }

    card.appendChild(stage);

    if (config.options) {
      el.options = config.options;
    }

    if (tag === 'q-sidepanel') {
      const btn = document.createElement('q-button') as any;
      btn.variant = 'secondary';
      btn.size = 'sm';
      btn.className = 'var-open-panel-btn';
      btn.innerHTML = 'Trigger Drawer Panel';
      card.appendChild(btn);
    }
    if (tag === 'q-dialog') {
      const btn = document.createElement('q-button') as any;
      btn.variant = 'secondary';
      btn.size = 'sm';
      btn.className = 'var-open-dialog-btn';
      btn.innerHTML = 'Trigger Dialog Overlay';
      card.appendChild(btn);
    }

    const slots: Record<string, string> = { default: defaultSlot };
    if (item.slots) {
      Object.assign(slots, item.slots);
    }

    const appendScript = (tag === 'q-dropdown' && config.options)
      ? `\n\n<!-- Programmatic dropdown options population script -->\n<script>\n  const dropdown = document.querySelector('q-dropdown');\n  dropdown.options = ${JSON.stringify(config.options, null, 2).replace(/\n/g, '\n  ')};\n</script>`
      : null;
    const codeText = serializeComponentCode(tag, item.props, slots, appendScript);
    const syntaxBox = document.createElement('q-syntax-box') as any;
    syntaxBox.variant = 'plain';
    syntaxBox.code = codeText;
    syntaxBox.className = 'variant-card-code';
    card.appendChild(syntaxBox);

    return card;
  }

  private renderVariantsMatrix(tag: string, config: ComponentSpec): void {
    if (!this.variantsGrid) return;
    this.variantsGrid.innerHTML = '';

    const variants = (config as any).variants;
    if (!variants || variants.length === 0) {
      this.variantsGrid.innerHTML = emptyState('No variant matrix defined for this component.');
      return;
    }

    variants.forEach((variant: any) => {
      const card = this.renderPlaygroundCard(tag, config, variant);
      this.variantsGrid.appendChild(card);
    });
  }

  private renderEdgeCases(tag: string, config: ComponentSpec): void {
    if (!this.edgecasesGrid) return;
    this.edgecasesGrid.innerHTML = '';

    const edgeCases = (config as any).edgeCases;
    if (!edgeCases || edgeCases.length === 0) {
      this.edgecasesGrid.innerHTML = emptyState('No stress-test layout edge cases defined for this component.');
      return;
    }

    edgeCases.forEach((edge: any) => {
      const card = this.renderPlaygroundCard(tag, config, edge);
      this.edgecasesGrid.appendChild(card);
    });
  }

  disconnectedCallback(): void {
    if (this.stageContainer && this.handleStageClick) {
      this.stageContainer.removeEventListener('click', this.handleStageClick as EventListener);
    }
    if (this.handleGlobalClick) {
      document.removeEventListener('click', this.handleGlobalClick as EventListener);
    }

    if (this.cleanupStageEffect) {
      this.cleanupStageEffect();
    }
    if (this.activeModule && typeof this.activeModule.destroy === 'function') {
      try {
        this.activeModule.destroy(this.stageContainer);
      } catch (err) {}
    }
  }
}

customElements.define('playground-stage', PlaygroundStage);
export { PlaygroundStage };
