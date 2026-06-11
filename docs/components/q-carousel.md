# 🧩 Component Specification: `q-carousel`

The `<q-carousel>` is a generic, premium horizontal layout container designed to hold and slide any slotted children (such as cards, image banners, or product items). It supports smooth momentum scrolling, touch swipe gestures, horizontal scroll snapping, and optional hover-triggered navigation arrows and indicator dots. 

It is engineered to run at maximum frame rates in Unreal Engine Off-Screen Rendering (OSR) browser interfaces by relying on native CSS scroll physics and lightweight 2D translation offsets rather than heavy JavaScript layout libraries.

---

## 1. Component API (Properties & Attributes)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `snapAlignment` | `'start' \| 'center' \| 'end' \| 'none'` | `'start'` | Defines the scroll snap target point for children. |
| `showArrows` | `boolean` | `false` | Displays floating left/right navigation arrows. |
| `showIndicators` | `boolean` | `false` | Displays active progress indicator dots underneath the carousel. |
| `itemWidth` | `string` | `"auto"` | Forces a specific CSS width on all slotted child items (e.g. `'280px'`, `'33%'`). |

---

## 2. Slots

*   `default` (unnamed): Receives any layout elements (e.g. `<q-card>`, `<div>`, `<img>`, etc.) that should scroll horizontally.

---

## 3. Events

*   `wqSlideChange`: Emitted when the viewport scrolls to a new active index. Passes `{ index: number; element: HTMLElement }` as the event payload.

---

## 4. Visual Variants

The carousel adapts structurally based on its properties:

### Variant A: Scroll Snapping (`snapAlignment`)
*   **`start` / `center` / `end`**: Automatically adds scroll-snapping rules to the container and its children. When a user swipes or clicks arrows, the items snap cleanly to the selected boundary.
*   **`none`**: Standard free scroll behavior.

### Variant B: Overlay Navigation (`showArrows="true"`)
*   Floating absolute-positioned arrow buttons fade into view on hover.
*   **OSR Compatibility**: The arrow buttons use solid background variables (`rgba(0, 0, 0, 0.6)` for dark overlays) instead of `backdrop-filter: blur()`, and utilize standard `box-shadow` to avoid performance degradation.

### Variant C: Active Slide Indicators (`showIndicators="true"`)
*   Renders a centered horizontal row of tiny indicator dots at the bottom. The active slide dot expands horizontally and shifts to `--q-color-primary`.

---

## 5. Typography & Font Styles

Since `<q-carousel>` is a layout wrapper, it does not render primary typography, but its overlay components (such as indicators or pagination text counters) follow these guidelines:
*   **Global Font Stack**: Inherits `--q-font-family`.
*   **Arrow Icons / Counters**:
    *   Font size: `--q-font-size-sm` (e.g., `0.875rem` / `14px`).
    *   Font weight: `--q-font-weight-medium` (e.g., `500`).
    *   Color: `--q-fg-base`.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-carousel-gap` | `16px` | Horizontal space separating slotted child items. |
| `--q-carousel-padding` | `4px` | Internal container padding to prevent shadow clipping on child cards. |
| `--q-carousel-arrow-bg` | `rgba(31, 41, 55, 0.85)` | Background fill of the navigation arrows. |
| `--q-carousel-arrow-border`| `1px solid #374151` | Outline surrounding the navigation arrows. |
| `--q-carousel-arrow-color` | `#ffffff` | Arrow icon SVG line color. |
| `--q-carousel-arrow-size` | `40px` | Width and height circle bounds for arrows. |
| `--q-carousel-indicator-gap`| `8px` | Space between indicator dots. |
| `--q-carousel-indicator-size`| `6px` | Base diameter of inactive indicator dots. |
| `--q-transition-normal` | `250ms ease` | Animation transition duration for arrows and active indicators. |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

