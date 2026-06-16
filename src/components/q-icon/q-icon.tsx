import { Component, Prop, State, Watch, h, Host } from '@stencil/core';

@Component({
  tag: 'q-icon',
  styleUrl: 'q-icon.css',
  shadow: true,
})
export class QIcon {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /**
   * The name of the icon (e.g., 'settings', 'heart', or a filename like 'logo.png').
   */
  @Prop() name: string;

  /**
   * The library to load the icon from.
   * Options: 'lucide', 'font-awesome', 'local', or a custom base URL / template URL.
   */
  @Prop() lib: string = 'lucide';

  /**
   * The size of the icon. Can be a preset alias ('sm', 'md', 'lg'), a number (pixels), or any valid CSS size string (e.g., '1.5rem').
   */
  @Prop() size: string = 'md';

  /**
   * The color of the icon. Defaults to 'currentColor'.
   */
  @Prop() color: string = 'currentColor';

  /**
   * The default path for local assets when `lib` is set to 'local'.
   */
  @Prop() localPath: string = '/assets/icons/';

  @State() svgContent: string = '';
  @State() isBinary: boolean = false;
  @State() resolvedUrl: string = '';
  @State() hasError: boolean = false;

  private fetchId = 0;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('name')
  @Watch('lib')
  @Watch('localPath')
  watchHandler() {
    this.loadIcon();
  }

  async componentWillLoad() {
    await this.loadIcon();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private getSizeStyle(): string {
    const s = this.size ? String(this.size).trim() : 'md';
    if (s === 'sm') {
      return '16px';
    }
    if (s === 'md') {
      return '24px';
    }
    if (s === 'lg') {
      return '32px';
    }
    if (/^\d+$/.test(s)) {
      return `${s}px`;
    }
    return s;
  }

  private async loadIcon() {
    const currentFetchId = ++this.fetchId;
    this.hasError = false;

    if (!this.name) {
      this.svgContent = '';
      this.resolvedUrl = '';
      this.isBinary = false;
      return;
    }

    // Resolve URL
    let url = '';
    const cleanName = this.name.trim();

    if (this.lib === 'lucide') {
      url = `https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/${cleanName}.svg`;
    } else if (this.lib === 'font-awesome' || this.lib === 'fontawesome') {
      url = `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@latest/svgs/solid/${cleanName}.svg`;
    } else if (this.lib === 'local') {
      let path = this.localPath || '/assets/icons/';
      if (!path.endsWith('/')) {
        path += '/';
      }
      url = `${path}${cleanName}`;
      if (!cleanName.includes('.')) {
        url += '.svg';
      }
    } else {
      // Support custom URL templates, e.g., 'https://mycdn.com/icons/{name}.svg'
      if (this.lib.includes('{name}')) {
        url = this.lib.replace('{name}', cleanName);
      } else {
        let basePath = this.lib;
        if (!basePath.endsWith('/')) {
          basePath += '/';
        }
        url = `${basePath}${cleanName}`;
      }
    }

    // Detect if url is binary format (e.g. .png, .jpg, .jpeg, .webp, .gif, .ico)
    const urlLower = url.toLowerCase();
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico'];
    const detectBinary = binaryExtensions.some(ext => urlLower.endsWith(ext));

    if (detectBinary) {
      if (this.fetchId === currentFetchId) {
        this.isBinary = true;
        this.resolvedUrl = url;
        this.svgContent = '';
      }
      return;
    }

    // Otherwise, fetch SVG inline
    if (this.fetchId === currentFetchId) {
      this.isBinary = false;
      this.resolvedUrl = '';
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load icon SVG from ${url} (status: ${response.status})`);
      }
      const text = await response.text();

      if (this.fetchId === currentFetchId) {
        this.svgContent = text;
      }
    } catch (error) {
      console.error(error);
      if (this.fetchId === currentFetchId) {
        this.hasError = true;
        this.svgContent = '';
      }
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const sizeStyle = this.getSizeStyle();
    const hostStyle = {
      width: sizeStyle,
      height: sizeStyle,
      color: this.color,
    };

    if (this.hasError) {
      return (
        <Host style={hostStyle} class="q-icon-error">
          <div class="icon-fallback">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
        </Host>
      );
    }

    if (this.isBinary) {
      return (
        <Host style={hostStyle} class="q-icon-binary">
          <img
            src={this.resolvedUrl}
            alt={this.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            onError={() => {
              this.hasError = true;
            }}
          />
        </Host>
      );
    }

    return (
      <Host style={hostStyle} class="q-icon-svg">
        <div class="svg-container" innerHTML={this.svgContent} />
      </Host>
    );
  }
}
