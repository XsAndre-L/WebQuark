import { Menu, X } from '@lucide/icons';
import { h } from '../../dom-factory';
import { theme, effect } from '../../state';
import { setButtonState } from '../button-accessibility';
import css from './playground-header.css';

class PlaygroundHeader extends HTMLElement {
  private cleanupThemeEffect?: () => void;
  private hamburgerBtn: HTMLQButtonElement | null = null;

  private listeners?: AbortController;
  private mobile = matchMedia('(max-width: 900px)');

  connectedCallback(): void {
    // 1. Render template via TSX
    this.innerHTML = '';
    this.appendChild(
      <header class="app-header">
        <q-button
          class="hamburger-menu"
          id="hamburgerMenu"
          aria-controls="component-navigation" aria-expanded="false"
          aria-label="Toggle Menu"
          type="button"
          variant="text"
          icon-only="true"
          onClick={() => this.toggleSidebar()}
        >
          {Object.assign(<q-icon slot="icon-left" size="20" />, { definition: Menu })}
        </q-button>
        <div class="header-logo">
          <img src="/logo.svg" class="logo-image" alt="" />
          <div class="logo-text">WebQuark</div>
        </div>
        <div class="header-actions">
          <q-link href="./presets.html">Design presets</q-link>
          <q-button id="themeToggle" variant="ghost" aria-label="Toggle color theme" onClick={() => this.toggleTheme()}>
            <q-icon id="themeIcon" slot="icon-left" name="sun"></q-icon>
          </q-button>
        </div>
      </header>
    );

    // 2. Inject CSS stylesheet (scoped style wrapper)
    const styleId = 'playground-header-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css as any;
      document.head.appendChild(style);
    }

    this.init();
  }

  private init(): void {
    this.hamburgerBtn = this.querySelector('#hamburgerMenu');
    const backdrop = document.getElementById('sidebarBackdrop');

    // React to Theme changes (Angular-style Signal Effect)
    this.cleanupThemeEffect = effect(() => {
      const currentTheme = theme();
      document.documentElement.setAttribute('data-theme', currentTheme);
      this.querySelector('#themeToggle')?.setAttribute('aria-label', currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      const iconEl = this.querySelector('#themeIcon');
      if (iconEl) {
        iconEl.setAttribute('name', currentTheme === 'dark' ? 'sun' : 'moon');
      }
    });

    this.listeners = new AbortController();
    const { signal } = this.listeners;
    backdrop?.addEventListener('click', () => this.setSidebar(false, 'trigger'), { signal });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.hamburgerBtn?.classList.contains('open')) this.setSidebar(false, 'trigger');
    }, { signal });
    document.addEventListener('playground-navigation', () => {
      if (this.mobile.matches) this.setSidebar(false, 'content');
    }, { signal });
    this.mobile.addEventListener('change', () => this.setSidebar(false), { signal });
    this.setSidebar(false);
  }

  private toggleTheme(): void {
    const newTheme = theme() === 'dark' ? 'light' : 'dark';
    theme.set(newTheme);
  }

  private toggleSidebar(): void {
    this.setSidebar(!this.hamburgerBtn?.classList.contains('open'));
  }

  private setSidebar(open: boolean, focus?: 'trigger' | 'content'): void {
    const sidebar = document.querySelector<HTMLElement>('playground-sidebar');
    const main = document.querySelector<HTMLElement>('.main-panel');
    const properties = document.querySelector<HTMLElement>('properties-panel');
    if (!sidebar) return;
    sidebar.id = 'component-navigation';
    sidebar.classList.toggle('open', open);
    sidebar.inert = this.mobile.matches && !open;
    document.getElementById('sidebarBackdrop')?.classList.toggle('active', open);
    this.hamburgerBtn?.classList.toggle('open', open);
    if (this.hamburgerBtn) void setButtonState(this.hamburgerBtn, 'aria-expanded', open);
    const icon = this.hamburgerBtn?.querySelector('q-icon');
    if (icon) icon.definition = open ? X : Menu;
    if (main) main.inert = open;
    if (properties) properties.inert = open;

    if (open) {
      sidebar.tabIndex = -1;
      sidebar.focus();
    } else if (focus === 'trigger') this.hamburgerBtn?.focus();
    else if (focus === 'content' && main) {
      main.tabIndex = -1;
      main.focus();
    }
  }

  disconnectedCallback(): void {
    this.listeners?.abort();
    this.setSidebar(false);
    if (this.cleanupThemeEffect) {
      this.cleanupThemeEffect();
    }
  }
}

customElements.define('playground-header', PlaygroundHeader);
export { PlaygroundHeader };
