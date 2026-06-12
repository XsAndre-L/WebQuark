import { loadComponentResources } from '../loader-helper.js';
import { theme, effect } from '../../state.js';

const THEME_TOKENS = [
  {
    category: 'Brand & Status Colors',
    tokens: [
      { name: '--q-color-primary', label: 'Primary Color', type: 'color', desc: 'Main brand/accent color' },
      { name: '--q-color-primary-hover', label: 'Primary Hover', type: 'color', desc: 'Hover state for primary actions' },
      { name: '--q-color-secondary', label: 'Secondary Color', type: 'color', desc: 'Secondary/muted accent color' },
      { name: '--q-color-success', label: 'Success Color', type: 'color', desc: 'Success indicator' },
      { name: '--q-color-warning', label: 'Warning Color', type: 'color', desc: 'Warning indicator' },
      { name: '--q-color-danger', label: 'Danger Color', type: 'color', desc: 'Danger/Error indicator' }
    ]
  },
  {
    category: 'Surfaces & Backgrounds',
    tokens: [
      { name: '--q-bg-base', label: 'Base Background', type: 'color', desc: 'Lowest canvas background' },
      { name: '--q-bg-surface-1', label: 'Surface 1', type: 'color', desc: 'Sidebar/surface panels' },
      { name: '--q-bg-surface-2', label: 'Surface 2', type: 'color', desc: 'Nested tabs/toolbar sections' },
      { name: '--q-bg-surface-3', label: 'Surface 3', type: 'color', desc: 'Dropdowns/popovers' }
    ]
  },
  {
    category: 'Borders & Outlines',
    tokens: [
      { name: '--q-border-color', label: 'Border Color', type: 'color', desc: 'Subtle container border' }
    ]
  },
  {
    category: 'Border Radii',
    tokens: [
      { name: '--q-radius-sm', label: 'Small Radius', type: 'radius', min: 0, max: 40, desc: 'Badges and small components' },
      { name: '--q-radius-md', label: 'Medium Radius', type: 'radius', min: 0, max: 40, desc: 'Buttons, inputs, thumbnails' },
      { name: '--q-radius-lg', label: 'Large Radius', type: 'radius', min: 0, max: 40, desc: 'Cards, dropdown menus, panels' }
    ]
  }
];

function convertToHex(rgbVal) {
  if (!rgbVal) return '#000000';
  rgbVal = rgbVal.trim();
  if (rgbVal.startsWith('#')) {
    return rgbVal;
  }
  const match = rgbVal.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  return rgbVal;
}

class PlaygroundThemeDesigner extends HTMLElement {
  async connectedCallback() {
    try {
      const html = await loadComponentResources('playground-theme-designer');
      this.innerHTML = html;
      this.init();
    } catch (err) {
      console.error('Failed to load theme designer component:', err);
    }
  }

  init() {
    const grid = this.querySelector('#themeSectionsGrid');
    const resetThemeBtn = this.querySelector('#resetThemeBtn');
    if (!grid) return;
    this._tokenInputs = new Map();

    grid.innerHTML = '';
    const computedStyle = window.getComputedStyle(document.documentElement);

    // 1. Build Token Groups
    THEME_TOKENS.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'theme-section-card';
      
      const h3 = document.createElement('h3');
      h3.innerText = cat.category;
      card.appendChild(h3);

      cat.tokens.forEach(token => {
        card.appendChild(this.buildTokenRow(token, computedStyle));
      });

      grid.appendChild(card);
    });

    // 2. Reset Theme Button Action
    if (resetThemeBtn) {
      resetThemeBtn.addEventListener('click', () => {
        document.documentElement.style.cssText = '';
        setTimeout(() => this.syncThemeInputs(), 50);
      });
    }

    // 3. Sync theme inputs on global theme signal change (effect)
    this.cleanupThemeSync = effect(() => {
      // Consume theme signal
      theme();
      setTimeout(() => this.syncThemeInputs(), 50);
    });
  }

  buildTokenRow(token, computedStyle) {
    const val = computedStyle.getPropertyValue(token.name).trim();
    const row = document.createElement('div');
    row.className = 'token-row';

    const info = document.createElement('div');
    info.className = 'token-info';
    const label = document.createElement('span');
    label.className = 'token-label';
    label.innerText = token.label;
    const desc = document.createElement('span');
    desc.className = 'token-desc';
    desc.innerText = token.desc;
    info.appendChild(label);
    info.appendChild(desc);
    row.appendChild(info);

    const controlWrapper = document.createElement('div');
    controlWrapper.className = 'token-control-wrapper';

    if (token.type === 'color') {
      const hexVal = convertToHex(val);
      const colorContainer = document.createElement('div');
      colorContainer.className = 'color-input-container';
      const pickerWrapper = document.createElement('div');
      pickerWrapper.className = 'color-picker-wrapper';
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.className = 'color-swatch-picker';
      picker.dataset.token = token.name;
      picker.value = hexVal;
      pickerWrapper.appendChild(picker);
      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.className = 'color-text-input';
      textInput.dataset.token = token.name;
      textInput.value = hexVal;
      colorContainer.appendChild(pickerWrapper);
      colorContainer.appendChild(textInput);
      controlWrapper.appendChild(colorContainer);
      picker.addEventListener('input', (e) => {
        const newColor = e.target.value;
        textInput.value = newColor;
        document.documentElement.style.setProperty(token.name, newColor);
      });
      textInput.addEventListener('input', (e) => {
        const newColor = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(newColor)) {
          picker.value = newColor;
          document.documentElement.style.setProperty(token.name, newColor);
        }
      });
      this._tokenInputs.set(token.name, { type: 'color', picker, textInput });
    } else if (token.type === 'radius') {
      const numVal = parseInt(val, 10) || 0;
      const rangeContainer = document.createElement('div');
      rangeContainer.className = 'range-slider-container';
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'range-slider-input';
      slider.min = token.min;
      slider.max = token.max;
      slider.value = numVal;
      slider.dataset.token = token.name;
      const valDisplay = document.createElement('span');
      valDisplay.className = 'range-slider-value';
      valDisplay.dataset.token = token.name;
      valDisplay.innerText = `${numVal}px`;
      rangeContainer.appendChild(slider);
      rangeContainer.appendChild(valDisplay);
      controlWrapper.appendChild(rangeContainer);
      slider.addEventListener('input', (e) => {
        const num = e.target.value;
        valDisplay.innerText = `${num}px`;
        document.documentElement.style.setProperty(token.name, `${num}px`);
      });
      this._tokenInputs.set(token.name, { type: 'radius', range: slider, valueDisplay: valDisplay });
    }

    row.appendChild(controlWrapper);
    return row;
  }

  syncThemeInputs() {
    const computedStyle = window.getComputedStyle(document.documentElement);
    this._tokenInputs.forEach((refs, tokenName) => {
      const value = computedStyle.getPropertyValue(tokenName).trim();
      if (refs.type === 'color') {
        const hex = convertToHex(value);
        if (refs.picker) refs.picker.value = hex;
        if (refs.textInput) refs.textInput.value = hex;
      } else if (refs.type === 'radius') {
        const num = parseInt(value, 10) || 0;
        if (refs.range) refs.range.value = num;
        if (refs.valueDisplay) refs.valueDisplay.innerText = `${num}px`;
      }
    });
  }

  disconnectedCallback() {
    if (this.cleanupThemeSync) {
      this.cleanupThemeSync();
    }
  }
}

customElements.define('playground-theme-designer', PlaygroundThemeDesigner);
export { PlaygroundThemeDesigner };
