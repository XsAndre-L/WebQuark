// Component Tag list for Sidebar rendering
const COMPONENTS = [
  { tag: 'q-button', name: 'Button' },
  { tag: 'q-toggle', name: 'Toggle' },
  { tag: 'q-card', name: 'Card' },
  { tag: 'q-carousel', name: 'Carousel' },
  { tag: 'q-circular-progress', name: 'Circular Progress' },
  { tag: 'q-dropdown', name: 'Dropdown' },
  { tag: 'q-input', name: 'Input' },
  { tag: 'q-textarea', name: 'Textarea' },
  { tag: 'q-reel', name: 'Reel' },
  { tag: 'q-sidepanel', name: 'Sidepanel' },
  { tag: 'q-step-diagram', name: 'Step Diagram' },
  { tag: 'q-scrollable', name: 'Scrollable' }
];

// Local cache for fetched component specifications
const componentRegistry = {};

// App Global State
let activeComponent = 'q-button';
let activeTab = 'sandbox'; // sandbox, variants, edgecases
let pageOverlayMode = false;

// DOM Node references
let sidebarNav, activeCompBadge, stageContainer, attributeKnobs, slotKnobs, codeBlock, eventLogBody, clearLogBtn, pageOverlayToggle, themeToggle;

// Sidebar Helper functions
function openSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const hamburger = document.getElementById('hamburgerMenu');
  if (sidebar) sidebar.classList.add('open');
  if (backdrop) backdrop.classList.add('active');
  if (hamburger) hamburger.classList.add('open');
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const hamburger = document.getElementById('hamburgerMenu');
  if (sidebar) sidebar.classList.remove('open');
  if (hamburger) hamburger.classList.remove('open');

  // Hide backdrop only if knobs panel is also closed
  const knobs = document.querySelector('.knobs-panel');
  if (!knobs || !knobs.classList.contains('open')) {
    if (backdrop) backdrop.classList.remove('active');
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    closeKnobs();
    openSidebar();
  }
}

// Knobs Panel Helper functions
function openKnobs() {
  const knobs = document.querySelector('.knobs-panel');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (knobs) knobs.classList.add('open');
  if (backdrop) backdrop.classList.add('active');
}

function closeKnobs() {
  const knobs = document.querySelector('.knobs-panel');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (knobs) knobs.classList.remove('open');

  // Hide backdrop only if sidebar is also closed
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || !sidebar.classList.contains('open')) {
    if (backdrop) backdrop.classList.remove('active');
  }
}

function toggleKnobs() {
  const knobs = document.querySelector('.knobs-panel');
  if (knobs && knobs.classList.contains('open')) {
    closeKnobs();
  } else {
    closeSidebar();
    openKnobs();
  }
}

