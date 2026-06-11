import { Component, Prop, Element, Event, EventEmitter, State, Method, h } from '@stencil/core';
import { getSlottedElements } from '../../utils/dom';

@Component({
  tag: 'q-carousel',
  styleUrl: 'q-carousel.css',
  shadow: true,
})
export class QCarousel {
  @Prop({ reflect: true }) snapAlignment: 'start' | 'center' | 'end' | 'none' = 'start';
  @Prop({ reflect: true }) showArrows: boolean = false;
  @Prop({ reflect: true }) showIndicators: boolean = false;
  @Prop() itemWidth: string = "auto";

  @State() activeIndex: number = 0;
  @State() maxIndex: number = 0;
  @State() isScrollable: boolean = false;
  @State() isAtStart: boolean = true;
  @State() isAtEnd: boolean = true;

  @Event() qSlideChange!: EventEmitter<{ index: number; element: HTMLElement }>;

  @Element() el!: HTMLElement;

  private scrollContainer?: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private itemOffsets: number[] = [];
  private itemWidths: number[] = [];
  private containerWidth: number = 0;

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isDragging: boolean = false;
  private isProgrammaticScroll: boolean = false;
  private programmaticScrollTimer?: any;

  componentDidLoad() {
    this.updateItemStyles();
    this.calculateLimits();
    
    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      this.scrollContainer.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      this.scrollContainer.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }

    // Set up ResizeObserver to recalculate slides if viewport or item bounds change
    if (typeof ResizeObserver !== 'undefined' && this.scrollContainer) {
      this.resizeObserver = new ResizeObserver(() => this.calculateLimits());
      this.resizeObserver.observe(this.scrollContainer);
      
      // Also observe all child items (for asynchronous layout rendering)
      const children = this.getSlottedChildren();
      children.forEach(child => this.resizeObserver?.observe(child));
    }
  }

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('touchstart', this.handleTouchStart);
      this.scrollContainer.removeEventListener('touchmove', this.handleTouchMove);
      this.scrollContainer.removeEventListener('touchend', this.handleTouchEnd);
    }
  }

  @Method()
  async slideTo(index: number) {
    this.scrollToIndex(index);
  }

  @Method()
  async updateLimits() {
    this.calculateLimits();
  }

  private handleSlotChange = () => {
    this.updateItemStyles();
    this.calculateLimits();
    
    // Dynamically observe new slotted items
    if (this.resizeObserver && this.scrollContainer) {
      this.resizeObserver.disconnect();
      this.resizeObserver.observe(this.scrollContainer);
      const children = this.getSlottedChildren();
      children.forEach(child => this.resizeObserver?.observe(child));
    }
  };

  private getSlottedChildren(): HTMLElement[] {
    if (!this.scrollContainer) return [];
    return getSlottedElements(this.scrollContainer);
  }

  private updateItemStyles() {
    if (!this.scrollContainer) return;
    const children = this.getSlottedChildren();
    children.forEach((child) => {
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

  private calculateLimits = () => {
    if (!this.scrollContainer) return;
    const children = this.getSlottedChildren();
    
    // Cache element offsets and sizes to prevent high-frequency layout reflows (OSR safe)
    this.itemOffsets = children.map(child => child.offsetLeft - this.scrollContainer!.offsetLeft);
    this.itemWidths = children.map(child => child.clientWidth);
    this.containerWidth = this.scrollContainer.clientWidth;

    const scrollWidth = this.scrollContainer.scrollWidth;
    const maxScrollLeft = Math.max(0, scrollWidth - this.containerWidth);

    this.isScrollable = scrollWidth > this.containerWidth;
    this.maxIndex = Math.max(0, children.length - 1);
    
    // Initialize start/end states on load
    const scrollLeft = this.scrollContainer.scrollLeft;
    const startOffset = this.itemOffsets[0] || 0;
    this.isAtStart = scrollLeft <= startOffset + 5;
    this.isAtEnd = scrollLeft >= maxScrollLeft - 5;
    
    this.handleScroll();
  };

  private handleScroll = () => {
    if (!this.scrollContainer || this.itemOffsets.length === 0) return;

    const scrollLeft = this.scrollContainer.scrollLeft;
    const maxScrollLeft = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;

    const startOffset = this.itemOffsets[0] || 0;
    this.isAtStart = scrollLeft <= startOffset + 5;
    this.isAtEnd = scrollLeft >= maxScrollLeft - 5;
    
    // Ignore scroll event index updates during programmatic scrolling to avoid indicator jumping
    if (this.isProgrammaticScroll) return;

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
      const children = this.getSlottedChildren();
      if (children[this.activeIndex]) {
        this.qSlideChange.emit({
          index: this.activeIndex,
          element: children[this.activeIndex]
        });
      }
    }
  };

  private scrollToIndex(index: number) {
    if (!this.scrollContainer || index < 0 || index >= this.itemOffsets.length) return;
    
    this.isProgrammaticScroll = true;
    clearTimeout(this.programmaticScrollTimer);
    
    this.activeIndex = Math.min(index, this.maxIndex);
    const children = this.getSlottedChildren();
    if (children[this.activeIndex]) {
      this.qSlideChange.emit({
        index: this.activeIndex,
        element: children[this.activeIndex]
      });
    }

    this.scrollContainer.scrollTo({
      left: this.itemOffsets[index],
      behavior: 'smooth'
    });

    // Clear programmatic scroll flag after scroll transition completes (400ms)
    this.programmaticScrollTimer = setTimeout(() => {
      this.isProgrammaticScroll = false;
    }, 400);
  }

  private slidePrev = () => {
    this.scrollToIndex(this.activeIndex - 1);
  };

  private slideNext = () => {
    this.scrollToIndex(this.activeIndex + 1);
  };

  private handleTouchStart = (e: TouchEvent) => {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.isDragging = false;
  };

  private handleTouchMove = (e: TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - this.touchStartX);
    const diffY = Math.abs(currentY - this.touchStartY);

    if (diffX > 5 || diffY > 5) {
      this.isDragging = true;
      if (e.cancelable) {
        e.preventDefault();
      }
      if (this.scrollContainer) {
        const deltaX = this.touchStartX - currentX;
        this.scrollContainer.scrollLeft += deltaX;
        this.touchStartX = currentX;
      }
    }
  };

  private handleTouchEnd = () => {
    if (this.isDragging) {
      const blockClick = (e: MouseEvent) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.el.removeEventListener('click', blockClick, true);
      };
      this.el.addEventListener('click', blockClick, true);
      setTimeout(() => {
        this.el.removeEventListener('click', blockClick, true);
      }, 50);
    }
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

  render() {
    const isFirst = this.isAtStart || !this.isScrollable;
    const isLast = this.isAtEnd || !this.isScrollable;

    return (
      <div class="carousel-wrapper">
        
        {/* Navigation Arrow Controls with active disabled tabIndex */}
        {this.showArrows && (
          <button 
            class={{ 'arrow-btn': true, 'arrow-left': true }}
            disabled={isFirst}
            onClick={this.slidePrev}
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
            disabled={isLast}
            onClick={this.slideNext}
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
