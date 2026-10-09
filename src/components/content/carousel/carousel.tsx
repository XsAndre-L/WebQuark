import { Component, Prop, Element, Event, EventEmitter, State, Method, Watch, h } from '@stencil/core';
import { CarouselSlideState } from './internals/slide-state';
import { CarouselAutoplay } from './internals/autoplay';
import { getSlottedElements } from '../../../utils/dom';
import type { QCarouselAutoplayChangeDetail, QCarouselLayout, QCarouselSlideChangeDetail, QCarouselSnapAlignment, QCarouselTransition } from './carousel.types';
import { getCarouselEdgeState, getCarouselMetrics, getClosestCarouselIndex, resolveCarouselTargetIndex } from './internals/metrics';

/**
 * A carousel with sliding, crossfade or instant transitions and shared navigation.
 *
 * @slot - Carousel slide content.
 * @slot controls-extra - Additional content below the slide indicators.
 * @part controls - Container shared by indicators and additional controls.
 * @part viewport - Slide viewport.
 * @part previous-button - Previous slide control.
 * @part next-button - Next slide control.
 * @part indicator - Each slide indicator button.
 * @part rotation-button - Playback intent control.
 */
@Component({
  tag: 'q-carousel',
  styleUrl: 'carousel.css',
  shadow: true,
})
export class QCarousel {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /** Slideshow provides full-width slides with no default viewport inset or gap. */
  @Prop({ reflect: true }) layout: QCarouselLayout = 'strip';
  @Prop({ reflect: true }) snapAlignment: QCarouselSnapAlignment = 'start';
  /** `auto` preserves each slotted item's natural width. */
  @Prop({ reflect: true }) itemWidth: string = 'auto';

  /** Omitted controls are enabled for navigable slideshows and disabled for strips. */
  @Prop({ reflect: true }) showArrows?: boolean;
  /** Shows clickable slide indicator dots when the carousel can scroll. */
  @Prop({ reflect: true }) showIndicators?: boolean;
  /** Wraps arrow and programmatic navigation at either end. */
  @Prop({ reflect: true }) repeat: boolean = false;
  /** Animation used when selecting a slide. Overlay modes show one full-width item. */
  @Prop({ reflect: true }) transition: QCarouselTransition = 'slide';
  /** Crossfade duration in milliseconds; native sliding keeps browser-controlled timing. */
  @Prop() transitionDuration: number = 500;
  /** Enables rotation; user interaction pauses until explicitly restarted. */
  @Prop() autoplay: boolean = false;
  /** Finite positive interval in milliseconds; invalid values use 5000. */
  @Prop() autoplayInterval: number = 5000;
  /** Temporarily suspends requested playback without changing the button action. */
  @Prop() autoplaySuspended: boolean = false;

  /** Accessible name forwarded to the slide viewport. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string = 'Carousel content';

  @State() hasExtraControls: boolean = false;
  @State() activeIndex: number = 0;
  @State() maxIndex: number = 0;
  @State() isScrollable: boolean = false;
  @State() isAtStart: boolean = true;
  @State() isAtEnd: boolean = true;
  @State() private autoplayRequested = false;
  @State() private autoplayPlaying = false;

  @Event() qSlideChange!: EventEmitter<QCarouselSlideChangeDetail>;
  /** Actual running state, including temporary suspension. */
  @Event() qAutoplayChange!: EventEmitter<QCarouselAutoplayChangeDetail>;

  @Element() el!: HTMLElement;

  private slideState = new CarouselSlideState();
  private touchStart?: { id: number; x: number; y: number };

  private get stacked(): boolean {
    return this.transition === 'crossfade' || this.transition === 'instant';
  }

  private get managesSlides(): boolean {
    return this.stacked || this.layout === 'slideshow';
  }

  private get navigable(): boolean {
    return this.isScrollable && this.maxIndex > 0;
  }

  private get arrowsVisible(): boolean {
    return this.navigable && (this.showArrows ?? this.layout === 'slideshow');
  }

