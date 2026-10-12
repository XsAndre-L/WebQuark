import { h } from '../../dom-factory';
import { theme, effect } from '../../state';
import './token-section';
import css from './theme-designer.css';
import { TokenItem } from './token-row';
import { dimensionTokens, themeGroups } from '../../../browser/theme/tokens';

export interface TokenCategory {
  category: string;
  tokens: TokenItem[];
}

const THEME_TOKENS: TokenCategory[] = [
  {
    category: 'Spacing & Control Sizing',
    tokens: dimensionTokens.map(token => ({ ...token, type: 'dimension', min: 0, max: 64, desc: token.name })),
  },
  ...themeGroups.map(group => ({
    category: group.category,
    tokens: group.tokens.map(token => ({
      name: token.name,
      label: token.name.replace('--q-', '').replaceAll('-', ' '),
      type: /^#[0-9a-f]{6}$/i.test(token.value) ? 'color' as const : token.name.startsWith('--q-radius-') ? 'radius' as const : 'text' as const,
      desc: token.name,
    })),
  })),
];

export class ThemeDesigner extends HTMLElement {
  private cleanupThemeSync?: () => void;

  connectedCallback(): void {
    this.innerHTML = '';
    this.appendChild(
      <div class="theme-designer-container">
        <div class="theme-designer-header">
          <div style="flex: 1">
            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--q-fg-base)">Theme Designer</h2>
            <p class="theme-designer-desc">Customize colors, dimensions, and component defaults. Overrides apply to all sandbox components.</p>
          </div>
          <button id="resetThemeBtn" class="reset-theme-btn" type="button" onClick={() => this.resetTheme()}>
            <q-icon name="refresh-cw" library="lucide" size="16"></q-icon>
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
