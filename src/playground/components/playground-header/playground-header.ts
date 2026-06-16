import { theme, effect } from '../../state';
import html from './playground-header.html';
import css from './playground-header.css';

class PlaygroundHeader extends HTMLElement {
  private cleanupThemeEffect?: () => void;

  connectedCallback(): void {
    // 1. Inject template HTML
    this.innerHTML = html;

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
    const themeBtn = this.querySelector('#themeToggle') as HTMLElement | null;
    const hamburgerBtn = this.querySelector('#hamburgerMenu') as HTMLElement | null;
    const backdrop = document.getElementById('sidebarBackdrop') as HTMLElement | null;

    // 1. Theme Button Click Listener
    themeBtn?.addEventListener('click', () => {
      const newTheme = theme() === 'dark' ? 'light' : 'dark';
      theme.set(newTheme);
    });

    // 2. React to Theme changes (Angular-style Signal Effect)
    this.cleanupThemeEffect = effect(() => {
      const currentTheme = theme();
      document.documentElement.setAttribute('data-theme', currentTheme);
      const iconEl = this.querySelector('#themeIcon');
      if (iconEl) {
        iconEl.setAttribute('name', currentTheme === 'dark' ? 'sun' : 'moon');
      }
    });

    // 3. Hamburger Menu (Mobile responsive sidebar toggler)
    if (hamburgerBtn) {
      const toggleSidebar = () => {
        const sidebar = document.querySelector('playground-sidebar');
        if (sidebar) sidebar.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('active');
        hamburgerBtn.classList.toggle('open');
      };

      hamburgerBtn.addEventListener('click', toggleSidebar);

      if (backdrop) {
        backdrop.addEventListener('click', () => {
          const sidebar = document.querySelector('playground-sidebar');
          if (sidebar) sidebar.classList.remove('open');
          backdrop.classList.remove('active');
          hamburgerBtn.classList.remove('open');
        });
      }
    }
  }

  disconnectedCallback(): void {
    if (this.cleanupThemeEffect) {
      this.cleanupThemeEffect();
    }
  }
}

customElements.define('playground-header', PlaygroundHeader);
export { PlaygroundHeader };