```tsx
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

  @Event() wqSlideChange: EventEmitter<{ index: number; element: HTMLElement }>;

  @Element() el!: HTMLElement;

  private scrollContainer?: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private itemOffsets: number[] = [];

  componentDidLoad() {
    this.updateItemStyles();
    this.calculateLimits();
    
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
  }

  @Method()
  async scrollTo(index: number) {
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
      const children = this.getSlottedChildren();
      children.forEach(child => this.resizeObserver?.observe(child));
    }
  };

  private getSlottedChildren(): HTMLElement[] {
    if (!this.scrollContainer) return [];
    const slot = this.scrollContainer.querySelector('slot');
    return slot ? (slot.assignedElements().filter(el => el.nodeType === Node.ELEMENT_NODE) as HTMLElement[]) : [];
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
    this.maxIndex = Math.max(0, children.length - 1);
    
    // Cache element offsets to prevent high-frequency offsetLeft layout reflows (OSR safe)
    this.itemOffsets = children.map(child => child.offsetLeft - this.scrollContainer.offsetLeft);
    this.handleScroll();
  };

  private handleScroll = () => {
    if (!this.scrollContainer || this.itemOffsets.length === 0) return;
    const scrollLeft = this.scrollContainer.scrollLeft;
    const containerWidth = this.scrollContainer.clientWidth;
    const children = this.getSlottedChildren();

    // Math alignment targets for snapping modes
    let targetScroll = scrollLeft;
    if (this.snapAlignment === 'center') {
      targetScroll = scrollLeft + containerWidth / 2;
    } else if (this.snapAlignment === 'end') {
      targetScroll = scrollLeft + containerWidth;
    }

    // Find closest cached offset
    let closestIndex = 0;
    let minDiff = Infinity;

    this.itemOffsets.forEach((offset, index) => {
      let comparisonOffset = offset;
      if (this.snapAlignment === 'center' && children[index]) {
        comparisonOffset = offset + children[index].clientWidth / 2;
      } else if (this.snapAlignment === 'end' && children[index]) {
        comparisonOffset = offset + children[index].clientWidth;
      }

      const diff = Math.abs(comparisonOffset - targetScroll);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });

    if (this.activeIndex !== closestIndex && children[closestIndex]) {
      this.activeIndex = closestIndex;
      this.wqSlideChange.emit({
        index: this.activeIndex,
        element: children[this.activeIndex]
      });
    }
  };

  private scrollToIndex(index: number) {
    if (!this.scrollContainer || index < 0 || index >= this.itemOffsets.length) return;
    this.scrollContainer.scrollTo({
      left: this.itemOffsets[index],
      behavior: 'smooth'
    });
  }

  private slidePrev = () => {
    this.scrollToIndex(this.activeIndex - 1);
  };

  private slideNext = () => {
    this.scrollToIndex(this.activeIndex + 1);
  };

  render() {
    const isFirst = this.activeIndex === 0;
    const isLast = this.activeIndex === this.maxIndex;

    return (
      <div class="carousel-wrapper">
        
        {/* Navigation Arrow Controls with active disabled tabIndex */}
        {this.showArrows && (
          <button 
            class={{ 'arrow-btn': true, 'arrow-left': true, 'is-hidden': isFirst }}
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
            class={{ 'arrow-btn': true, 'arrow-right': true, 'is-hidden': isLast }}
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
        {this.showIndicators && this.maxIndex > 0 && (
          <div class="carousel-indicators" role="tablist" aria-label="Carousel slides">
            {Array.from({ length: this.maxIndex + 1 }).map((_, idx) => (
              <button
                class={{ 'indicator-dot': true, 'is-active': idx === this.activeIndex }}
                role="tab"
                aria-selected={idx === this.activeIndex ? 'true' : 'false'}
                onClick={() => this.scrollToIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                type="button"
              />
            ))}
          </div>
        )}

      </div>
    );
  }
}
```

---

## 8. Component Styling (`q-carousel.css`)

```css
:host {
  display: block;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

.carousel-wrapper {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* Viewport slider shell */
.carousel-viewport {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  width: 100%;
  gap: var(--q-carousel-gap, 16px);
  padding: var(--q-carousel-padding, 4px);
  box-sizing: border-box;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  outline: none;
}

.carousel-viewport:focus-visible {
  box-shadow: 0 0 0 2px var(--q-color-primary, #60a5fa);
  border-radius: var(--q-radius-md, 8px);
}

/* Hide native scrollbars to keep overlay interfaces clean */
.carousel-viewport::-webkit-scrollbar {
  display: none;
}
.carousel-viewport {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Scroll snap rules mapping */
.snap-start { scroll-snap-type: x mandatory; }
.snap-center { scroll-snap-type: x mandatory; }
.snap-end { scroll-snap-type: x mandatory; }

/* Navigation buttons (OSR Safe solid transparent fallbacks) */
.arrow-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: var(--q-carousel-arrow-size, 40px);
  height: var(--q-carousel-arrow-size, 40px);
  border-radius: 50%;
  background: var(--q-carousel-arrow-bg, var(--q-bg-overlay, rgba(31, 41, 55, 0.85)));
  border: var(--q-carousel-arrow-border, var(--q-border, 1px solid var(--q-border-color, #374151)));
  color: var(--q-carousel-arrow-color, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  outline: none;
  box-shadow: var(--q-shadow-medium, 0 8px 16px rgba(0,0,0,0.3));
  opacity: 0; /* Fade in on hover or focus */
  
  transition: opacity var(--q-transition-normal, 250ms ease),
              background var(--q-transition-normal, 250ms ease),
              transform var(--q-transition-normal, 250ms ease);
}

.arrow-left { left: 8px; }
.arrow-right { right: 8px; }

/* Reveal arrows on hover or focus of the component wrapper */
.carousel-wrapper:hover .arrow-btn,
.carousel-wrapper:focus-within .arrow-btn,
.arrow-btn:focus-visible {
  opacity: 1;
}

.arrow-btn:hover {
  background: var(--q-color-primary, #60a5fa);
  border-color: var(--q-color-primary, #60a5fa);
  color: var(--q-bg-base, #111827);
  transform: translateY(-50%) scale(1.08);
}

.arrow-btn:active {
  transform: translateY(-50%) scale(0.95);
}

/* Navigation button helper states */
.arrow-btn.is-hidden {
  opacity: 0 !important;
  pointer-events: none;
}

.arrow-btn svg {
  width: 20px;
  height: 20px;
}

/* Indicator dots track */
.carousel-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--q-carousel-indicator-gap, 8px);
  margin-top: 16px;
  width: 100%;
}

.indicator-dot {
  padding: 0;
  width: var(--q-carousel-indicator-size, 6px);
  height: var(--q-carousel-indicator-size, 6px);
  border-radius: calc(var(--q-carousel-indicator-size, 6px) / 2);
  background: var(--q-color-secondary, #9ca3af);
  border: none;
  cursor: pointer;
  outline: none;
  opacity: 0.5;
  
  transition: width var(--q-transition-normal, 250ms ease),
              background var(--q-transition-normal, 250ms ease),
              opacity var(--q-transition-normal, 250ms ease);
}

.indicator-dot:hover,
.indicator-dot:focus-visible {
  opacity: 0.8;
  outline: none;
}

.indicator-dot.is-active {
  width: calc(var(--q-carousel-indicator-size, 6px) * 2.5);
  background: var(--q-color-primary, #60a5fa);
  opacity: 1;
}
```
