import { Component, Prop, Element, Event, EventEmitter, State, Watch, Method, Host, h } from '@stencil/core';

import type { QScrollableEventDetail, QScrollableMode } from './scrollable.types';
import { clampScrollTop, getKeyboardScrollTarget, getScrollMetrics, getThumbLayout } from './internals/metrics';
import { buildNativeScrollbarStyle, ensureNativeScrollTargetId, removeNativeScrollTargetId, resolveNativeScrollTarget } from './internals/native-scrollbar';

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

  @Prop({ reflect: true }) height: string = '100%';
  @Prop({ reflect: true }) maxHeight: string = '';

  /** `custom` renders a WebQuark thumb; `native` styles browser scrollbars. */
  @Prop({ reflect: true }) mode: QScrollableMode = 'custom';
  /** CSS selector for an external native-scroll target resolved from this component's root node. */
  @Prop({ reflect: true }) target: string = '';
  /** Uses native scrollbars on coarse-pointer devices. */
  @Prop({ reflect: true }) nativeOnMobile: boolean = true;
  /** Hides the custom scrollbar until hover, scroll, or drag activity. */
  @Prop({ reflect: true }) autoHide: boolean = true;

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

  @Method()
  async scrollToBottom() {
    if (this.viewportEl) {
      this.setViewportScrollTop(this.viewportEl.scrollHeight);
    }
  }

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

    const targetEl = resolveNativeScrollTarget(this.el, this.target);
    if (!targetEl) {
      return;
    }

    this.activeTargetEl = targetEl;

    const targetId = ensureNativeScrollTargetId(targetEl);

    const styleEl = document.createElement('style');
    styleEl.id = `q-style-${targetId}`;
    styleEl.textContent = buildNativeScrollbarStyle(targetId);

    targetEl.appendChild(styleEl);
    this.nativeStyleEl = styleEl;
  }

  private removeNativeStyles() {
    if (this.nativeStyleEl && this.nativeStyleEl.parentNode) {
      this.nativeStyleEl.parentNode.removeChild(this.nativeStyleEl);
    }
    this.nativeStyleEl = undefined;

    if (this.activeTargetEl) {
      removeNativeScrollTargetId(this.activeTargetEl);
      this.activeTargetEl = undefined;
    }
  }

  private updateScrollbarSize() {
    if (this.mode !== 'custom' || !this.viewportEl || !this.trackEl || !this.thumbEl) {
      return;
    }

    const metrics = getScrollMetrics(this.viewportEl);
    const layout = getThumbLayout({
      metrics,
      trackHeight: this.trackEl.clientHeight,
      thumbHeight: this.thumbEl.clientHeight,
      minThumbHeight: QScrollable.MIN_THUMB_HEIGHT_PX,
    });

    if (!layout.isScrollable) {
      this.thumbEl.style.height = '0px';
      this.trackEl.style.display = 'none';
      this.updateScrollMetrics();
      return;
    }

    this.trackEl.style.display = '';
    this.thumbEl.style.height = `${layout.height}px`;
    this.updateThumbPosition();
  }

  private updateThumbPosition() {
    if (!this.viewportEl || !this.trackEl || !this.thumbEl) {
      return;
    }

    const metrics = getScrollMetrics(this.viewportEl);
    const layout = getThumbLayout({
      metrics,
      trackHeight: this.trackEl.clientHeight,
      thumbHeight: this.thumbEl.clientHeight,
      minThumbHeight: QScrollable.MIN_THUMB_HEIGHT_PX,
    });

    if (!layout.isScrollable) {
      this.updateScrollMetrics();
      return;
    }

    this.thumbEl.style.transform = `translateY(${layout.translateY}px)`;
    this.updateScrollMetrics();
  }

  private updateScrollMetrics() {
    const metrics = getScrollMetrics(this.viewportEl);
    this.scrollValueNow = Math.round(metrics.scrollTop);
    this.scrollValueMax = Math.round(metrics.maxScrollTop);
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

    const metrics = getScrollMetrics(this.viewportEl);
    const deltaY = e.clientY - this.dragStartY;
    const maxThumbTranslate = this.trackEl.clientHeight - this.thumbEl.clientHeight;

    if (maxThumbTranslate <= 0 || metrics.maxScrollTop <= 0) {
      return;
    }

    const startTranslateY = (this.dragStartScrollTop / metrics.maxScrollTop) * maxThumbTranslate;
    const newTranslateY = Math.max(0, Math.min(maxThumbTranslate, startTranslateY + deltaY));

    const newScrollTop = (newTranslateY / maxThumbTranslate) * metrics.maxScrollTop;

    this.setViewportScrollTop(newScrollTop);

    this.updateThumbPosition();
  };

  private handleThumbKeyDown = (e: KeyboardEvent) => {
    if (!this.viewportEl) return;

    const metrics = getScrollMetrics(this.viewportEl);
    const nextScrollTop = getKeyboardScrollTarget({
      key: e.key,
      scrollTop: metrics.scrollTop,
      clientHeight: metrics.clientHeight,
      maxScrollTop: metrics.maxScrollTop,
      step: QScrollable.KEY_SCROLL_STEP_PX,
    });

    if (nextScrollTop === undefined) return;

    e.preventDefault();
    this.setViewportScrollTop(nextScrollTop);
    this.updateThumbPosition();
  };

  private setViewportScrollTop(scrollTop: number) {
    if (!this.viewportEl) return;

    const nextScrollTop = clampScrollTop(scrollTop, getScrollMetrics(this.viewportEl));

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
