import { h } from '../../dom-factory';
import { theme, effect } from '../../state';
import css from './playground-header.css';

class PlaygroundHeader extends HTMLElement {
  private cleanupThemeEffect?: () => void;
  private hamburgerBtn: HTMLElement | null = null;

  connectedCallback(): void {
    // 1. Render template via TSX
    this.innerHTML = '';
    this.appendChild(
      <header class="app-header">
        <button
          class="hamburger-menu"
          id="hamburgerMenu"
          aria-label="Toggle Menu"
          type="button"
          onClick={() => this.toggleSidebar()}
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        <div class="header-logo">
          <img src="/logo.svg" class="logo-image" alt="WebQuark Logo" />
          <div class="logo-text">WebQuark Sandbox</div>
        </div>
        <div class="header-actions">
          <q-button id="themeToggle" variant="ghost" onClick={() => this.toggleTheme()}>
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
      const iconEl = this.querySelector('#themeIcon');
      if (iconEl) {
        iconEl.setAttribute('name', currentTheme === 'dark' ? 'sun' : 'moon');
      }
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        const sidebar = document.querySelector('playground-sidebar');
        if (sidebar) sidebar.classList.remove('open');
        backdrop.classList.remove('active');
        if (this.hamburgerBtn) this.hamburgerBtn.classList.remove('open');
      });
    }
  }

  private toggleTheme(): void {
    const newTheme = theme() === 'dark' ? 'light' : 'dark';
    theme.set(newTheme);
  }

  private toggleSidebar(): void {
    const sidebar = document.querySelector('playground-sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('active');
    if (this.hamburgerBtn) this.hamburgerBtn.classList.toggle('open');
  }

  disconnectedCallback(): void {
    if (this.cleanupThemeEffect) {
      this.cleanupThemeEffect();
    }
  }
}

customElements.define('playground-header', PlaygroundHeader);
export { PlaygroundHeader };
