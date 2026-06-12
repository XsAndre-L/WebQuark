import { loadComponentResources } from '../loader-helper.js';
import { activeComponent, activeTab, componentRegistry, effect } from '../../state.js';

function highlightHTML(htmlText) {
  let esc = htmlText;
  if (!esc.includes('&lt;')) {
    esc = esc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return (
    esc
      // Match comments
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="code-comment">$1</span>')
      // Match attribute value strings
      .replace(/(&quot;.*?&quot;)/gi, '<span class="code-value">$1</span>')
      .replace(/(&#39;.*?&#39;)/gi, '<span class="code-value">$1</span>')
      // Match attribute parameters
      .replace(/(\s[a-z0-9-]+)=/gi, ' <span class="code-attr">$1</span>=')
      // Match tag elements
      .replace(/(&lt;\/?[a-z0-9-]+)/gi, '<span class="code-tag">$1</span>')
      // Match close brackets
      .replace(/(&gt;)/g, '<span class="code-tag">&gt;</span>')
  );
}

class PlaygroundStage extends HTMLElement {
  async connectedCallback() {
    try {
      const html = await loadComponentResources('playground-stage');
      this.innerHTML = html;
      this.init();
    } catch (err) {
      console.error('Failed to load stage component:', err);
    }
  }

  init() {
    this.tabsBar = this.querySelector('#tabsBar');
    this.activeCompBadge = this.querySelector('#activeCompBadge');
    this.stageContainer = this.querySelector('#stageContainer');
    this.variantsGrid = this.querySelector('#variantsGrid');
    this.edgecasesGrid = this.querySelector('#edgecasesGrid');
    this.activeModule = null;
    this.loadedTag = null;

    // 1. Tab switching buttons event listeners
    const tabBtns = this.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextTab = btn.dataset.tab;
        activeTab.set(nextTab);
      });
    });

    // 2. Intercept click actions inside interactive Sandbox stage (programmatic sidepanel helpers)
    this.handleStageClick = (e) => {
      if (e.target && e.target.id === 'closePanelBtn') {
        const panel = this.stageContainer.querySelector('q-sidepanel');
        if (panel) {
          panel.open = false;
          const registry = componentRegistry();
          if (registry['q-sidepanel']) {
            registry['q-sidepanel'].props.open.currentValue = false;
            componentRegistry.set({ ...registry });
          }
        }
      }
      if (e.target && e.target.id === 'stageOpenPanelBtn') {
        const panel = this.stageContainer.querySelector('q-sidepanel');
        if (panel) {
          panel.open = true;
          const registry = componentRegistry();
          if (registry['q-sidepanel']) {
            registry['q-sidepanel'].props.open.currentValue = true;
            componentRegistry.set({ ...registry });
          }
        }
      }
    };
    this.stageContainer.addEventListener('click', this.handleStageClick);

    // 3. Intercept click triggers for panels in Variants and Edge Cases grids
    this.handleGlobalClick = (e) => {
      if (e.target && e.target.classList.contains('var-open-panel-btn')) {
        const card = e.target.closest('.variant-card');
        if (card) {
          const panel = card.querySelector('q-sidepanel');
          if (panel) panel.open = true;
        }
      }
    };
    document.addEventListener('click', this.handleGlobalClick);

    // 4. React to Active Component, Tab, and Registry modifications (Angular-style Signal Effects)
    this.cleanupStageEffect = effect(async () => {
      const active = activeComponent();
      const tab = activeTab();
      const registry = componentRegistry();
      const spec = registry[active];

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
        btn.classList.toggle('active', btn.dataset.tab === tab);
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
      if (active !== 'global-styling' && spec) {
        if (tab === 'sandbox') {
          // If we haven't rendered this component or are switching back to sandbox, re-render
          if (this.loadedTag !== active) {
            this.loadedTag = active;
            await this.loadComponentSandboxView(active, spec, registry);
          } else {
            // Component is already loaded, update its properties dynamically
            const activeEl = this.stageContainer.querySelector(active);
            if (activeEl) {
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

  async loadComponentSandboxView(tag, spec, registry) {
    // 1. Reset values to spec defaults
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
        this.stageContainer.innerHTML = htmlText;

        const el = this.stageContainer.querySelector(tag);
        if (el) {
          customHtmlLoaded = true;
          // Sync spec properties and slots from HTML definitions
          if (spec.props) {
            Object.keys(spec.props).forEach(propName => {
              const prop = spec.props[propName];
              if (prop.type === 'boolean') {
                prop.currentValue = el.hasAttribute(propName);
              } else {
                const attrVal = el.getAttribute(propName);
                if (attrVal !== null) {
                  prop.currentValue = attrVal;
                }
              }
            });
          }
          if (spec.slots) {
            Object.keys(spec.slots).forEach(slotName => {
              const slot = spec.slots[slotName];
              if (slotName === 'default') {
                const clone = el.cloneNode(true);
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
            });
          }
          // Notify other components of synced spec values
          componentRegistry.set({ ...registry });
        }
      }
    } catch (err) {
      console.warn(`Error fetching custom view for ${tag}:`, err);
    }

    if (!customHtmlLoaded) {
      this.renderFallback(tag, spec);
    }

    const activeEl = this.stageContainer.querySelector(tag);

    // 5. Bind events to log dispatches
    if (activeEl) {
      this.bindEvents(activeEl, tag);
    }

    // 6. Programmatic overrides
    if (tag === 'q-dropdown' && activeEl) {
      activeEl.options = spec.options;
    }
    if (tag === 'q-sidepanel') {
      const helper = document.createElement('div');
      helper.className = 'stage-helper-bar';
      helper.innerHTML = `
        <span class="stage-helper-text">Sidepanel Drawer</span>
        <q-button variant="secondary" size="sm" id="stageOpenPanelBtn">Open Drawer Panel</q-button>
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

  renderFallback(tag, spec) {
    const el = document.createElement(tag);
    this.updateElementFromSpec(el, spec);
    this.stageContainer.innerHTML = '';
    this.stageContainer.appendChild(el);
  }

  bindEvents(activeEl, tag) {
    const eventsToLog = ['qChange', 'qSelect', 'qClose', 'qSlideChange', 'qLightboxOpen', 'qLightboxClose', 'qItemClick', 'qScroll'];
    eventsToLog.forEach(eventName => {
      activeEl.addEventListener(eventName, e => {
        // Dispatch event logging window notification
        window.dispatchEvent(new CustomEvent('playground:event-dispatched', {
          detail: { name: eventName, detail: e.detail }
        }));

        // Interactive states syncback
        let changed = false;
        const registry = componentRegistry();
        const config = registry[tag];
        if (!config) return;

        if (eventName === 'qClose' && tag === 'q-sidepanel') {
          config.props.open.currentValue = false;
          changed = true;
        }
        if (eventName === 'qChange' && tag === 'q-dropdown') {
          config.props.value.currentValue = e.detail;
          changed = true;
        }
        if (eventName === 'qChange' && tag === 'q-input') {
          config.props.value.currentValue = e.detail;
          changed = true;
        }
        if (eventName === 'qChange' && tag === 'q-textarea') {
          config.props.value.currentValue = e.detail;
          changed = true;
        }
        if (eventName === 'qChange' && tag === 'q-toggle') {
          config.props.checked.currentValue = e.detail;
          changed = true;
        }

        if (changed) {
          componentRegistry.set({ ...registry });
        }
      });
    });
  }

  updateElementFromSpec(el, spec) {
    if (!el || !spec) return;

    if (spec.props) {
      Object.keys(spec.props).forEach(propName => {
        const prop = spec.props[propName];
        const val = prop.currentValue;
        if (prop.type === 'boolean') {
          el[propName] = !!val;
          if (val) el.setAttribute(propName, '');
          else el.removeAttribute(propName);
        } else {
          el[propName] = val;
          if (val !== undefined && val !== null && val !== '') {
            el.setAttribute(propName, val);
          } else {
            el.removeAttribute(propName);
          }
        }
      });
    }

    if (spec.slots) {
      this.updateElementSlots(el, spec);
    }

    if (this.loadedTag === 'q-dropdown') {
      el.options = spec.options;
    }
  }

  updateElementSlots(el, config) {
    if (!config.slots) return;

    // Save named slots elements
    const namedSlots = {};
    Array.from(el.children).forEach(child => {
      const slotName = child.getAttribute('slot');
      if (slotName) {
        namedSlots[slotName] = child;
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
      const slot = config.slots[slotName];
      if (slot.currentValue) {
        const wrapper = document.createElement('span');
        wrapper.setAttribute('slot', slotName);
        wrapper.innerHTML = slot.currentValue;
        el.appendChild(wrapper);
      }
    });
  }

  setupSpecialInstanceProps(el, tag) {
    if (tag === 'q-dropdown') {
      const registry = componentRegistry();
      if (registry['q-dropdown']) {
        el.options = registry['q-dropdown'].options;
      } else {
        fetch('/playground/specs/q-dropdown.spec.json')
          .then(res => res.json())
          .then(spec => {
            el.options = spec.options;
          });
      }
    }
  }

  getStaticComponentCode(tag, props, slotText, slotObj) {
    let code = `<${tag}`;
    Object.keys(props || {}).forEach(k => {
      const v = props[k];
      if (typeof v === 'boolean') {
        if (v) code += ` ${k}`;
      } else {
        if (v !== undefined && v !== '') {
          code += ` ${k}="${v}"`;
        }
      }
    });
    code += '>';

    let slots = '';
    if (slotText) {
      slots += `\n  ${slotText.replace(/\n/g, '\n  ')}\n`;
    }
    if (slotObj) {
      Object.keys(slotObj).forEach(sName => {
        slots += `\n  <span slot="${sName}">${slotObj[sName].replace(/\n/g, '\n  ')}</span>\n`;
      });
    }

    if (slots) code += slots + `</${tag}>`;
    else code += `</${tag}>`;

    return code;
  }

  renderVariantsMatrix(tag, config) {
    if (!this.variantsGrid) return;
    this.variantsGrid.innerHTML = '';

    if (!config.variants || config.variants.length === 0) {
      this.variantsGrid.innerHTML = '<div style="grid-column: span 3; padding:40px; text-align:center; color:var(--text-muted)">No variant matrix defined for this component.</div>';
      return;
    }

    config.variants.forEach(variant => {
      const card = document.createElement('div');
      card.className = 'variant-card';

      const titleRow = document.createElement('div');
      titleRow.className = 'variant-title-row';
      titleRow.innerHTML = `<h4 class="variant-card-title">${variant.name}</h4>`;
      card.appendChild(titleRow);

      const stage = document.createElement('div');
      stage.className = 'variant-card-stage';

      const el = document.createElement(tag);
      Object.keys(variant.props || {}).forEach(pName => {
        const val = variant.props[pName];
        if (typeof val === 'boolean') {
          el[pName] = val;
          if (val) el.setAttribute(pName, '');
        } else {
          el[pName] = val;
          el.setAttribute(pName, val);
        }
      });

      const defaultSlot = variant.slot !== undefined ? variant.slot : config.slots?.default?.default || '';
      if (defaultSlot) {
        el.innerHTML = defaultSlot;
      }
      if (variant.slots) {
        Object.keys(variant.slots).forEach(slotName => {
          const wrapper = document.createElement('span');
          wrapper.setAttribute('slot', slotName);
          wrapper.innerHTML = variant.slots[slotName];
          el.appendChild(wrapper);
        });
      } else if (config.slots) {
        Object.keys(config.slots).forEach(slotName => {
          if (slotName !== 'default' && config.slots[slotName].default) {
            const wrapper = document.createElement('span');
            wrapper.setAttribute('slot', slotName);
            wrapper.innerHTML = config.slots[slotName].default;
            el.appendChild(wrapper);
          }
        });
      }

      stage.appendChild(el);
      card.appendChild(stage);

      this.setupSpecialInstanceProps(el, tag);

      if (tag === 'q-sidepanel') {
        const btn = document.createElement('q-button');
        btn.variant = 'secondary';
        btn.size = 'sm';
        btn.className = 'var-open-panel-btn';
        btn.innerHTML = 'Trigger Drawer Panel';
        card.appendChild(btn);
      }

      const codeText = this.getStaticComponentCode(tag, variant.props, defaultSlot, variant.slots || null);
      const codePre = document.createElement('pre');
      codePre.className = 'variant-card-code';
      codePre.innerHTML = highlightHTML(codeText);
      card.appendChild(codePre);

      this.variantsGrid.appendChild(card);
    });

    this.variantsGrid.querySelectorAll('q-dropdown').forEach(dropdown => {
      this.setupSpecialInstanceProps(dropdown, 'q-dropdown');
    });
  }

  renderEdgeCases(tag, config) {
    if (!this.edgecasesGrid) return;
    this.edgecasesGrid.innerHTML = '';

    if (!config.edgeCases || config.edgeCases.length === 0) {
      this.edgecasesGrid.innerHTML = '<div style="grid-column: span 3; padding:40px; text-align:center; color:var(--text-muted)">No stress-test layout edge cases defined for this component.</div>';
      return;
    }

    config.edgeCases.forEach(edge => {
      const card = document.createElement('div');
      card.className = 'variant-card';

      const titleRow = document.createElement('div');
      titleRow.className = 'variant-title-row';
      titleRow.innerHTML = `<h4 class="variant-card-title">${edge.name}</h4>`;
      card.appendChild(titleRow);

      const stage = document.createElement('div');
      stage.className = 'variant-card-stage';

      const el = document.createElement(tag);
      Object.keys(edge.props || {}).forEach(pName => {
        const val = edge.props[pName];
        if (typeof val === 'boolean') {
          el[pName] = val;
          if (val) el.setAttribute(pName, '');
        } else {
          el[pName] = val;
          el.setAttribute(pName, val);
        }
      });

      const defaultSlot = edge.slot !== undefined ? edge.slot : config.slots?.default?.default || '';
      if (defaultSlot !== undefined) {
        el.innerHTML = defaultSlot;
      }
      if (edge.slots) {
        Object.keys(edge.slots).forEach(slotName => {
          const wrapper = document.createElement('span');
          wrapper.setAttribute('slot', slotName);
          wrapper.innerHTML = edge.slots[slotName];
          el.appendChild(wrapper);
        });
      }

      stage.appendChild(el);
      card.appendChild(stage);

      this.setupSpecialInstanceProps(el, tag);

      if (tag === 'q-sidepanel') {
        const btn = document.createElement('q-button');
        btn.variant = 'secondary';
        btn.size = 'sm';
        btn.className = 'var-open-panel-btn';
        btn.innerHTML = 'Trigger Drawer Panel';
        card.appendChild(btn);
      }

      const codeText = this.getStaticComponentCode(tag, edge.props, defaultSlot, edge.slots || null);
      const codePre = document.createElement('pre');
      codePre.className = 'variant-card-code';
      codePre.innerHTML = highlightHTML(codeText);
      card.appendChild(codePre);

      this.edgecasesGrid.appendChild(card);
    });

    this.edgecasesGrid.querySelectorAll('q-dropdown').forEach(dropdown => {
      this.setupSpecialInstanceProps(dropdown, 'q-dropdown');
    });
  }

  disconnectedCallback() {
    this.stageContainer.removeEventListener('click', this.handleStageClick);
    document.removeEventListener('click', this.handleGlobalClick);

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
