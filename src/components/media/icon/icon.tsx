import { Component, Prop, State, Watch, h, Host } from '@stencil/core';
import type { QIconColor, QIconLibrary, QIconLocalPath, QIconName, QIconSize } from './icon.types';
import { DEFAULT_FETCH_TIMEOUT_MS } from './internals/constants';
import { fetchIconSvg } from './internals/fetch-icon';
import { sanitizeIconSvg } from './internals/sanitize-svg';
import { getIconSizeStyle } from './internals/size';
import { isBinaryIconUrl, resolveFetchableIconUrl, resolveIconUrl } from './internals/url';

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

  private get accessibleLabel(): string | undefined {
    const label = this.label?.trim();
    return label || undefined;
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

    const url = resolveIconUrl({
      name: this.name,
      library: this.lib,
      localPath: this.localPath,
      libraryVersion: this.libVersion,
    });

    if (isBinaryIconUrl(url)) {
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
      const finalUrl = resolveFetchableIconUrl(url);
      const text = await fetchIconSvg(finalUrl, this.fetchTimeout);
      const sanitizedSvg = sanitizeIconSvg(text);

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
    const sizeStyle = getIconSizeStyle(this.size);
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
