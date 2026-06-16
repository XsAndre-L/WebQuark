import { Component, Prop, Element, Event, EventEmitter, State, Method, h } from '@stencil/core';
import { getSlottedElements } from '../../utils/dom';

@Component({
  tag: 'q-carousel',
  styleUrl: 'q-carousel.css',
  shadow: true,
})
export class QCarousel {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Prop({ reflect: true }) snapAlignment: 'start' | 'center' | 'end' | 'none' = 'start';
  @Prop({ reflect: true }) showArrows: boolean = false;
  @Prop({ reflect: true }) showIndicators: boolean = false;
  @Prop({ reflect: true }) repeat: boolean = false;
  @Prop() itemWidth: string = "auto";

  @State() activeIndex: number = 0;
  @State() maxIndex: number = 0;
  @State() isScrollable: boolean = false;
  @State() isAtStart: boolean = true;
  @State() isAtEnd: boolean = true;

  @Event() qSlideChange!: EventEmitter<{ index: number; element: HTMLElement }>;

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
  private programmaticScrollTimer?: any;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentDidLoad() {
    this.updateCachedChildren();
    this.updateItemStyles();
    this.calculateLimits();

    // Set up ResizeObserver to recalculate slides if viewport bounds change
    if (typeof ResizeObserver !== 'undefined' && this.scrollContainer) {
      this.resizeObserver = new ResizeObserver(() => this.scheduleCalculateLimits());
      this.resizeObserver.observe(this.scrollContainer);
    }
  }

  connectedCallback() {
    if (this.scrollContainer && !this.resizeObserver && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleCalculateLimits());
      this.resizeObserver.observe(this.scrollContainer);
    }
  }

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
    if (this.programmaticScrollTimer) {
      clearTimeout(this.programmaticScrollTimer);
    }
  }

  // ============================ [4] EXPOSED METHODS ============================

  @Method()
  async slideTo(index: number) {
    this.scrollToIndex(index);
  }

  @Method()
  async updateLimits() {
    this.calculateLimits();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

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
    this.cachedChildren.forEach((child) => {
      // Force custom item width if specified
      if (this.itemWidth !== 'auto') {
        child.style.width = this.itemWidth;
        child.style.flex = `0 0 ${this.itemWidth}`;
      } else {
        child.style.flex = '0 0 auto';
      }

      // Inject CSS scroll snap styling
      if (this.snapAlignment !== 'none') {
        child.style.scrollSnapAlign = this.snapAlignment;
      }
    });
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

    // Cache element offsets and sizes to prevent high-frequency layout reflows (OSR safe)
    this.itemOffsets = this.cachedChildren.map(child => child.offsetLeft - this.scrollContainer!.offsetLeft);
    this.itemWidths = this.cachedChildren.map(child => child.clientWidth);
    this.containerWidth = this.scrollContainer.clientWidth;

    const scrollWidth = this.scrollContainer.scrollWidth;
    this.maxScrollLeft = Math.max(0, scrollWidth - this.containerWidth);

    this.isScrollable = scrollWidth > this.containerWidth;
    this.maxIndex = Math.max(0, this.cachedChildren.length - 1);

    // Initialize start/end states on load
    const scrollLeft = this.scrollContainer.scrollLeft;
    const startOffset = this.itemOffsets[0] || 0;

    const nextAtStart = scrollLeft <= startOffset + 5;
    const nextAtEnd = scrollLeft >= this.maxScrollLeft - 5;
    if (this.isAtStart !== nextAtStart) {
      this.isAtStart = nextAtStart;
    }
    if (this.isAtEnd !== nextAtEnd) {
      this.isAtEnd = nextAtEnd;
    }

    this.handleScroll();
  };

  private handleScroll = () => {
    if (!this.scrollContainer || this.itemOffsets.length === 0) return;
    if (this.isProgrammaticScroll) return;

    if (this.scrollRafId) return;

    this.scrollRafId = requestAnimationFrame(() => {
      this.scrollRafId = undefined;
      if (!this.scrollContainer || this.itemOffsets.length === 0 || this.isProgrammaticScroll) return;

      const scrollLeft = this.scrollContainer.scrollLeft;
      const startOffset = this.itemOffsets[0] || 0;

      const nextAtStart = scrollLeft <= startOffset + 5;
      const nextAtEnd = scrollLeft >= this.maxScrollLeft - 5;
      if (this.isAtStart !== nextAtStart) {
        this.isAtStart = nextAtStart;
      }
      if (this.isAtEnd !== nextAtEnd) {
        this.isAtEnd = nextAtEnd;
      }

      // Math alignment targets for snapping modes
      let targetScroll = scrollLeft;
      if (this.snapAlignment === 'center') {
        targetScroll = scrollLeft + this.containerWidth / 2;
      } else if (this.snapAlignment === 'end') {
        targetScroll = scrollLeft + this.containerWidth;
      }

      // Find closest cached offset
      let closestIndex = 0;
      let minDiff = Infinity;

      this.itemOffsets.forEach((offset, index) => {
        let comparisonOffset = offset;
        const itemWidth = this.itemWidths[index] || 0;
        if (this.snapAlignment === 'center') {
          comparisonOffset = offset + itemWidth / 2;
        } else if (this.snapAlignment === 'end') {
          comparisonOffset = offset + itemWidth;
        }

        const diff = Math.abs(comparisonOffset - targetScroll);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
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

  private scrollToIndex(index: number) {
    if (!this.scrollContainer || this.itemOffsets.length === 0 || this.maxIndex <= 0) return;

    let targetIndex = index;
    if (this.repeat) {
      if (targetIndex < 0) {
        targetIndex = this.maxIndex;
      } else if (targetIndex > this.maxIndex) {
        targetIndex = 0;
      }
    } else {
      if (targetIndex < 0 || targetIndex > this.maxIndex) return;
    }

    if (this.itemOffsets[targetIndex] === undefined) return;

    this.isProgrammaticScroll = true;
    clearTimeout(this.programmaticScrollTimer);

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
      this.isProgrammaticScroll = false;
      this.handleScroll();
      clearTimeout(this.programmaticScrollTimer);
      if (this.scrollContainer) {
        this.scrollContainer.removeEventListener('scrollend', onScrollEnd);
      }
    };

    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scrollend', onScrollEnd, { once: true });
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          tabindex="0"
          aria-label="Carousel content"
          onScroll={this.handleScroll}
          ref={(el) => (this.scrollContainer = el)}
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Carousel indicator dots with WAI-ARIA tablist roles */}
        {this.showIndicators && this.isScrollable && this.maxIndex > 0 && (
          <div 
            class="carousel-indicators" 
            role="tablist" 
            aria-label="Carousel slides"
            onKeyDown={this.handleIndicatorKeyDown}
          >
            {Array.from({ length: this.maxIndex + 1 }).map((_, idx) => (
              <button
                class={{ 'indicator-dot': true, 'is-active': idx === this.activeIndex }}
                role="tab"
                aria-selected={idx === this.activeIndex ? 'true' : 'false'}
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
