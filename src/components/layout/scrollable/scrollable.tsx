import { Component, Prop, Element, Event, EventEmitter, State, Watch, Method, Host, h } from '@stencil/core';

import type { QScrollableEventDetail, QScrollableMode } from './scrollable.types';

let scrollableIds = 0;

/**
 * Scroll container with custom or native scrollbar styling.
 *
 * @slot - Content rendered inside the scrollable viewport.
 * @part viewport - Scrollable viewport element.
 * @part content - Content wrapper inside the viewport.
 * @part track - Custom scrollbar track.
 * @part thumb - Custom scrollbar thumb.
 */
@Component({
  tag: 'q-scrollable',
  styleUrl: 'scrollable.css',
  shadow: true,
})
export class QScrollable {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  /** CSS height applied to the scrollable host. */
  @Prop({ reflect: true }) height: string = '100%';

  /** Optional max-height applied to the scrollable host. */
  @Prop({ reflect: true }) maxHeight: string = '';

  /** Hides the custom scrollbar until hover, scroll, or drag activity. */
  @Prop({ reflect: true }) autoHide: boolean = true;

  /** Uses native scrollbars on coarse pointer devices when true. */
  @Prop({ reflect: true }) nativeOnMobile: boolean = true;

  /** Scrollbar rendering mode. Custom renders WebQuark's own thumb; native styles browser scrollbars. */
  @Prop({ reflect: true }) mode: QScrollableMode = 'custom';

  /** CSS selector for an external native-scroll target resolved from this component's root node. */
  @Prop({ reflect: true }) target: string = '';

  /** Emitted when the viewport scrolls. */
  @Event() qScroll!: EventEmitter<QScrollableEventDetail>;

  @State() isScrolling: boolean = false;
  @State() isDragging: boolean = false;
  @State() scrollValueNow: number = 0;
  @State() scrollValueMax: number = 0;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private static readonly MIN_THUMB_HEIGHT_PX = 36;
  private static readonly KEY_SCROLL_STEP_PX = 40;

  private readonly viewportId = `q-scrollable-viewport-${++scrollableIds}`;
  private viewportEl?: HTMLDivElement;
  private contentEl?: HTMLDivElement;
  private trackEl?: HTMLDivElement;
  private thumbEl?: HTMLDivElement;

  private resizeObserver?: ResizeObserver;
  private scrollTimeout?: ReturnType<typeof setTimeout>;
  private isUpdatingPosition = false;

  private dragStartY: number = 0;
  private dragStartScrollTop: number = 0;

  private nativeStyleEl?: HTMLStyleElement;
  private activeTargetEl?: Element;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentDidLoad() {
    this.applyNativeStyles();
    this.setupCustomScroll();
  }

  componentDidUpdate() {
    if (this.mode === 'custom') {
      this.updateScrollbarSize();
    }
  }

  disconnectedCallback() {
    this.removeNativeStyles();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    if (this.thumbEl) {
      this.thumbEl.removeEventListener('pointermove', this.handlePointerMove);
      this.thumbEl.removeEventListener('pointerup', this.handlePointerUp);
      this.thumbEl.removeEventListener('pointercancel', this.handlePointerUp);
    }
  }

