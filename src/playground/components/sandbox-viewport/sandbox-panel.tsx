import { h } from '../../dom-factory';
import { activeComponent, activeTab, componentRegistry, effect, ComponentSpec } from '../../state';
import { playgroundBus } from '../../events';
import { ElementWithHelpers, setElementProperties } from '../../utils';

const SYNCBACK_MAP: Record<string, Record<string, (cfg: ComponentSpec, det: any) => void>> = {
  'q-sidepanel': { qClose:  (cfg, _det) => { if (cfg.props) cfg.props.open.currentValue = false; } },
  'q-dialog':    { qClose:  (cfg, _det) => { if (cfg.props) cfg.props.open.currentValue = false; } },
  'q-dropdown':  { qChange: (cfg, det)  => { if (cfg.props) cfg.props.value.currentValue = det; } },
  'q-input':     { qChange: (cfg, det)  => { if (cfg.props) cfg.props.value.currentValue = det; } },
  'q-textarea':  { qChange: (cfg, det)  => { if (cfg.props) cfg.props.value.currentValue = det; } },
  'q-toggle':    { qChange: (cfg, det)  => { if (cfg.props) cfg.props.checked.currentValue = det; } },
};

export class SandboxPanel extends HTMLElement {
  private stageContainer: HTMLElement | null = null;
  private activeModule: any = null;
  private loadedTag: string | null = null;
  private syncedComponents = new Set<string>();
  private previousSlotValues = new WeakMap<HTMLElement, Record<string, string>>();
  private cleanupEffect?: () => void;

  connectedCallback() {
    this.innerHTML = '';
    this.appendChild(
      <div class="sandbox-layout">
        <div class="sandbox-main">
          <div class="stage-container" id="stageContainer">
            {/* Dynamically loaded component */}
          </div>
          <div class="sandbox-bottom-panels">
            <playground-event-log></playground-event-log>
            <playground-code-preview></playground-code-preview>
          </div>
        </div>
      </div>
    );

    this.stageContainer = this.querySelector('#stageContainer');
    this.activeModule = null;
    this.loadedTag = null;
    this.syncedComponents = new Set<string>();

    this.cleanupEffect = effect(async () => {
      const active = activeComponent();
      const tab = activeTab();
      const registry = componentRegistry();
      const spec = registry[active];

      if (active === 'global-styling' || tab !== 'sandbox' || !spec || !this.stageContainer) {
        this.loadedTag = null;
        return;
      }

      if (this.loadedTag !== active) {
        this.loadedTag = active;
        const CUSTOM_VIEW_TAGS = ['q-button', 'q-input'];
        if (CUSTOM_VIEW_TAGS.includes(active)) {
          await this.loadComponentSandboxView(active, spec, registry);
        } else {
          this.renderFallback(active, spec);
        }
      } else {
        const activeEl = this.stageContainer.querySelector(active) as ElementWithHelpers | null;
        if (activeEl) {
          const STRUCTURAL_PROPS = ['type', 'variant'];
          const hasStructuralChange = STRUCTURAL_PROPS.some(propName => {
            if (!spec.props?.[propName]) return false;
            const currentVal = activeEl.getAttribute(propName) ?? '';
            const newVal = String(spec.props[propName].currentValue ?? '');
            return currentVal !== newVal;
          });

          if (hasStructuralChange) {
            this.loadedTag = null;
            const CUSTOM_VIEW_TAGS = ['q-button', 'q-input'];
            if (CUSTOM_VIEW_TAGS.includes(active)) {
              await this.loadComponentSandboxView(active, spec, registry);
            } else {
              this.renderFallback(active, spec);
            }
            this.loadedTag = active;
          } else {
            this.updateElementFromSpec(activeEl, spec);
          }
        }
      }
    });
  }

  private async loadComponentSandboxView(tag: string, spec: ComponentSpec, registry: Record<string, ComponentSpec>): Promise<void> {
    if (!this.stageContainer) return;
    const isFirstLoad = !this.syncedComponents.has(tag);
    if (isFirstLoad) {
      this.syncedComponents.add(tag);
    }

    if (this.activeModule && typeof this.activeModule.destroy === 'function') {
      try {
        this.activeModule.destroy(this.stageContainer);
      } catch (err) {
        console.error(`Error destroying previous module:`, err);
      }
    }
    this.activeModule = null;

    const existingStyle = document.getElementById('custom-view-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    let customHtmlLoaded = false;
    const timestamp = Date.now();
    const htmlUrl = `/views/${tag}-view/${tag}-view.html?t=${timestamp}`;
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
            componentRegistry.set({ ...registry });
          } else {
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
    if (activeEl) {
      this.bindEvents(activeEl, tag);
    }

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

    const cssUrl = `/views/${tag}-view/${tag}-view.css`;
    const cssUrlWithTimestamp = `${cssUrl}?t=${timestamp}`;
    try {
      const cssRes = await fetch(cssUrlWithTimestamp, { method: 'HEAD' });
      if (cssRes.ok) {
        const link = document.createElement('link');
        link.id = 'custom-view-style';
        link.rel = 'stylesheet';
        link.href = cssUrlWithTimestamp;
        document.head.appendChild(link);
      }
    } catch (err) {}

    const jsUrl = `/views/${tag}-view/${tag}-view.js`;
    const jsUrlWithTimestamp = `${jsUrl}?t=${timestamp}`;
    try {
      const jsRes = await fetch(jsUrlWithTimestamp, { method: 'HEAD' });
      if (jsRes.ok) {
        const mod = await import(jsUrlWithTimestamp);
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
    const eventsToLog = ['qChange', 'qSelect', 'qClose', 'qSlideChange', 'qLightboxOpen', 'qLightboxClose', 'qItemClick', 'qScroll', 'qClick', 'qFocus', 'qBlur'];
    eventsToLog.forEach(eventName => {
      activeEl.addEventListener(eventName, e => {
        const customEvent = e as CustomEvent;
        playgroundBus.emit('event-dispatched', {
          name: eventName,
          detail: customEvent.detail
        });

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

    let cachedSlots = this.previousSlotValues.get(el);
    if (!cachedSlots) {
      cachedSlots = {};
      this.previousSlotValues.set(el, cachedSlots);
    }

    let hasAnySlotChanged = false;
    Object.keys(config.slots).forEach(slotName => {
      const currentVal = config.slots![slotName]?.currentValue ?? '';
      if (cachedSlots![slotName] !== currentVal) {
        hasAnySlotChanged = true;
        cachedSlots![slotName] = currentVal;
      }
    });

    if (!hasAnySlotChanged && Object.keys(cachedSlots).length > 0) {
      return;
    }

    const namedSlots: Record<string, HTMLElement> = {};
    Array.from(el.children).forEach(child => {
      const slotName = child.getAttribute('slot');
      if (slotName) {
        namedSlots[slotName] = child as HTMLElement;
      }
    });

    el.innerHTML = '';

    const defaultSlot = config.slots.default;
    if (defaultSlot && defaultSlot.currentValue) {
      el.innerHTML = defaultSlot.currentValue;
    }

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

  disconnectedCallback() {
    if (this.cleanupEffect) {
      this.cleanupEffect();
    }
    if (this.activeModule && typeof this.activeModule.destroy === 'function') {
      try {
        this.activeModule.destroy(this.stageContainer);
      } catch (err) {}
    }
  }
}

customElements.define('sandbox-panel', SandboxPanel);
