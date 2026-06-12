import { Component, Prop, Element, Event, EventEmitter, State, Watch, Method, Host, h } from '@stencil/core';

@Component({
  tag: 'q-scrollable',
  styleUrl: 'q-scrollable.css',
  shadow: true,
})
export class QScrollable {
  @Element() el!: HTMLElement;

  @Prop({ reflect: true }) height: string = '100%';
  @Prop({ reflect: true }) maxHeight: string = '';
  @Prop({ reflect: true }) autoHide: boolean = true;
  @Prop({ reflect: true }) nativeOnMobile: boolean = true;
  @Prop({ reflect: true }) mode: 'custom' | 'native' = 'custom';
  @Prop({ reflect: true }) target: string = '';

  @Event() qScroll!: EventEmitter<{ scrollTop: number; scrollHeight: number; clientHeight: number }>;

  @State() isScrolling: boolean = false;
  @State() isDragging: boolean = false;

  private viewportEl?: HTMLDivElement;
  private contentEl?: HTMLDivElement;
  private trackEl?: HTMLDivElement;
  private thumbEl?: HTMLDivElement;

  private resizeObserver?: ResizeObserver;
  private scrollTimeout?: any;
  private isUpdatingPosition = false;

  private dragStartY: number = 0;
  private dragStartScrollTop: number = 0;

  private nativeStyleEl?: HTMLStyleElement;
  private activeTargetEl?: Element;

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

  @Method()
  async scrollToBottom() {
    if (this.viewportEl) {
      this.viewportEl.scrollTop = this.viewportEl.scrollHeight;
    }
  }

  @Method()
  async scrollToPosition(top: number) {
    if (this.viewportEl) {
      this.viewportEl.scrollTop = top;
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

  private setupCustomScroll() {
    if (this.mode !== 'custom') {
      return;
    }

    if (typeof ResizeObserver !== 'undefined' && this.viewportEl) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateScrollbarSize();
      });
      this.resizeObserver.observe(this.viewportEl);

      if (this.contentEl) {
        this.resizeObserver.observe(this.contentEl);
      }
    }

    this.updateScrollbarSize();
  }

  private applyNativeStyles() {
    this.removeNativeStyles();

    if (this.mode !== 'native') {
      return;
    }

    const targetEl = this.target ? document.querySelector(this.target) : this.el.parentElement;
    if (!targetEl) {
      return;
    }

    this.activeTargetEl = targetEl;

    let targetId = targetEl.getAttribute('data-q-scrollable-target-id');
    if (!targetId) {
      targetId = `q-scroll-${Math.random().toString(36).substr(2, 9)}`;
      targetEl.setAttribute('data-q-scrollable-target-id', targetId);
    }

    const styleEl = document.createElement('style');
    styleEl.id = `q-style-${targetId}`;
    styleEl.textContent = `
      [data-q-scrollable-target-id="${targetId}"]::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      [data-q-scrollable-target-id="${targetId}"]::-webkit-scrollbar-track {
        background: transparent;
      }
      [data-q-scrollable-target-id="${targetId}"]::-webkit-scrollbar-thumb {
        background: var(--q-bg-surface-3, #4b5563);
        border-radius: 4px;
      }
      [data-q-scrollable-target-id="${targetId}"]::-webkit-scrollbar-thumb:hover {
        background: var(--q-color-primary, #3b82f6);
      }
      [data-q-scrollable-target-id="${targetId}"] {
        scrollbar-width: thin;
        scrollbar-color: var(--q-bg-surface-3, #4b5563) transparent;
      }
    `;

    targetEl.appendChild(styleEl);
    this.nativeStyleEl = styleEl;
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
      return;
    }

    this.trackEl.style.display = '';

    const calculatedHeight = (clientHeight * clientHeight) / scrollHeight;
    const thumbHeight = Math.max(36, calculatedHeight);

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
      return;
    }

    const maxThumbTranslate = trackHeight - thumbHeight;
    const translateY = (scrollTop / maxScrollTop) * maxThumbTranslate;

    this.thumbEl.style.transform = `translateY(${translateY}px)`;
  }

  private handleScroll = () => {
    if (this.viewportEl) {
      this.qScroll.emit({
        scrollTop: this.viewportEl.scrollTop,
        scrollHeight: this.viewportEl.scrollHeight,
        clientHeight: this.viewportEl.clientHeight,
      });
    }

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

    this.viewportEl.style.scrollBehavior = 'auto';
    this.viewportEl.scrollTop = newScrollTop;
    this.viewportEl.style.scrollBehavior = '';

    this.updateThumbPosition();
  };

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
            class="q-scrollable-viewport"
            ref={(el) => (this.viewportEl = el as HTMLDivElement)}
            onScroll={this.handleScroll}
          >
            <div class="q-scrollable-content" ref={(el) => (this.contentEl = el as HTMLDivElement)}>
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
            >
              <div
                class="q-scrollbar-thumb"
                ref={(el) => (this.thumbEl = el as HTMLDivElement)}
                onPointerDown={this.handlePointerDown}
              ></div>
            </div>
          )}
        </div>
      </Host>
    );
  }
}