  private get indicatorsVisible(): boolean {
    return this.navigable && (this.showIndicators ?? this.layout === 'slideshow');
  }

  private get viewportFocusable(): boolean {
    if (!this.managesSlides)
      return this.isScrollable;
    return this.navigable && !this.arrowsVisible && !this.indicatorsVisible;
  }

  private scrollContainer?: HTMLDivElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private resizeObserver?: ResizeObserver;
  private restoreSlideIndex?: number;
  private itemOffsets: number[] = [];
  private itemWidths: number[] = [];
  private containerWidth: number = 0;
  private maxScrollLeft: number = 0;
  private cachedChildren: HTMLElement[] = [];
  private rafId?: number;
  private scrollRafId?: number;

  private isProgrammaticScroll: boolean = false;
  private programmaticScrollTimer?: ReturnType<typeof setTimeout>;
  private activeScrollEndCleanup?: () => void;
  private programmaticScrollToken = 0;
  private connected = false;
  private hovered = false;
  private reducedMotion = false;
  private motionPreference?: MediaQueryList;
  private rotationButton?: HTMLButtonElement;
  private rotationPointerAction?: boolean;
  private readonly autoplayController = new CarouselAutoplay(
    () => {
      if (!this.repeat && this.activeIndex >= this.maxIndex)
        return false;
      this.scrollToIndex(this.activeIndex + 1);
      return true;
    },
    (playing, requested) => {
      const changed = playing !== this.autoplayPlaying;
      this.autoplayRequested = requested;
      this.autoplayPlaying = playing;
      if (changed)
        this.qAutoplayChange.emit({ playing });
    },
  );

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('layout')
  @Watch('itemWidth')
  @Watch('snapAlignment')
  protected layoutChanged() {
    this.updateItemStyles();
    if (!this.managesSlides)
      this.slideState.restore();
    this.scheduleCalculateLimits();
  }

  @Watch('autoplay')
  @Watch('autoplayInterval')
  @Watch('autoplaySuspended')
  protected autoplayChanged() {
    this.syncAutoplay();
  }

  @Watch('transition')
  protected transitionChanged() {
    this.programmaticScrollToken += 1;
    this.clearProgrammaticScroll();
    this.isProgrammaticScroll = false;
    this.touchStart = undefined;
    if (this.scrollRafId) cancelAnimationFrame(this.scrollRafId);
    this.scrollRafId = undefined;
    if (!this.stacked) {
      if (!this.managesSlides)
        this.slideState.restore();
      this.restoreSlideIndex = this.activeIndex;
    }
    if (this.scrollContainer) this.scrollContainer.scrollLeft = 0;
    this.scheduleCalculateLimits();
  }

  connectedCallback() {
    this.connected = true;
    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motionPreference.matches;
    this.motionPreference.addEventListener('change', this.handleMotionChange);
    document.addEventListener('visibilitychange', this.syncAutoplay);
    this.syncAutoplay();
    if (this.scrollContainer) this.setScrollContainerRef(this.scrollContainer);
  }

  disconnectedCallback() {
    this.connected = false;
    this.motionPreference?.removeEventListener('change', this.handleMotionChange);
    this.motionPreference = undefined;
    document.removeEventListener('visibilitychange', this.syncAutoplay);
    this.autoplayController.disconnect();
    this.slideState.restore();
    this.touchStart = undefined;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    if (this.scrollRafId) {
      cancelAnimationFrame(this.scrollRafId);
      this.scrollRafId = undefined;
    }
    this.programmaticScrollToken += 1;
    this.clearProgrammaticScroll();
    this.isProgrammaticScroll = false;
  }

  // ============================ [4] EXPOSED METHODS ============================

  /** Scrolls the carousel to a zero-based slide index. */
  @Method()
  async slideTo(index: number) {
    this.scrollToIndex(index);
  }

