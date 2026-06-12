import { loadComponentResources } from '../loader-helper.js';
import { theme, effect } from '../../state.js';

class PlaygroundHeader extends HTMLElement {
  async connectedCallback() {
    try {
      const html = await loadComponentResources('playground-header');
      this.innerHTML = html;
      this.init();
    } catch (err) {
      console.error('Failed to load header component:', err);
    }
  }

  init() {
    const themeBtn = this.querySelector('#themeToggle');
    const hamburgerBtn = this.querySelector('#hamburgerMenu');
    const backdrop = document.getElementById('sidebarBackdrop');

    // 1. Theme Button Click Listener
    themeBtn.addEventListener('click', () => {
      const newTheme = theme() === 'dark' ? 'light' : 'dark';
      theme.set(newTheme);
    });

    // 2. React to Theme changes (Angular-style Signal Effect)
    this.cleanupThemeEffect = effect(() => {
      const currentTheme = theme();
      document.documentElement.setAttribute('data-theme', currentTheme);
      themeBtn.textContent = currentTheme === 'dark' ? 'Light Theme' : 'Dark Theme';
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

  disconnectedCallback() {
    if (this.cleanupThemeEffect) {
      this.cleanupThemeEffect();
    }
  }
}

customElements.define('playground-header', PlaygroundHeader);
export { PlaygroundHeader };
