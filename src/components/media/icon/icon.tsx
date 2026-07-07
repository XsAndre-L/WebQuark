import { Component, Prop, State, Watch, h, Host } from '@stencil/core';
import type { QIconColor, QIconLibrary, QIconLocalPath, QIconName, QIconSize } from './icon.types';

const LUCIDE_STATIC_VERSION = '0.400.0';
const FONTAWESOME_FREE_VERSION = '6.7.2';
const DEFAULT_FETCH_TIMEOUT_MS = 8000;
const BLOCKED_SVG_ELEMENTS = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'link', 'meta']);
const BLOCKED_SVG_TAG_PATTERN = /<\s*(script|foreignObject|iframe|object|embed|link|meta)\b[\s\S]*?(?:<\/\s*\1\s*>|\/\s*>)/gi;
const EVENT_HANDLER_ATTR_PATTERN = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const BLOCKED_ATTR_PATTERN = /\s+(style|tabindex)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const HREF_ATTR_PATTERN = /\s+(xlink:href|href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_ATTR_VALUE_PATTERN = /\s+[a-z_:.-]+\s*=\s*("[^"]*javascript:[^"]*"|'[^']*javascript:[^']*'|[^\s>]*javascript:[^\s>]*)/gi;

@Component({
  tag: 'q-icon',
  styleUrl: 'icon.css',
  shadow: true,
})
export class QIcon {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /**
   * The name of the icon (e.g., 'settings', 'heart', or a filename like 'logo.png').
   */
  @Prop() name?: QIconName;

  /**
   * The library to load the icon from.
   * Options: 'lucide', 'font-awesome', 'local', or a custom base URL / template URL.
   */
  @Prop() lib: QIconLibrary = 'lucide';

  /**
   * The size of the icon. Can be a preset alias ('sm', 'md', 'lg'), a number (pixels), or any valid CSS size string (e.g., '1.5rem').
   */
  @Prop() size: QIconSize = 'md';

  /**
   * The color of the icon. Defaults to 'currentColor'.
   */
  @Prop() color: QIconColor = 'currentColor';

  /**
   * The default path for local assets when `lib` is set to 'local'.
   */
  @Prop() localPath: QIconLocalPath = '/assets/icons/';

  /**
   * Optional version override for built-in remote icon libraries.
   */
  @Prop() libVersion?: string;

  /**
   * Fetch timeout in milliseconds for SVG icon requests.
   */
  @Prop() fetchTimeout: number = DEFAULT_FETCH_TIMEOUT_MS;

  /**
   * Accessible name for meaningful icons. Icons without a label are hidden from assistive technology.
   */
  @Prop() label?: string;

  @State() svgContent: string = '';
  @State() isBinary: boolean = false;
  @State() resolvedUrl: string = '';
  @State() hasError: boolean = false;

  private fetchId = 0;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('name')
  @Watch('lib')
  @Watch('localPath')
  @Watch('libVersion')
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

  private get accessibleLabel(): string | undefined {
    const label = this.label?.trim();
    return label || undefined;
  }

  private getResolvedLibraryVersion(fallback: string): string {
    const version = this.libVersion?.trim();
    return version || fallback;
  }

  private isBinaryUrl(url: string): boolean {
    const urlLower = url.toLowerCase();
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico'];
    return binaryExtensions.some(ext => urlLower.endsWith(ext));
  }

  private sanitizeSvg(svgText: string): string {
    if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
      return this.sanitizeSvgString(svgText);
    }

    const parser = new DOMParser();
    const document = parser.parseFromString(svgText, 'image/svg+xml');
    const parserError = document.querySelector('parsererror');
    const svg = document.documentElement;

    if (parserError || !svg || svg.tagName.toLowerCase() !== 'svg') {
      return this.sanitizeSvgString(svgText);
    }

    const walk = (element: Element) => {
      const tagName = element.tagName.toLowerCase();
      if (BLOCKED_SVG_ELEMENTS.has(tagName)) {
        element.remove();
        return;
      }

      Array.from(element.attributes).forEach(attribute => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();

        if (
          name.startsWith('on') ||
          name === 'style' ||
          name === 'tabindex' ||
          value.startsWith('javascript:') ||
          value.includes('url(javascript:') ||
          ((name === 'href' || name === 'xlink:href') && tagName === 'use' && !value.startsWith('#'))
        ) {
          element.removeAttribute(attribute.name);
        }
      });

      Array.from(element.children).forEach(walk);
    };

    walk(svg);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    return new XMLSerializer().serializeToString(svg);
  }

  private sanitizeSvgString(svgText: string): string {
    if (!/<svg[\s>]/i.test(svgText)) {
      return '';
    }

    return svgText
      .replace(BLOCKED_SVG_TAG_PATTERN, '')
      .replace(EVENT_HANDLER_ATTR_PATTERN, '')
      .replace(BLOCKED_ATTR_PATTERN, '')
      .replace(JAVASCRIPT_ATTR_VALUE_PATTERN, '')
      .replace(HREF_ATTR_PATTERN, (match, _name, rawValue) => {
        const value = String(rawValue).replace(/^['"]|['"]$/g, '').trim().toLowerCase();
        return value.startsWith('#') ? match : '';
      })
      .replace(/<svg\b([^>]*)>/i, (_match, attributes) => {
        const cleanAttributes = String(attributes)
          .replace(/\s+aria-hidden\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
          .replace(/\s+focusable\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
        return `<svg${cleanAttributes} aria-hidden="true" focusable="false">`;
      })
      .trim();
  }

  private async fetchSvg(url: string): Promise<string> {
    const timeout = Number.isFinite(this.fetchTimeout) && this.fetchTimeout > 0 ? this.fetchTimeout : DEFAULT_FETCH_TIMEOUT_MS;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : undefined;

    try {
      const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
      if (!response.ok) {
        throw new Error(`Failed to load icon SVG from ${url} (status: ${response.status})`);
      }
      return await response.text();
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }

  private handleImageError = () => {
    this.hasError = true;
  };

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
      const version = this.getResolvedLibraryVersion(LUCIDE_STATIC_VERSION);
      url = `https://cdn.jsdelivr.net/npm/lucide-static@${version}/icons/${encodeURIComponent(cleanName)}.svg`;
    } else if (this.lib === 'font-awesome' || this.lib === 'fontawesome') {
      const version = this.getResolvedLibraryVersion(FONTAWESOME_FREE_VERSION);
      url = `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@${version}/svgs/solid/${encodeURIComponent(cleanName)}.svg`;
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

    if (this.isBinaryUrl(url)) {
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
      let finalUrl = url;
      if (typeof window !== 'undefined' && window.location && !/^https?:\/\//i.test(url) && !url.startsWith('data:')) {
        try {
          const base = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'http://localhost';
          finalUrl = new URL(url, base).href;
        } catch (_) {
          // ignore
        }
      }
      const text = await this.fetchSvg(finalUrl);
      const sanitizedSvg = this.sanitizeSvg(text);

      if (!sanitizedSvg) {
        throw new Error(`Failed to sanitize icon SVG from ${finalUrl}`);
      }

      if (this.fetchId === currentFetchId) {
        this.svgContent = sanitizedSvg;
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
    const accessibleLabel = this.accessibleLabel;
    const hostStyle = {
      width: sizeStyle,
      height: sizeStyle,
      color: this.color,
    };

    if (this.hasError) {
      return (
        <Host
          style={hostStyle}
          class="q-icon-error"
          role={accessibleLabel ? 'img' : undefined}
          aria-label={accessibleLabel}
          aria-hidden={accessibleLabel ? 'false' : 'true'}
        >
          <div class="icon-fallback" part="fallback">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
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
        <Host
          style={hostStyle}
          class="q-icon-binary"
          role={accessibleLabel ? 'img' : undefined}
          aria-label={accessibleLabel}
          aria-hidden={accessibleLabel ? 'false' : 'true'}
        >
          <img
            src={this.resolvedUrl}
            alt=""
            aria-hidden="true"
            part="image"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            onError={this.handleImageError}
          />
        </Host>
      );
    }

    return (
      <Host
        style={hostStyle}
        class="q-icon-svg"
        role={accessibleLabel ? 'img' : undefined}
        aria-label={accessibleLabel}
        aria-hidden={accessibleLabel ? 'false' : 'true'}
      >
        <div class="svg-container" part="svg" innerHTML={this.svgContent} />
      </Host>
    );
  }
}