  /** Requests rotation when enabled; completed non-repeating playback restarts at the first slide. */
  @Method()
  async play(): Promise<void> {
    this.updateCachedChildren();
    this.updateItemStyles();
    this.calculateLimits();
    if (this.autoplay && this.navigable && !this.repeat && this.activeIndex >= this.maxIndex)
      this.scrollToIndex(0);
    this.autoplayController.play();
  }

  /** Stops rotation until play() or the playback control explicitly restarts it. */
  @Method()
  async pause(): Promise<void> {
    this.autoplayController.pause();
  }

  /** Recalculates slide offsets, scroll bounds, and navigation states. */
  @Method()
  async updateLimits() {
    this.calculateLimits();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private syncAutoplay = () => {
    this.autoplayController.configure({
      enabled: this.autoplay,
      navigable: this.navigable,
      suspended: !this.connected || this.hovered || document.hidden || this.autoplaySuspended,
      reducedMotion: this.reducedMotion,
      interval: this.autoplayInterval,
    });
  };

  private handleMotionChange = (event: MediaQueryListEvent) => {
    this.reducedMotion = event.matches;
    this.syncAutoplay();
  };

  private handleHover = (hovered: boolean) => {
    this.hovered = hovered;
    this.syncAutoplay();
  };

  private isRotationEvent(event: Event): boolean {
    return !!this.rotationButton && event.composedPath().includes(this.rotationButton);
  }

  private handleInteraction = (event: Event) => {
    if (!this.isRotationEvent(event))
      this.autoplayController.pause();
  };

  private handleFocus = () => this.autoplayController.pause();

  private handleRotationClick = () => {
    const play = this.rotationPointerAction ?? !this.autoplayRequested;
    this.rotationPointerAction = undefined;
    if (play)
      void this.play();
    else
      this.autoplayController.pause();
  };

  private updateSlideState() {
    if (this.managesSlides)
      this.slideState.update(this.cachedChildren, this.activeIndex, () => this.recoverSlideFocus());
    else
      this.slideState.restore();
  }

  private recoverSlideFocus() {
    const root = this.el.shadowRoot;
    const indicator = this.indicatorsVisible
      ? root?.querySelectorAll<HTMLButtonElement>('.indicator-dot')[this.activeIndex]
      : undefined;
    const arrow = this.arrowsVisible
      ? root?.querySelector<HTMLButtonElement>(this.repeat || this.activeIndex < this.maxIndex ? '.arrow-right' : '.arrow-left')
      : undefined;
    (indicator ?? arrow ?? this.rotationButton ?? this.scrollContainer)?.focus({ preventScroll: true });
  }

  private setScrollContainerRef = (el: HTMLDivElement | null) => {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    this.scrollContainer = el || undefined;

    if (el) {
      this.updateCachedChildren();
      this.updateItemStyles();
      this.calculateLimits();

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.scheduleCalculateLimits());
        this.resizeObserver.observe(el);
      }
    }
  };

  private handleSlotChange = () => {
    this.updateCachedChildren();
    this.updateItemStyles();
    this.calculateLimits();
  };

  private updateCachedChildren() {
    if (!this.scrollContainer) {
      this.cachedChildren = [];
      return;
    }
    this.cachedChildren = getSlottedElements(this.scrollContainer);
  }

  private updateItemStyles() {
    const itemWidth = this.itemWidth === 'auto' && this.layout === 'slideshow' ? '100%' : this.itemWidth;
    if (itemWidth !== 'auto') {
      this.el.style.setProperty('--q-carousel-item-width', itemWidth);
      this.el.style.setProperty('--q-carousel-item-flex', `0 0 ${itemWidth}`);
    } else {
      this.el.style.removeProperty('--q-carousel-item-width');
      this.el.style.removeProperty('--q-carousel-item-flex');
    }

    if (this.snapAlignment !== 'none') {
      this.el.style.setProperty('--q-carousel-snap-align', this.snapAlignment);
    } else {
      this.el.style.removeProperty('--q-carousel-snap-align');
    }
  }

  private scheduleCalculateLimits = () => {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      this.calculateLimits();
      this.rafId = undefined;
    });
  };

  private calculateLimits = () => {
    if (!this.scrollContainer) return;

    if (this.stacked) {
      this.maxIndex = Math.max(0, this.cachedChildren.length - 1);
      this.isScrollable = this.cachedChildren.length > 1;
      this.selectStacked(Math.min(this.activeIndex, this.maxIndex));
      this.syncAutoplay();
      return;
    }

    const metrics = getCarouselMetrics(this.scrollContainer, this.cachedChildren);
    this.itemOffsets = metrics.itemOffsets;
    this.itemWidths = metrics.itemWidths;
    this.containerWidth = metrics.containerWidth;
    this.maxScrollLeft = metrics.maxScrollLeft;
    this.isScrollable = metrics.isScrollable;
    this.maxIndex = metrics.maxIndex;
    const index = Math.min(this.activeIndex, this.maxIndex);
    if (index !== this.activeIndex) {
      this.activeIndex = index;
      if (this.cachedChildren[index])
        this.qSlideChange.emit({ index, element: this.cachedChildren[index] });
    }
    this.updateSlideState();
    this.syncAutoplay();

    if (this.restoreSlideIndex !== undefined) {
      const index = Math.min(this.restoreSlideIndex, this.maxIndex);
      this.scrollContainer.scrollTo({ left: this.itemOffsets[index] ?? 0, behavior: 'instant' });
      this.restoreSlideIndex = undefined;
    }
    const scrollLeft = this.scrollContainer.scrollLeft;
    this.updateEdgeState(scrollLeft);
    this.handleScroll();
  };

  private updateEdgeState(scrollLeft: number) {
    const startOffset = this.itemOffsets[0] || 0;
    const { isAtStart, isAtEnd } = getCarouselEdgeState(scrollLeft, startOffset, this.maxScrollLeft);

    if (this.isAtStart !== isAtStart) {
      this.isAtStart = isAtStart;
    }
    if (this.isAtEnd !== isAtEnd) {
      this.isAtEnd = isAtEnd;
    }
  }

  private handleScroll = () => {
    if (this.stacked || !this.scrollContainer || this.itemOffsets.length === 0) return;
    if (this.isProgrammaticScroll) return;

    if (this.scrollRafId) return;

    this.scrollRafId = requestAnimationFrame(() => {
      this.scrollRafId = undefined;
      if (this.stacked || !this.scrollContainer || this.itemOffsets.length === 0 || this.isProgrammaticScroll) return;

      const scrollLeft = this.scrollContainer.scrollLeft;
      this.updateEdgeState(scrollLeft);

      const closestIndex = getClosestCarouselIndex({
        scrollLeft,
        itemOffsets: this.itemOffsets,
        itemWidths: this.itemWidths,
        containerWidth: this.containerWidth,
        snapAlignment: this.snapAlignment,
      });

      if (this.activeIndex !== closestIndex) {
        this.activeIndex = closestIndex;
        this.updateSlideState();
        const children = this.cachedChildren;
        if (children[this.activeIndex]) {
          this.qSlideChange.emit({
            index: this.activeIndex,
            element: children[this.activeIndex]
          });
        }
      }
    });
  };

  private clearProgrammaticScroll() {
    if (this.activeScrollEndCleanup) {
      this.activeScrollEndCleanup();
      this.activeScrollEndCleanup = undefined;
    }
    if (this.programmaticScrollTimer) {
      clearTimeout(this.programmaticScrollTimer);
      this.programmaticScrollTimer = undefined;
    }
  }

  private selectStacked(index: number) {
    const changed = this.activeIndex !== index;
    this.activeIndex = index;
    this.isAtStart = index === 0;
    this.isAtEnd = index === this.maxIndex;
    this.updateSlideState();
    if (changed && this.cachedChildren[index]) {
      this.qSlideChange.emit({ index, element: this.cachedChildren[index] });
    }
  }

  private scrollToIndex(index: number) {
    if (this.stacked) {
      const target = resolveCarouselTargetIndex(index, this.maxIndex, this.repeat);
      if (target !== undefined && this.cachedChildren[target]) this.selectStacked(target);
      return;
    }
    if (!this.scrollContainer || this.itemOffsets.length === 0 || this.maxIndex <= 0) return;

    const targetIndex = resolveCarouselTargetIndex(index, this.maxIndex, this.repeat);
    if (targetIndex === undefined) return;

    if (this.itemOffsets[targetIndex] === undefined) return;

    this.clearProgrammaticScroll();
    this.isProgrammaticScroll = true;
    const scrollToken = ++this.programmaticScrollToken;

    this.activeIndex = targetIndex;
    this.updateSlideState();
    const children = this.cachedChildren;
    if (children[this.activeIndex]) {
      this.qSlideChange.emit({
        index: this.activeIndex,
        element: children[this.activeIndex]
      });
    }

    this.scrollContainer.scrollTo({
      left: this.itemOffsets[targetIndex],
      behavior: this.reducedMotion ? 'instant' : 'smooth'
    });

    const onScrollEnd = () => {
      if (scrollToken !== this.programmaticScrollToken) return;

      this.clearProgrammaticScroll();
      this.isProgrammaticScroll = false;
      this.handleScroll();
    };

    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scrollend', onScrollEnd, { once: true });
      this.activeScrollEndCleanup = () => {
        this.scrollContainer?.removeEventListener('scrollend', onScrollEnd);
      };
    }

    // 600ms safety fallback timer in case browser scrollend doesn't fire
    this.programmaticScrollTimer = setTimeout(onScrollEnd, 600);
  }

  private slidePrev = () => {
    const isFirst = this.repeat ? (!this.isScrollable || this.maxIndex <= 0) : (this.isAtStart || !this.isScrollable);
    if (isFirst) return;
    this.scrollToIndex(this.activeIndex - 1);
  };

  private slideNext = () => {
    const isLast = this.repeat ? (!this.isScrollable || this.maxIndex <= 0) : (this.isAtEnd || !this.isScrollable);
    if (isLast) return;
    this.scrollToIndex(this.activeIndex + 1);
  };

  private handleIndicatorKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      this.autoplayController.pause();

      const dots = Array.from(this.el.shadowRoot?.querySelectorAll('.indicator-dot') || []) as HTMLButtonElement[];
      if (dots.length === 0) return;

      const currentFocusedIdx = dots.findIndex(dot => dot === this.el.shadowRoot?.activeElement);
      if (currentFocusedIdx === -1) return;

      let nextFocusedIdx = currentFocusedIdx;
      if (e.key === 'ArrowRight') {
        nextFocusedIdx = (currentFocusedIdx + 1) % dots.length;
      } else {
        nextFocusedIdx = (currentFocusedIdx - 1 + dots.length) % dots.length;
      }

      dots[nextFocusedIdx].focus();
      this.scrollToIndex(nextFocusedIdx);
    }
  };

  private isInteractiveEvent(event: Event): boolean {
    return event.composedPath().some(node => node instanceof HTMLElement &&
      node.matches('button, a, input, select, textarea, video, audio, [contenteditable]:not([contenteditable="false"])'));
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.managesSlides || this.isInteractiveEvent(event) || event.defaultPrevented) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    event.stopPropagation();
    this.autoplayController.pause();
    this.scrollToIndex(this.activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
    if (!this.viewportFocusable)
      this.recoverSlideFocus();
  };

  private handlePointerDown = (event: PointerEvent) => {
    if (!this.stacked || !event.isPrimary || event.pointerType === 'mouse' || this.isInteractiveEvent(event)) return;
    this.touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };

  private handlePointerUp = (event: PointerEvent) => {
    const start = this.touchStart;
    this.touchStart = undefined;
    if (!this.stacked || !start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      this.scrollToIndex(this.activeIndex + (dx < 0 ? 1 : -1));
    }
  };

  private handlePointerCancel = () => { this.touchStart = undefined; };

  private handleExtraControlsChange = (event: Event) => {
    const slot = event.target as HTMLSlotElement;
    this.hasExtraControls = slot.assignedElements().length > 0;
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const isFirst = this.repeat ? (!this.isScrollable || this.maxIndex <= 0) : (this.isAtStart || !this.isScrollable);
    const isLast = this.repeat ? (!this.isScrollable || this.maxIndex <= 0) : (this.isAtEnd || !this.isScrollable);

    return (
      <div
        class="carousel-wrapper"
        onMouseEnter={() => this.handleHover(true)}
        onMouseLeave={() => this.handleHover(false)}
        onFocusin={this.handleFocus}
        onPointerDown={this.handleInteraction}
        onClick={this.handleInteraction}
      >
        <div
          class="carousel-controls"
          part="controls"
          hidden={!this.indicatorsVisible && !(this.autoplay && this.navigable) && !this.hasExtraControls}
        >
          {this.autoplay && this.navigable && (
            <button
              class="rotation-btn"
              part="rotation-button"
              type="button"
              onPointerDown={() => { this.rotationPointerAction = !this.autoplayRequested; }}
              onPointerCancel={() => { this.rotationPointerAction = undefined; }}
              onClick={this.handleRotationClick}
              ref={element => { this.rotationButton = element ?? undefined; }}
            >
              {this.autoplayRequested ? 'Pause slideshow' : 'Play slideshow'}
            </button>
          )}
          {this.indicatorsVisible && (
            <div class="carousel-indicators" role="group" aria-label="Carousel slide controls" onKeyDown={this.handleIndicatorKeyDown}>
              {Array.from({ length: this.maxIndex + 1 }).map((_, idx) => (
                <button
                  class={{ 'indicator-dot': true, 'is-active': idx === this.activeIndex }}
                  part="indicator"
                  aria-current={idx === this.activeIndex ? 'true' : undefined}
                  onClick={() => this.scrollToIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  type="button"
                  tabindex={idx === this.activeIndex ? 0 : -1}
                />
              ))}
            </div>
          )}
          <slot name="controls-extra" onSlotchange={this.handleExtraControlsChange} />
        </div>
        {/* Navigation Arrow Controls with active disabled tabIndex */}
        {this.arrowsVisible && (
          <button
            class={{ 'arrow-btn': true, 'arrow-left': true }}
            part="previous-button"
            aria-disabled={isFirst ? 'true' : 'false'}
            onClick={isFirst ? undefined : this.slidePrev}
            aria-label="Previous slide"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Core Scrolling viewport container with a11y tab focus */}
        <div
          class={{
            'carousel-viewport': true,
            'is-stacked': this.stacked,
            'viewport-focusable': this.viewportFocusable,
            [`snap-${this.snapAlignment}`]: this.snapAlignment !== 'none'
          }}
          role="group"
          aria-roledescription="carousel"
          part="viewport"
          tabindex={this.viewportFocusable ? 0 : -1}
          aria-label={this.ariaLabel}
          aria-live={this.managesSlides ? (this.autoplayPlaying ? 'off' : 'polite') : undefined}
          aria-atomic={this.managesSlides ? 'false' : undefined}
          style={{ '--q-carousel-transition-duration': `${Number.isFinite(this.transitionDuration) ? Math.max(0, this.transitionDuration) : 500}ms` }}
          onKeyDown={this.handleKeyDown}
          onPointerDown={this.handlePointerDown}
          onPointerUp={this.handlePointerUp}
          onPointerCancel={this.handlePointerCancel}
          onScroll={this.handleScroll}
          ref={this.setScrollContainerRef}
        >
          <slot onSlotchange={this.handleSlotChange} />
        </div>

        {this.arrowsVisible && (
          <button
            class={{ 'arrow-btn': true, 'arrow-right': true }}
            part="next-button"
            aria-disabled={isLast ? 'true' : 'false'}
            onClick={isLast ? undefined : this.slideNext}
            aria-label="Next slide"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

      </div>
    );
  }
}
