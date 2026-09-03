import { Component, Element, Prop, State, Watch, h } from '@stencil/core';
import type { QIconColor, QIconDefinition, QIconLibrary, QIconLocalPath, QIconName, QIconSize } from './icon.types';
import { DEFAULT_FETCH_TIMEOUT_MS } from './internals/constants';
import { fetchIconSvg } from './internals/fetch-icon';
import { isQIconStrictMode, prepareQIconDefinition, resolveRegisteredQIcon } from './internals/registry';
import { renderQIconDefinition } from './internals/render-definition';
import { sanitizeIconSvg } from './internals/sanitize-svg';
import { getIconSizeStyle } from './internals/size';
import { isBinaryIconUrl, resolveFetchableIconUrl, resolveIconUrl } from './internals/url';

/**
 * Synchronous registered icon renderer with optional backwards-compatible URL loading.
 * @part svg - Container for registered or sanitized inline SVG content.
 * @part image - Native image used for binary icon assets.
 * @part fallback - Error fallback shown when an icon cannot load.
 */
@Component({
  tag: 'q-icon',
  styleUrl: 'icon.css',
  shadow: true,
})
export class QIcon {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  /** Icon name or local asset filename. */
  @Prop() name?: QIconName;
  /** Trusted compile-time icon data. Takes precedence over `name` and never performs I/O. */
  @Prop() definition?: QIconDefinition;
  /** Supports built-in libraries, local assets, and custom URL templates. */
  @Prop() lib: QIconLibrary = 'lucide';
  /** Base path used when `lib="local"`. */
  @Prop() localPath: QIconLocalPath = '/assets/icons/';
  /** Overrides the version of built-in remote libraries. */
  @Prop() libVersion?: string;
  /** SVG fetch timeout in milliseconds. */
  @Prop() fetchTimeout: number = DEFAULT_FETCH_TIMEOUT_MS;

  /** Accepts a preset, pixel number, or CSS size. */
  @Prop() size: QIconSize = 'md';
  @Prop() color: QIconColor = 'currentColor';

  /** Meaningful icons require a label; unlabeled icons are hidden from assistive technology. */
  @Prop() label?: string;

  @State() svgContent: string = '';
  @State() isBinary: boolean = false;
  @State() resolvedUrl: string = '';
  @State() hasError: boolean = false;
  @State() resolvedDefinition?: QIconDefinition;

  private fetchId = 0;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('name')
  @Watch('definition')
  @Watch('lib')
  @Watch('localPath')
  @Watch('libVersion')
  watchHandler() {
    void this.loadIcon();
  }

  componentWillLoad() {
    // Registered data resolves immediately. Backwards-compatible icon I/O must
    // not hold up this component or any parent component's hydration.
    void this.loadIcon();
  }

  componentWillRender() {
    this.syncHostState();
  }

  componentDidRender() {
    this.syncHostState();
  }

  componentDidLoad() {
    this.syncHostState();
  }

  componentDidUpdate() {
    this.syncHostState();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private get accessibleLabel(): string | undefined {
    const label = this.label?.trim();
    return label || undefined;
  }

  private handleImageError = () => {
    this.hasError = true;
    this.syncHostState();
  };

  private syncHostState() {
    if (!this.el) return;

    const sizeStyle = getIconSizeStyle(this.size);
    const accessibleLabel = this.accessibleLabel;

    this.el.style.width = sizeStyle;
    this.el.style.height = sizeStyle;
    this.el.style.color = this.color;
    this.el.classList.toggle('q-icon-error', this.hasError);
    this.el.classList.toggle('q-icon-binary', !this.hasError && this.isBinary);
    this.el.classList.toggle('q-icon-svg', !this.hasError && !this.isBinary);

    if (accessibleLabel) {
      this.el.setAttribute('role', 'img');
      this.el.setAttribute('aria-label', accessibleLabel);
      this.el.setAttribute('aria-hidden', 'false');
    } else {
      this.el.removeAttribute('role');
      this.el.removeAttribute('aria-label');
      this.el.setAttribute('aria-hidden', 'true');
    }
  }

  private async loadIcon() {
    const currentFetchId = ++this.fetchId;
    this.hasError = false;
    this.resolvedDefinition = undefined;
    this.syncHostState();

    const definition = this.definition ?? resolveRegisteredQIcon(this.name);
    if (definition) {
      try {
        this.resolvedDefinition = this.definition
          ? prepareQIconDefinition(definition, 'q-icon definition')
          : definition;
        this.svgContent = '';
        this.resolvedUrl = '';
        this.isBinary = false;
      } catch (error) {
        console.error(error);
        this.hasError = true;
      }
      this.syncHostState();
      return;
    }

    if (!this.name) {
      this.svgContent = '';
      this.resolvedUrl = '';
      this.isBinary = false;
      this.syncHostState();
      return;
    }

    if (isQIconStrictMode()) {
      this.svgContent = '';
      this.resolvedUrl = '';
      this.isBinary = false;
      this.hasError = true;
      this.syncHostState();
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
        this.syncHostState();
      }
      return;
    }

    // Otherwise, fetch SVG inline
    if (this.fetchId === currentFetchId) {
      this.isBinary = false;
      this.resolvedUrl = '';
      this.syncHostState();
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
        this.syncHostState();
      }
    } catch (error) {
      console.error(error);
      if (this.fetchId === currentFetchId) {
        this.hasError = true;
        this.svgContent = '';
        this.syncHostState();
      }
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    if (this.hasError) {
      return (
        <div class="icon-fallback" part="fallback">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </div>
      );
    }

    if (this.resolvedDefinition) {
      return (
        <div class="svg-container" part="svg">
          {renderQIconDefinition(this.resolvedDefinition)}
        </div>
      );
    }

    if (this.isBinary) {
      return (
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
      );
    }

    return <div class="svg-container" part="svg" innerHTML={this.svgContent} />;
  }
}