// Initialize Application
function initApp() {
  // Bind DOM references
  sidebarNav = document.getElementById('sidebarNav');
  activeCompBadge = document.getElementById('activeCompBadge');
  stageContainer = document.getElementById('stageContainer');
  attributeKnobs = document.getElementById('attributeKnobs');
  slotKnobs = document.getElementById('slotKnobs');
  codeBlock = document.getElementById('codeBlock');
  eventLogBody = document.getElementById('eventLogBody');
  clearLogBtn = document.getElementById('clearLogBtn');
  pageOverlayToggle = document.getElementById('pageOverlayToggle');
  themeToggle = document.getElementById('themeToggle');

  // Hamburger Menu click
  const hamburger = document.getElementById('hamburgerMenu');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      toggleSidebar();
    });
  }

  // Backdrop click
  const backdrop = document.getElementById('sidebarBackdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeSidebar();
      closeKnobs();
    });
  }

  // Knobs toggle click
  const knobsToggle = document.getElementById('knobsToggleBtn');
  if (knobsToggle) {
    knobsToggle.addEventListener('click', () => {
      toggleKnobs();
    });
  }

  // Knobs close click
  const knobsClose = document.getElementById('knobsCloseBtn');
  if (knobsClose) {
    knobsClose.addEventListener('click', () => {
      closeKnobs();
    });
  }

  // Render sidebar
  sidebarNav.innerHTML = '';
  COMPONENTS.forEach(comp => {
    const tag = comp.tag;
    const item = document.createElement('div');
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.className = `sidebar-item ${tag === activeComponent ? 'active' : ''}`;
    item.dataset.tag = tag;
    item.innerHTML = `
      <span>${comp.name}</span>
      <span class="sidebar-item-tag" aria-hidden="true">&lt;${tag}&gt;</span>
    `;
    item.addEventListener('click', () => {
      selectComponent(tag);
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectComponent(tag);
      }
    });
    sidebarNav.appendChild(item);
  });

  // Event listeners for Sub-tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      document.getElementById(`content-${activeTab}`).classList.add('active');

      // Show/hide knobs toggle btn based on active tab
      const toggleBtn = document.getElementById('knobsToggleBtn');
      if (toggleBtn) {
        if (activeTab === 'sandbox') {
          toggleBtn.style.display = ''; // Let CSS media query control it
        } else {
          toggleBtn.style.display = 'none'; // Force hide on other tabs
        }
      }

      // Always close knobs sheet when switching tabs
      closeKnobs();

      renderActiveView();
    });
  });

  // Event listener for Clear Event Log
  clearLogBtn.addEventListener('click', () => {
    eventLogBody.innerHTML = '<span class="log-placeholder">Interactive events will appear here in real-time...</span>';
  });

  // Event listener for Copy Code button
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      copyCode();
    });
  }

  // Event listener for Page Overlay mode
  pageOverlayToggle.addEventListener('change', e => {
    pageOverlayMode = e.target.checked;
    if (pageOverlayMode) {
      stageContainer.classList.add('stage-overlay-mode');
    } else {
      stageContainer.classList.remove('stage-overlay-mode');
    }
    renderActiveView();
  });

  // Event listener for Theme Switcher
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    closeSidebar();
    closeKnobs();
  });

  // Intercept global click actions inside Sandbox stage
  stageContainer.addEventListener('click', e => {
    if (e.target && e.target.id === 'closePanelBtn') {
      const panel = stageContainer.querySelector('q-sidepanel');
      if (panel) {
        panel.open = false;
        // Sync Open Knob checkbox
        const openKnob = document.querySelector('input[data-prop="open"]');
        if (openKnob) {
          openKnob.checked = false;
          updateComponentFromKnobs();
        }
      }
    }
    if (e.target && e.target.id === 'stageOpenPanelBtn') {
      const panel = stageContainer.querySelector('q-sidepanel');
      if (panel) {
        panel.open = true;
        // Sync Open Knob checkbox
        const openKnob = document.querySelector('input[data-prop="open"]');
        if (openKnob) {
          openKnob.checked = true;
          updateComponentFromKnobs();
        }
      }
    }
  });

  // Intercept click triggers for panels in Variants and Edge Cases grids
  document.addEventListener('click', e => {
    if (e.target && e.target.classList.contains('var-open-panel-btn')) {
      const card = e.target.closest('.variant-card');
      if (card) {
        const panel = card.querySelector('q-sidepanel');
        if (panel) panel.open = true;
      }
    }
  });

  // Load initial active view
  selectComponent(activeComponent);
}

