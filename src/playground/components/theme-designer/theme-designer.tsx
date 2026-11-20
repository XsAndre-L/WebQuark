import { h } from '../../dom-factory';
import { RefreshCw } from '@lucide/icons';
import { theme, effect } from '../../state';
import './token-section';
import { dimensionTokenItems } from './dimension-tokens';
import css from './theme-designer.css';
import { TokenItem } from './token-row';
import { themeGroups, presetTokens } from '../../../browser/theme/tokens';

export interface TokenCategory {
  category: string;
  tokens: TokenItem[];
}

const groupedNames = new Set([...dimensionTokenItems, ...themeGroups.flatMap(group => group.tokens)].map(token => token.name));

const THEME_TOKENS: TokenCategory[] = [
  {
    category: 'Spacing & Control Sizing',
    tokens: dimensionTokenItems,
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
  {
    category: 'Preset typography, spacing and component defaults',
    tokens: presetTokens.filter(token => !groupedNames.has(token.name)).map(token => ({
      name: token.name, label: token.name.slice(4).replaceAll('-', ' '), type: 'text', desc: token.name,
    })),
  },
];

// Token overrides live on the document root and survive navigation between examples.
const previousTokenValues = new Map<string, { value: string; priority: string }>();

export class ThemeDesigner extends HTMLElement {
  private cleanupThemeSync?: () => void;

  private frame = 0;

  private editToken = (event: Event): void => {
    const { name, value } = (event as CustomEvent<{ name: string; value: string }>).detail;
    const style = document.documentElement.style;
    if (!previousTokenValues.has(name)) {
      previousTokenValues.set(name, { value: style.getPropertyValue(name), priority: style.getPropertyPriority(name) });
    }
    if (value) style.setProperty(name, value);
    else style.removeProperty(name);
    this.scheduleSync();
  };

  connectedCallback(): void {
    this.addEventListener('token-edit', this.editToken);
    this.innerHTML = '';
    this.appendChild(
      <div class="theme-designer-container">
        <div class="theme-designer-header">
          <div style="flex: 1">
            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--q-fg-base)">Theme Designer</h2>
            <p class="theme-designer-desc">Customize colors, dimensions, and component defaults. Overrides apply to all sandbox components.</p>
          </div>
          <q-button id="resetThemeBtn" variant="secondary" size="sm" type="button" onClick={() => this.resetTheme()}>
            {Object.assign(<q-icon slot="icon-left" name="refresh-cw" size="16" />, { definition: RefreshCw })}
            Reset to Default
          </q-button>
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
      this.scheduleSync();
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
    const style = document.documentElement.style;
    previousTokenValues.forEach(({ value, priority }, name) => {
      if (value) style.setProperty(name, value, priority);
      else style.removeProperty(name);
    });
    previousTokenValues.clear();
    this.scheduleSync();
  }

  private scheduleSync(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.syncThemeInputs());
  }

  private syncThemeInputs(): void {
    this.querySelectorAll('token-row').forEach((row: any) => {
      if (typeof row.syncValue === 'function') {
        row.syncValue();
      }
    });
  }

  disconnectedCallback(): void {
    this.removeEventListener('token-edit', this.editToken);
    cancelAnimationFrame(this.frame);
    if (this.cleanupThemeSync) {
      this.cleanupThemeSync();
    }
  }
}

customElements.define('theme-designer', ThemeDesigner);
