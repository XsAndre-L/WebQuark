import { Component, Prop, Element, Event, EventEmitter, State, Method, h } from '@stencil/core';
import { getSlottedElements } from '../../../utils/dom';
import type { QCarouselSlideChangeDetail, QCarouselSnapAlignment } from './carousel.types';
import { getCarouselEdgeState, getCarouselMetrics, getClosestCarouselIndex, resolveCarouselTargetIndex } from './internals/metrics';

/**
 * A horizontal carousel viewport with optional arrow and dot navigation.
 *
 * @slot - Carousel slide content.
 */
@Component({
  tag: 'q-carousel',
  styleUrl: 'carousel.css',
  shadow: true,
})
export class QCarousel {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /** Controls the CSS scroll-snap alignment applied to each slide. */
  @Prop({ reflect: true }) snapAlignment: QCarouselSnapAlignment = 'start';

  /** Shows previous and next arrow buttons over the carousel viewport. */
  @Prop({ reflect: true }) showArrows: boolean = false;

  /** Shows clickable slide indicator dots when the carousel can scroll. */
  @Prop({ reflect: true }) showIndicators: boolean = false;

  /** Wraps arrow and programmatic navigation from the first slide to the last, and back again. */
  @Prop({ reflect: true }) repeat: boolean = false;

  /** Sets the flex-basis/width for each slotted carousel item. Use "auto" to preserve natural item sizing. */
  @Prop({ reflect: true }) itemWidth: string = 'auto';

  @State() activeIndex: number = 0;
  @State() maxIndex: number = 0;
  @State() isScrollable: boolean = false;
  @State() isAtStart: boolean = true;
  @State() isAtEnd: boolean = true;

  /** Fires when the active slide index changes. */
  @Event() qSlideChange!: EventEmitter<QCarouselSlideChangeDetail>;

  @Element() el!: HTMLElement;

  private scrollContainer?: HTMLDivElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private resizeObserver?: ResizeObserver;
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

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.scrollRafId) {
      cancelAnimationFrame(this.scrollRafId);
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

  /** Recalculates slide offsets, scroll bounds, and navigation states. */
  @Method()
  async updateLimits() {
    this.calculateLimits();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

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
    this.scheduleCalculateLimits();
  };

  private updateCachedChildren() {
    if (!this.scrollContainer) {
      this.cachedChildren = [];
      return;
    }
    this.cachedChildren = getSlottedElements(this.scrollContainer);
  }

  private updateItemStyles() {
    if (this.itemWidth !== 'auto') {
      this.el.style.setProperty('--q-carousel-item-width', this.itemWidth);
      this.el.style.setProperty('--q-carousel-item-flex', `0 0 ${this.itemWidth}`);
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

    const metrics = getCarouselMetrics(this.scrollContainer, this.cachedChildren);
    this.itemOffsets = metrics.itemOffsets;
    this.itemWidths = metrics.itemWidths;
    this.containerWidth = metrics.containerWidth;
    this.maxScrollLeft = metrics.maxScrollLeft;
    this.isScrollable = metrics.isScrollable;
    this.maxIndex = metrics.maxIndex;

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
    if (!this.scrollContainer || this.itemOffsets.length === 0) return;
    if (this.isProgrammaticScroll) return;

    if (this.scrollRafId) return;

    this.scrollRafId = requestAnimationFrame(() => {
      this.scrollRafId = undefined;
      if (!this.scrollContainer || this.itemOffsets.length === 0 || this.isProgrammaticScroll) return;

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

  private scrollToIndex(index: number) {
    if (!this.scrollContainer || this.itemOffsets.length === 0 || this.maxIndex <= 0) return;

    const targetIndex = resolveCarouselTargetIndex(index, this.maxIndex, this.repeat);
    if (targetIndex === undefined) return;

    if (this.itemOffsets[targetIndex] === undefined) return;

    this.clearProgrammaticScroll();
    this.isProgrammaticScroll = true;
    const scrollToken = ++this.programmaticScrollToken;

    this.activeIndex = targetIndex;
    const children = this.cachedChildren;
    if (children[this.activeIndex]) {
      this.qSlideChange.emit({
        index: this.activeIndex,
        element: children[this.activeIndex]
      });
    }

    this.scrollContainer.scrollTo({
      left: this.itemOffsets[targetIndex],
      behavior: 'smooth'
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

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const isFirst = this.repeat ? (!this.isScrollable || this.maxIndex <= 0) : (this.isAtStart || !this.isScrollable);
    const isLast = this.repeat ? (!this.isScrollable || this.maxIndex <= 0) : (this.isAtEnd || !this.isScrollable);

    return (
      <div class="carousel-wrapper">
        {/* Navigation Arrow Controls with active disabled tabIndex */}
        {this.showArrows && (
          <button
            class={{ 'arrow-btn': true, 'arrow-left': true }}
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
            [`snap-${this.snapAlignment}`]: this.snapAlignment !== 'none'
          }}
          role="group"
          aria-roledescription="carousel"
          tabindex="0"
          aria-label="Carousel content"
          onScroll={this.handleScroll}
          ref={this.setScrollContainerRef}
        >
          <slot onSlotchange={this.handleSlotChange} />
        </div>

        {this.showArrows && (
          <button
            class={{ 'arrow-btn': true, 'arrow-right': true }}
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

        {/* Carousel indicator dots */}
        {this.showIndicators && this.isScrollable && this.maxIndex > 0 && (
          <div class="carousel-indicators" aria-label="Carousel slide controls" onKeyDown={this.handleIndicatorKeyDown}>
            {Array.from({ length: this.maxIndex + 1 }).map((_, idx) => (
              <button
                class={{ 'indicator-dot': true, 'is-active': idx === this.activeIndex }}
                aria-current={idx === this.activeIndex ? 'true' : undefined}
                onClick={() => this.scrollToIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                type="button"
                tabindex={idx === this.activeIndex ? 0 : -1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}
