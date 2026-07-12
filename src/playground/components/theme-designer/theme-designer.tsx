import { h } from '../../dom-factory';
import { theme, effect } from '../../state';
import './token-section';
import css from './theme-designer.css';
import { TokenItem } from './token-row';

export interface TokenCategory {
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
      { name: '--q-bg-surface-1', label: 'Surface 1', type: 'color', desc: 'Sidebar / primary panels' },
      { name: '--q-bg-surface-2', label: 'Surface 2', type: 'color', desc: 'Cards / nested panels' },
      { name: '--q-bg-surface-3', label: 'Surface 3', type: 'color', desc: 'Popovers / raised controls' },
      { name: '--q-bg-surface-4', label: 'Surface 4', type: 'color', desc: 'Strong raised surfaces' },
      { name: '--q-bg-surface-5', label: 'Surface 5', type: 'color', desc: 'Highest contrast neutral surface' }
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

export class ThemeDesigner extends HTMLElement {
  private cleanupThemeSync?: () => void;

  connectedCallback(): void {
    this.innerHTML = '';
    this.appendChild(
      <div class="theme-designer-container">
        <div class="theme-designer-header">
          <div style="flex: 1">
            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--q-fg-base)">Global Styling Designer</h2>
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

    // Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'theme-designer-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css as any;
      document.head.appendChild(style);
    }

    this.init();
  }

  private init(): void {
    this.cleanupThemeSync = effect(() => {
      theme(); // Consume signal reactively
      setTimeout(() => this.syncThemeInputs(), 50);
    });
  }

  private renderGrid(): HTMLElement {
    const grid = (
      <div class="theme-sections-grid" id="themeSectionsGrid"></div>
    ) as HTMLElement;

    THEME_TOKENS.forEach(cat => {
      const card = document.createElement('token-section') as any;
      card.categoryName = cat.category;
      card.tokens = cat.tokens;
      grid.appendChild(card);
    });

    return grid;
  }

  private resetTheme(): void {
    document.documentElement.style.cssText = '';
    setTimeout(() => this.syncThemeInputs(), 50);
  }

  private syncThemeInputs(): void {
    this.querySelectorAll('token-row').forEach((row: any) => {
      if (typeof row.syncValue === 'function') {
        row.syncValue();
      }
    });
  }

  disconnectedCallback(): void {
    if (this.cleanupThemeSync) {
      this.cleanupThemeSync();
    }
  }
}

customElements.define('theme-designer', ThemeDesigner);