  @Watch('mode')
  @Watch('target')
  handleModeOrTargetChange() {
    if (this.mode === 'native') {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = undefined;
      }
      this.applyNativeStyles();
    } else {
      this.removeNativeStyles();
      this.setupCustomScroll();
    }
  }

  // ============================ [4] EXPOSED METHODS ============================

  /** Moves the viewport to its maximum vertical scroll position. */
  @Method()
  async scrollToBottom() {
    if (this.viewportEl) {
      this.setViewportScrollTop(this.viewportEl.scrollHeight);
    }
  }

  /** Moves the viewport to a specific vertical scroll position. */
  @Method()
  async scrollToPosition(top: number) {
    if (this.viewportEl) {
      this.setViewportScrollTop(top);
    }
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private setViewportRef = (el: HTMLDivElement | null) => {
    this.viewportEl = this.syncResizeObserver(this.viewportEl, el);
  };

  private setContentRef = (el: HTMLDivElement | null) => {
    this.contentEl = this.syncResizeObserver(this.contentEl, el);
  };

  private syncResizeObserver(previousEl: Element | undefined, nextEl: HTMLDivElement | null): HTMLDivElement | undefined {
    if (previousEl && this.resizeObserver) {
      try {
        this.resizeObserver.unobserve(previousEl);
      } catch (e) {
        // Ignore
      }
    }

    const resolvedEl = nextEl || undefined;

    if (this.mode === 'custom' && resolvedEl && typeof ResizeObserver !== 'undefined') {
      this.ensureResizeObserver();
      this.resizeObserver?.observe(resolvedEl);
    }

    if (this.mode === 'custom') {
      this.updateScrollbarSize();
    }

    return resolvedEl;
  }

  private ensureResizeObserver() {
    if (this.resizeObserver || typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => {
      this.updateScrollbarSize();
    });
  }

  private setupCustomScroll() {
    if (this.mode !== 'custom') {
      return;
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.ensureResizeObserver();
      if (this.viewportEl) {
        this.resizeObserver?.observe(this.viewportEl);
      }
      if (this.contentEl) {
        this.resizeObserver?.observe(this.contentEl);
      }
    }

    this.updateScrollbarSize();
  }

  private applyNativeStyles() {
    this.removeNativeStyles();

    if (this.mode !== 'native') {
      return;
    }

    const targetEl = this.resolveNativeTarget();
    if (!targetEl) {
      return;
    }

    this.activeTargetEl = targetEl;

    let targetId = targetEl.getAttribute('data-q-scrollable-target-id');
    if (!targetId) {
      targetId = `q-scroll-${Math.random().toString(36).slice(2, 11)}`;
      targetEl.setAttribute('data-q-scrollable-target-id', targetId);
    }

    const styleEl = document.createElement('style');
    styleEl.id = `q-style-${targetId}`;
    styleEl.textContent = `
      [data-q-scrollable-target-id="${targetId}"]::-webkit-scrollbar {
        width: var(--q-scrollbar-width, 6px);
        height: var(--q-scrollbar-width, 6px);
      }
      [data-q-scrollable-target-id="${targetId}"]::-webkit-scrollbar-track {
        background: var(--q-scrollbar-track-color, transparent);
      }
      [data-q-scrollable-target-id="${targetId}"]::-webkit-scrollbar-thumb {
        background: var(--q-scrollbar-thumb-color, var(--q-border-color, #374151));
        border-radius: var(--q-scrollbar-radius, 4px);
      }
      [data-q-scrollable-target-id="${targetId}"]::-webkit-scrollbar-thumb:hover {
        background: var(--q-scrollbar-thumb-color-hover, var(--q-color-primary, #60a5fa));
      }
      [data-q-scrollable-target-id="${targetId}"] {
        scrollbar-width: var(--q-scrollbar-width-thin, thin);
        scrollbar-color: var(--q-scrollbar-thumb-color, var(--q-border-color, #374151)) var(--q-scrollbar-track-color, transparent);
      }
    `;

    targetEl.appendChild(styleEl);
    this.nativeStyleEl = styleEl;
  }

  private resolveNativeTarget(): Element | null {
    if (!this.target) {
      return this.el.parentElement;
    }

    const root = this.el.getRootNode() as Document | ShadowRoot;
    return root.querySelector(this.target);
  }

  private removeNativeStyles() {
    if (this.nativeStyleEl && this.nativeStyleEl.parentNode) {
      this.nativeStyleEl.parentNode.removeChild(this.nativeStyleEl);
    }
    this.nativeStyleEl = undefined;

    if (this.activeTargetEl) {
      this.activeTargetEl.removeAttribute('data-q-scrollable-target-id');
      this.activeTargetEl = undefined;
    }
  }

  private updateScrollbarSize() {
    if (this.mode !== 'custom' || !this.viewportEl || !this.trackEl || !this.thumbEl) {
      return;
    }

    const clientHeight = this.viewportEl.clientHeight;
    const scrollHeight = this.viewportEl.scrollHeight;

    if (scrollHeight <= clientHeight) {
      this.thumbEl.style.height = '0px';
      this.trackEl.style.display = 'none';
      this.updateScrollMetrics();
      return;
    }

    this.trackEl.style.display = '';

    const calculatedHeight = (clientHeight * clientHeight) / scrollHeight;
    const thumbHeight = Math.max(QScrollable.MIN_THUMB_HEIGHT_PX, calculatedHeight);

    this.thumbEl.style.height = `${thumbHeight}px`;

    this.updateThumbPosition();
  }

  private updateThumbPosition() {
    if (!this.viewportEl || !this.trackEl || !this.thumbEl) {
      return;
    }

    const scrollTop = this.viewportEl.scrollTop;
    const scrollHeight = this.viewportEl.scrollHeight;
    const clientHeight = this.viewportEl.clientHeight;

    const trackHeight = this.trackEl.clientHeight;
    const thumbHeight = this.thumbEl.clientHeight;

    const maxScrollTop = scrollHeight - clientHeight;
    if (maxScrollTop <= 0) {
      this.updateScrollMetrics();
      return;
    }

    const maxThumbTranslate = trackHeight - thumbHeight;
    const translateY = (scrollTop / maxScrollTop) * maxThumbTranslate;

    this.thumbEl.style.transform = `translateY(${translateY}px)`;
    this.updateScrollMetrics();
  }

  private updateScrollMetrics() {
    if (!this.viewportEl) {
      this.scrollValueNow = 0;
      this.scrollValueMax = 0;
      return;
    }

    this.scrollValueNow = Math.round(this.viewportEl.scrollTop);
    this.scrollValueMax = Math.max(0, Math.round(this.viewportEl.scrollHeight - this.viewportEl.clientHeight));
  }

  private handleScroll = () => {
    if (this.viewportEl) {
      this.qScroll.emit({
        scrollTop: this.viewportEl.scrollTop,
        scrollHeight: this.viewportEl.scrollHeight,
        clientHeight: this.viewportEl.clientHeight,
      });
    }

    this.updateScrollMetrics();

    if (this.mode !== 'custom') {
      return;
    }

    this.showScrollbarTemporarily();

    if (!this.isUpdatingPosition) {
      this.isUpdatingPosition = true;
      requestAnimationFrame(() => {
        this.updateThumbPosition();
        this.isUpdatingPosition = false;
      });
    }
  };

  private showScrollbarTemporarily() {
    if (!this.autoHide) {
      return;
    }

    this.isScrolling = true;

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 1500);
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) {
      return;
    }
    if (!this.thumbEl || !this.viewportEl || !this.trackEl) {
      return;
    }

    this.isDragging = true;
    this.dragStartY = e.clientY;
    this.dragStartScrollTop = this.viewportEl.scrollTop;

    this.thumbEl.setPointerCapture(e.pointerId);
    this.thumbEl.addEventListener('pointermove', this.handlePointerMove);
    this.thumbEl.addEventListener('pointerup', this.handlePointerUp);
    this.thumbEl.addEventListener('pointercancel', this.handlePointerUp);

    e.preventDefault();
    e.stopPropagation();
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isDragging || !this.viewportEl || !this.trackEl || !this.thumbEl) {
      return;
    }

    const deltaY = e.clientY - this.dragStartY;
    const clientHeight = this.viewportEl.clientHeight;
    const scrollHeight = this.viewportEl.scrollHeight;
    const trackHeight = this.trackEl.clientHeight;
    const thumbHeight = this.thumbEl.clientHeight;

    const maxScrollTop = scrollHeight - clientHeight;
    const maxThumbTranslate = trackHeight - thumbHeight;

    if (maxThumbTranslate <= 0) {
      return;
    }

    const startTranslateY = (this.dragStartScrollTop / maxScrollTop) * maxThumbTranslate;
    const newTranslateY = Math.max(0, Math.min(maxThumbTranslate, startTranslateY + deltaY));

    const newScrollTop = (newTranslateY / maxThumbTranslate) * maxScrollTop;

    this.setViewportScrollTop(newScrollTop);

    this.updateThumbPosition();
  };

  private handleThumbKeyDown = (e: KeyboardEvent) => {
    if (!this.viewportEl) return;

    const maxScrollTop = Math.max(0, this.viewportEl.scrollHeight - this.viewportEl.clientHeight);
    const pageStep = Math.max(QScrollable.KEY_SCROLL_STEP_PX, this.viewportEl.clientHeight - QScrollable.KEY_SCROLL_STEP_PX);
    let nextScrollTop = this.viewportEl.scrollTop;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextScrollTop += QScrollable.KEY_SCROLL_STEP_PX;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextScrollTop -= QScrollable.KEY_SCROLL_STEP_PX;
        break;
      case 'PageDown':
        nextScrollTop += pageStep;
        break;
      case 'PageUp':
        nextScrollTop -= pageStep;
        break;
      case 'Home':
        nextScrollTop = 0;
        break;
      case 'End':
        nextScrollTop = maxScrollTop;
        break;
      default:
        return;
    }

    e.preventDefault();
    this.setViewportScrollTop(nextScrollTop);
    this.updateThumbPosition();
  };

  private setViewportScrollTop(scrollTop: number) {
    if (!this.viewportEl) return;

    const maxScrollTop = Math.max(0, this.viewportEl.scrollHeight - this.viewportEl.clientHeight);
    const nextScrollTop = Math.max(0, Math.min(maxScrollTop, scrollTop));

    this.viewportEl.style.scrollBehavior = 'auto';
    this.viewportEl.scrollTop = nextScrollTop;
    this.viewportEl.style.scrollBehavior = '';
    this.updateScrollMetrics();
  }

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    if (this.thumbEl) {
      try {
        this.thumbEl.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore
      }
      this.thumbEl.removeEventListener('pointermove', this.handlePointerMove);
      this.thumbEl.removeEventListener('pointerup', this.handlePointerUp);
      this.thumbEl.removeEventListener('pointercancel', this.handlePointerUp);
    }
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const hostStyle = {
      height: this.height,
      maxHeight: this.maxHeight || undefined,
    };

    return (
      <Host
        class={{
          'is-scrolling': this.isScrolling,
          'is-dragging': this.isDragging,
        }}
        style={hostStyle}
      >
        <div class="q-scrollable-host">
          <div
            id={this.viewportId}
            class="q-scrollable-viewport"
            ref={this.setViewportRef}
            onScroll={this.handleScroll}
            tabindex={0}
            part="viewport"
          >
            <div class="q-scrollable-content" ref={this.setContentRef} part="content">
              <slot></slot>
            </div>
          </div>

          {this.mode === 'custom' && (
            <div
              class={{
                'q-scrollbar-track': true,
                'is-dragging': this.isDragging,
              }}
              ref={(el) => (this.trackEl = el as HTMLDivElement)}
              part="track"
            >
              <div
                class="q-scrollbar-thumb"
                ref={(el) => (this.thumbEl = el as HTMLDivElement)}
                onPointerDown={this.handlePointerDown}
                onKeyDown={this.handleThumbKeyDown}
                role="scrollbar"
                aria-controls={this.viewportId}
                aria-orientation="vertical"
                aria-valuemin="0"
                aria-valuemax={this.scrollValueMax}
                aria-valuenow={this.scrollValueNow}
                aria-label="Scroll content"
                tabindex={0}
                part="thumb"
              ></div>
            </div>
          )}
        </div>
      </Host>
    );
  }
}
