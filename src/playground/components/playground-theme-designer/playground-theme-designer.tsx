import { h } from '../../dom-factory';
import { theme, effect } from '../../state';
import css from './playground-theme-designer.css';

interface TokenItem {
  name: string;
  label: string;
  type: 'color' | 'radius';
  desc: string;
  min?: number;
  max?: number;
}

interface TokenCategory {
  category: string;
  tokens: TokenItem[];
}

const THEME_TOKENS: TokenCategory[] = [
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

function convertToHex(rgbVal: string): string {
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
  private _tokenInputs = new Map<string, any>();
  private cleanupThemeSync?: () => void;

  connectedCallback(): void {
    // 1. Render layout template via TSX
    this.innerHTML = '';
    this.appendChild(
      <div class="theme-designer-container">
        <div class="theme-designer-header">
          <div style="flex: 1">
            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main)">Global Styling Designer</h2>
            <p class="theme-designer-desc">Customize global brand tokens and spacing variables. Overrides apply instantly to all sandbox components.</p>
          </div>
          <button id="resetThemeBtn" class="reset-theme-btn" type="button" onClick={() => this.resetTheme()}>
            <q-icon name="refresh-cw" lib="lucide" size="16"></q-icon>
            <span>Reset to Default</span>
          </button>
        </div>
        {this.renderGrid()}
      </div>
    );

    // 2. Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'playground-theme-designer-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css as any;
      document.head.appendChild(style);
    }

    this.init();
  }

  private init(): void {
    // Sync theme inputs on global theme signal change (effect)
    this.cleanupThemeSync = effect(() => {
      theme(); // Consume signal
      setTimeout(() => this.syncThemeInputs(), 50);
    });
  }

  private renderGrid(): HTMLElement {
    this._tokenInputs = new Map();
    const computedStyle = window.getComputedStyle(document.documentElement);

    return (
      <div class="theme-sections-grid" id="themeSectionsGrid">
        {THEME_TOKENS.map(cat => (
          <div class="theme-section-card">
            <h3>{cat.category}</h3>
            {cat.tokens.map(token => this.renderTokenRow(token, computedStyle))}
          </div>
        ))}
      </div>
    );
  }

  private renderTokenRow(token: TokenItem, computedStyle: CSSStyleDeclaration): HTMLElement {
    const val = computedStyle.getPropertyValue(token.name).trim();
    let control: HTMLElement;

    if (token.type === 'color') {
      const hexVal = convertToHex(val);

      const picker = (
        <input
          type="color"
          class="color-swatch-picker"
          data-token={token.name}
          value={hexVal}
          onInput={(e: Event) => {
            const target = e.target as HTMLInputElement;
            const textInput = this.querySelector(`input[type="text"][data-token="${token.name}"]`) as HTMLInputElement | null;
            if (textInput) textInput.value = target.value;
            document.documentElement.style.setProperty(token.name, target.value);
          }}
        />
      ) as HTMLInputElement;

      const textInput = (
        <input
          type="text"
          class="color-text-input"
          data-token={token.name}
          value={hexVal}
          onInput={(e: Event) => {
            const target = e.target as HTMLInputElement;
            const newColor = target.value;
            if (/^#[0-9A-F]{6}$/i.test(newColor)) {
              const pickerEl = this.querySelector(`input[type="color"][data-token="${token.name}"]`) as HTMLInputElement | null;
              if (pickerEl) pickerEl.value = newColor;
              document.documentElement.style.setProperty(token.name, newColor);
            }
          }}
        />
      ) as HTMLInputElement;

      this._tokenInputs.set(token.name, { type: 'color', picker, textInput });

      control = (
        <div class="color-input-container">
          <div class="color-picker-wrapper">{picker}</div>
          {textInput}
        </div>
      );
    } else {
      const numVal = parseInt(val, 10) || 0;

      const valDisplay = (
        <span class="range-slider-value" data-token={token.name}>
          {numVal}px
        </span>
      ) as HTMLElement;

      const slider = (
        <input
          type="range"
          class="range-slider-input"
          min={String(token.min ?? 0)}
          max={String(token.max ?? 40)}
          value={String(numVal)}
          data-token={token.name}
          onInput={(e: Event) => {
            const target = e.target as HTMLInputElement;
            valDisplay.innerText = `${target.value}px`;
            document.documentElement.style.setProperty(token.name, `${target.value}px`);
          }}
        />
      ) as HTMLInputElement;

      this._tokenInputs.set(token.name, { type: 'radius', range: slider, valueDisplay: valDisplay });

      control = (
        <div class="range-slider-container">
          {slider}
          {valDisplay}
        </div>
      );
    }

    return (
      <div class="token-row">
        <div class="token-info">
          <span class="token-label">{token.label}</span>
          <span class="token-desc">{token.desc}</span>
        </div>
        <div class="token-control-wrapper">{control}</div>
      </div>
    );
  }

  private resetTheme(): void {
    document.documentElement.style.cssText = '';
    setTimeout(() => this.syncThemeInputs(), 50);
  }

  private syncThemeInputs(): void {
    const computedStyle = window.getComputedStyle(document.documentElement);
    this._tokenInputs.forEach((refs, tokenName) => {
      const value = computedStyle.getPropertyValue(tokenName).trim();
      if (refs.type === 'color') {
        const hex = convertToHex(value);
        if (refs.picker) refs.picker.value = hex;
        if (refs.textInput) refs.textInput.value = hex;
      } else if (refs.type === 'radius') {
        const num = parseInt(value, 10) || 0;
        if (refs.range) refs.range.value = String(num);
        if (refs.valueDisplay) refs.valueDisplay.innerText = `${num}px`;
      }
    });
  }

  disconnectedCallback(): void {
    if (this.cleanupThemeSync) {
      this.cleanupThemeSync();
    }
  }
}

customElements.define('playground-theme-designer', PlaygroundThemeDesigner);
export { PlaygroundThemeDesigner };