// Handle component change
function selectComponent(tag) {
  activeComponent = tag;
  activeCompBadge.innerText = tag;

  // Update sidebar highlight
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tag === tag);
  });

  // Fetch spec if not already in cache
  if (!componentRegistry[tag]) {
    fetch(`/playground/specs/${tag}.spec.json`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load specs for ${tag}`);
        }
        return res.json();
      })
      .then(spec => {
        componentRegistry[tag] = spec;
        if (activeComponent === tag) {
          initAndRender(tag);
        }
      })
      .catch(err => {
        console.error(err);
        if (activeComponent === tag) {
          stageContainer.innerHTML = `<div style="color:var(--q-color-danger); padding:20px; font-weight: 500;">Error loading component specs: ${err.message}</div>`;
        }
      });
  } else {
    initAndRender(tag);
  }
}

function initAndRender(tag) {
  const config = componentRegistry[tag];
  // Initialize values to defaults on component switch
  if (config.props) {
    Object.keys(config.props).forEach(p => {
      config.props[p].currentValue = config.props[p].default;
    });
  }
  if (config.slots) {
    Object.keys(config.slots).forEach(s => {
      config.slots[s].currentValue = config.slots[s].default;
    });
  }

  renderActiveView();
  closeSidebar();
  closeKnobs();
}

// Route view render dependent on sub-tab choice
function renderActiveView() {
  if (activeTab === 'sandbox') {
    buildKnobsPanel();
    renderSandboxComponent();
  } else if (activeTab === 'variants') {
    renderVariantsMatrix();
  } else if (activeTab === 'edgecases') {
    renderEdgeCases();
  }
}

// Build interactive Form Controls panel
function buildKnobsPanel() {
  attributeKnobs.innerHTML = '';
  slotKnobs.innerHTML = '';
  const config = componentRegistry[activeComponent];

  if (!config) return;

  // 1. Build Attribute Knobs
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

      // Render matching knob input
      const inputContainer = document.createElement('div');
      if (prop.type === 'boolean') {
        const label = document.createElement('label');
        label.className = 'switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.prop = propName;
        input.checked = prop.currentValue;
        input.addEventListener('change', () => {
          prop.currentValue = input.checked;
          renderSandboxComponent();
        });

        const span = document.createElement('span');
        span.className = 'slider';

        label.appendChild(input);
        label.appendChild(span);
        inputContainer.appendChild(label);
      } else if (prop.type === 'select') {
        const select = document.createElement('select');
        select.className = 'select-knob';
        select.dataset.prop = propName;

        prop.options.forEach(opt => {
          const optEl = document.createElement('option');
          optEl.value = opt;
          optEl.text = opt || '(none)';
          if (opt === prop.currentValue) optEl.selected = true;
          select.appendChild(optEl);
        });

        select.addEventListener('change', () => {
          prop.currentValue = select.value;
          renderSandboxComponent();
        });
        inputContainer.appendChild(select);
      } else if (prop.type === 'number') {
        const sliderWrap = document.createElement('div');
        sliderWrap.className = 'slider-knob-container';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'slider-knob';
        slider.dataset.prop = propName;
        slider.min = prop.min !== undefined ? prop.min : 0;
        slider.max = prop.max !== undefined ? prop.max : 100;
        slider.value = prop.currentValue;

        const valLabel = document.createElement('span');
        valLabel.className = 'slider-value';
        valLabel.innerText = prop.currentValue;

        slider.addEventListener('input', () => {
          valLabel.innerText = slider.value;
          prop.currentValue = Number(slider.value);
          renderSandboxComponent();
        });

        sliderWrap.appendChild(slider);
        sliderWrap.appendChild(valLabel);
        inputContainer.appendChild(sliderWrap);
      } else {
        // text input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'text-knob';
        input.dataset.prop = propName;
        input.value = prop.currentValue;
        input.addEventListener('input', () => {
          prop.currentValue = input.value;
          renderSandboxComponent();
        });
        inputContainer.appendChild(input);
      }

      row.appendChild(inputContainer);
      attributeKnobs.appendChild(row);
    });
  } else {
    attributeKnobs.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">No customizable attributes.</div>';
  }

  // 2. Build Slot Knobs
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
        input = document.createElement('textarea');
        input.className = 'text-knob';
        input.style.resize = 'vertical';
        input.rows = 4;
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'text-knob';
      }

      input.dataset.slot = slotName;
      input.value = slot.currentValue;
      input.addEventListener('input', () => {
        slot.currentValue = input.value;
        renderSandboxComponent();
      });

      row.appendChild(input);
      slotKnobs.appendChild(row);
    });
  } else {
    slotKnobs.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">No slot options configured.</div>';
  }
}

// Render Active Component inside Interactive Canvas Stage
function renderSandboxComponent() {
  stageContainer.innerHTML = '';
  const config = componentRegistry[activeComponent];

  if (!config) return;

  // Create element
  const el = document.createElement(activeComponent);

  // Apply attribute values
  if (config.props) {
    Object.keys(config.props).forEach(propName => {
      const prop = config.props[propName];
      if (prop.type === 'boolean') {
        el[propName] = prop.currentValue;
        if (prop.currentValue) {
          el.setAttribute(propName, '');
        } else {
          el.removeAttribute(propName);
        }
      } else {
        el[propName] = prop.currentValue;
        if (prop.currentValue !== undefined && prop.currentValue !== '') {
          el.setAttribute(propName, prop.currentValue);
        } else {
          el.removeAttribute(propName);
        }
      }
    });
  }

  // Apply special programmatic data settings
  if (activeComponent === 'q-dropdown') {
    el.options = config.options;
  }

  // Apply Slots
  if (config.slots) {
    Object.keys(config.slots).forEach(slotName => {
      const slot = config.slots[slotName];
      const content = slot.currentValue;
      if (content) {
        if (slotName === 'default') {
          el.innerHTML = content;
        } else {
          const wrapper = document.createElement('span');
          wrapper.setAttribute('slot', slotName);
          wrapper.innerHTML = content;
          el.appendChild(wrapper);
        }
      }
    });
  }

  // Bind interactive events logger
  const eventsToLog = ['qChange', 'qSelect', 'qClose', 'qSlideChange', 'qLightboxOpen', 'qLightboxClose', 'qItemClick', 'qScroll'];
  eventsToLog.forEach(eventName => {
    el.addEventListener(eventName, e => {
      logEvent(eventName, e.detail);

      // Sync states back on user interactive event dispatches
      if (eventName === 'qClose' && activeComponent === 'q-sidepanel') {
        config.props.open.currentValue = false;
        const knob = document.querySelector('input[data-prop="open"]');
        if (knob) knob.checked = false;
        updateCodeBlock();
      }
      if (eventName === 'qChange' && activeComponent === 'q-dropdown') {
        config.props.value.currentValue = e.detail;
        const knob = document.querySelector('select[data-prop="value"]');
        if (knob) knob.value = e.detail;
        updateCodeBlock();
      }
      if (eventName === 'qChange' && activeComponent === 'q-input') {
        config.props.value.currentValue = e.detail;
        const knob = document.querySelector('input[data-prop="value"]');
        if (knob) knob.value = e.detail;
        updateCodeBlock();
      }
      if (eventName === 'qChange' && activeComponent === 'q-textarea') {
        config.props.value.currentValue = e.detail;
        const knob = document.querySelector('input[data-prop="value"]');
        if (knob) knob.value = e.detail;
        updateCodeBlock();
      }
      if (eventName === 'qChange' && activeComponent === 'q-toggle') {
        config.props.checked.currentValue = e.detail;
        const knob = document.querySelector('input[data-prop="checked"]');
        if (knob) knob.checked = e.detail;
        updateCodeBlock();
      }
    });
  });

  // Append component to stage
  stageContainer.appendChild(el);

  // Render helper elements inside stage wrapper
  if (activeComponent === 'q-sidepanel') {
    const helper = document.createElement('div');
    helper.className = 'stage-helper-bar';
    helper.innerHTML = `
      <span class="stage-helper-text">Sidepanel Drawer</span>
      <q-button variant="secondary" size="sm" id="stageOpenPanelBtn">Open Drawer Panel</q-button>
    `;
    stageContainer.appendChild(helper);
  }

  // Make sure dropdown gets fully initialized
  if (activeComponent === 'q-dropdown') {
    requestAnimationFrame(() => {
      el.options = config.options;
      el.value = config.props.value.currentValue;
    });
  }

  // Generate Code Snippet
  updateCodeBlock();
}

// Sync active knobs manually from internal elements if needed
function updateComponentFromKnobs() {
  const config = componentRegistry[activeComponent];
  if (!config) return;
  const el = stageContainer.querySelector(activeComponent);
  if (!el) return;

  if (config.props) {
    Object.keys(config.props).forEach(propName => {
      const prop = config.props[propName];
      const knob = document.querySelector(`[data-prop="${propName}"]`);
      if (!knob) return;

      let val;
      if (prop.type === 'boolean') {
        val = knob.checked;
        el[propName] = val;
        if (val) el.setAttribute(propName, '');
        else el.removeAttribute(propName);
      } else {
        val = knob.value;
        el[propName] = val;
        el.setAttribute(propName, val);
      }
      prop.currentValue = val;
    });
  }
  updateCodeBlock();
}

// Build and highlight Live Code Block Representation
function updateCodeBlock() {
  const config = componentRegistry[activeComponent];
  if (!config) return;
  let code = `<${activeComponent}`;

  // 1. Attributes
  if (config.props) {
    Object.keys(config.props).forEach(propName => {
      const prop = config.props[propName];
      const val = prop.currentValue;
      if (prop.type === 'boolean') {
        if (val) code += ` ${propName}`;
      } else {
        if (val !== undefined && val !== null && val !== '') {
          code += ` ${propName}="${val}"`;
        }
      }
    });
  }

  code += '>';

  // 2. Slots
  let slotContent = '';
  if (config.slots) {
    Object.keys(config.slots).forEach(slotName => {
      const slot = config.slots[slotName];
      const content = slot.currentValue;
      if (content) {
        if (slotName === 'default') {
          slotContent += `\n  ${content.replace(/\n/g, '\n  ')}\n`;
        } else {
          slotContent += `\n  <span slot="${slotName}">${content.replace(/\n/g, '\n  ')}</span>\n`;
        }
      }
    });
  }

  if (slotContent) {
    code += slotContent + `</${activeComponent}>`;
  } else {
    code += `</${activeComponent}>`;
  }

  // Programmatic append block mapping for Dropdown options setup
  if (activeComponent === 'q-dropdown') {
    const optsJson = JSON.stringify(config.options, null, 2);
    code += `\n\n&lt;!-- Programmatic dropdown options population script --&gt;\n&lt;script&gt;\n  const dropdown = document.querySelector('q-dropdown');\n  dropdown.options = ${optsJson.replace(/\n/g, '\n  ')};\n&lt;/script&gt;`;
  }

  codeBlock.innerHTML = highlightHTML(code);
}

// Simple client-side Syntax Highlighter regex replacement parser
function highlightHTML(htmlText) {
  let esc = htmlText;
  if (!esc.includes('&lt;')) {
    esc = esc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return (
    esc
      // Match comments
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="code-comment">$1</span>')
      // Match attribute value strings (do values first to format strings safely)
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

// Log dispatches list
function logEvent(name, detail) {
  const placeholder = eventLogBody.querySelector('.log-placeholder');
  if (placeholder) placeholder.remove();

  const now = new Date();
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const timeStr = now.toTimeString().split(' ')[0] + '.' + ms;

  const line = document.createElement('div');
  line.className = 'log-item';
  line.innerHTML = `
    <span class="log-item-time">[${timeStr}]</span>
    <strong>${name}</strong>: ${detail !== undefined ? JSON.stringify(detail) : '<em>(void detail)</em>'}
  `;

  eventLogBody.appendChild(line);
  const scrollable = eventLogBody.closest('q-scrollable');
  if (scrollable && typeof scrollable.scrollToBottom === 'function') {
    scrollable.scrollToBottom();
  } else {
    eventLogBody.scrollTop = 999999;
  }
}

// Generate HTML code text for Static Gallery Views
function getStaticComponentCode(tag, props, slotText, slotObj) {
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

// Helper to initialize custom properties on specific components
function setupSpecialInstanceProps(el, tag) {
  if (tag === 'q-dropdown') {
    if (componentRegistry['q-dropdown']) {
      el.options = componentRegistry['q-dropdown'].options;
    } else {
      fetch('/playground/specs/q-dropdown.spec.json')
        .then(res => res.json())
        .then(spec => {
          componentRegistry['q-dropdown'] = spec;
          el.options = spec.options;
        });
    }
  }
}

// Render Sub-tab View 2: All Variants Grid Gallery
function renderVariantsMatrix() {
  const grid = document.getElementById('variantsGrid');
  grid.innerHTML = '';
  const config = componentRegistry[activeComponent];

  if (!config) return;

  if (!config.variants || config.variants.length === 0) {
    grid.innerHTML = '<div style="grid-column: span 3; padding:40px; text-align:center; color:var(--text-muted)">No variant matrix defined for this component.</div>';
    return;
  }

  config.variants.forEach(variant => {
    const card = document.createElement('div');
    card.className = 'variant-card';

    const titleRow = document.createElement('div');
    titleRow.className = 'variant-title-row';
    titleRow.innerHTML = `<h4 class="variant-card-title">${variant.name}</h4>`;
    card.appendChild(titleRow);

    // Render stage containing variant instance
    const stage = document.createElement('div');
    stage.className = 'variant-card-stage';

    const el = document.createElement(activeComponent);
    // Apply props
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

    // Apply slots
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
      // Apply other default slots
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

    setupSpecialInstanceProps(el, activeComponent);

    // Open Helper trigger for sidepanel drawer
    if (activeComponent === 'q-sidepanel') {
      const btn = document.createElement('q-button');
      btn.variant = 'secondary';
      btn.size = 'sm';
      btn.className = 'var-open-panel-btn';
      btn.innerHTML = 'Trigger Drawer Panel';
      card.appendChild(btn);
    }

    // Code representation block
    const codeText = getStaticComponentCode(activeComponent, variant.props, defaultSlot, variant.slots || null);
    const codePre = document.createElement('pre');
    codePre.className = 'variant-card-code';
    codePre.innerHTML = highlightHTML(codeText);
    card.appendChild(codePre);

    grid.appendChild(card);
  });

  // Final layout force init for Stencil components
  document.querySelectorAll('q-dropdown').forEach(dropdown => {
    if (componentRegistry['q-dropdown']) {
      dropdown.options = componentRegistry['q-dropdown'].options;
    } else {
      setupSpecialInstanceProps(dropdown, 'q-dropdown');
    }
  });
}

// Render Sub-tab View 3: Edge Cases Stress-testing Gallery
function renderEdgeCases() {
  const grid = document.getElementById('edgecasesGrid');
  grid.innerHTML = '';
  const config = componentRegistry[activeComponent];

  if (!config) return;

  if (!config.edgeCases || config.edgeCases.length === 0) {
    grid.innerHTML =
      '<div style="grid-column: span 3; padding:40px; text-align:center; color:var(--text-muted)">No stress-test layout edge cases defined for this component.</div>';
    return;
  }

  config.edgeCases.forEach(edge => {
    const card = document.createElement('div');
    card.className = 'variant-card';

    const titleRow = document.createElement('div');
    titleRow.className = 'variant-title-row';
    titleRow.innerHTML = `<h4 class="variant-card-title">${edge.name}</h4>`;
    card.appendChild(titleRow);

    // Render stage
    const stage = document.createElement('div');
    stage.className = 'variant-card-stage';

    const el = document.createElement(activeComponent);
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

    setupSpecialInstanceProps(el, activeComponent);

    // Open Helper trigger for sidepanel drawer
    if (activeComponent === 'q-sidepanel') {
      const btn = document.createElement('q-button');
      btn.variant = 'secondary';
      btn.size = 'sm';
      btn.className = 'var-open-panel-btn';
      btn.innerHTML = 'Trigger Drawer Panel';
      card.appendChild(btn);
    }

    // Code representation block
    const codeText = getStaticComponentCode(activeComponent, edge.props, defaultSlot, edge.slots || null);
    const codePre = document.createElement('pre');
    codePre.className = 'variant-card-code';
    codePre.innerHTML = highlightHTML(codeText);
    card.appendChild(codePre);

    grid.appendChild(card);
  });

  // Final layout force init
  document.querySelectorAll('q-dropdown').forEach(dropdown => {
    if (componentRegistry['q-dropdown']) {
      dropdown.options = componentRegistry['q-dropdown'].options;
    } else {
      setupSpecialInstanceProps(dropdown, 'q-dropdown');
    }
  });
}

// Copy text code preview
function copyCode() {
  const textToCopy = codeBlock.innerText;
  navigator.clipboard.writeText(textToCopy).then(() => {
    const btn = document.getElementById('copyBtn');
    const oldText = btn.innerText;
    btn.innerText = 'Copied!';
    btn.style.background = '#2ea44f';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.innerText = oldText;
      btn.style.background = 'transparent';
      btn.style.color = '#c9d1d9';
    }, 2000);
  });
}

// Kickoff App Initialization on load
window.addEventListener('DOMContentLoaded', () => {
  initApp();
});
