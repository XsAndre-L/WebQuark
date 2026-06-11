# 🧩 Component Specification: `q-reel` & `q-thumbnail`

The `<q-reel>` and `<q-thumbnail>` components collaborate to create a premium, modular media showcase grid or horizontal gallery (carousel) that supports a built-in media viewer (lightbox). It is specifically optimized to avoid rendering bugs inside Unreal Engine's Off-Screen Rendering (OSR) environments (e.g. avoiding native `<dialog>` overlays and `backdrop-filter` blurs).

---

## 1. Component API (Properties & Attributes)

### A. Parent Reel Container: `<q-reel>`

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `layout` | `'grid' \| 'carousel'` | `'grid'` | Visual arrangement of the thumbnails. `'grid'` wraps items into a multi-column responsive layout. `'carousel'` aligns them horizontally with a scrollbar. |
| `lightbox` | `boolean` | `true` | When `true`, clicking a thumbnail automatically opens the fullscreen media viewer overlay. |

### B. Child Thumbnail: `<q-thumbnail>`

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | `""` | Image or video media source URL. |
| `video` | `boolean` | `false` | Marks the thumbnail as a video. If `true`, a play button overlay is drawn. |
| `label` | `string` | `undefined` | Translucent text caption displayed at the bottom of the thumbnail. |
| `alt` | `string` | `""` | Alternate text description for screen readers and accessibility. |
| `highlighted` | `boolean` | `false` | Applies an active glowing accent border frame. |

---

## 2. Slots

### A. Parent Container: `<q-reel>`
*   `default` (unnamed): Receives the list of `<q-thumbnail>` items.

### B. Child Thumbnail: `<q-thumbnail>`
*   `default` (unnamed): Optional custom overlays or text content to show on top of the image container.

---

## 3. Events

### A. Child Thumbnail: `<q-thumbnail>`
*   `wqMaximize`: Emitted when the thumbnail is clicked. The event payload carries the thumbnail's data (`src`, `label`, `video`, `alt`, `triggerEl`).

### B. Parent Reel: `<q-reel>`
*   `wqLightboxOpen`: Emitted when the fullscreen media overlay opens.
*   `wqLightboxClose`: Emitted when the fullscreen media overlay is closed.

---

## 4. Visual Variants

The components change layout and animations based on properties and active states:

### Variant A: Reel Layouts (`layout`)
*   **Grid Flow (`layout="grid"`)**: Displays items in a responsive grid that automatically wraps based on screen width using CSS grid columns (`--q-reel-columns-desktop` and `--q-reel-columns-mobile`).
*   **Carousel Flow (`layout="carousel"`)**: Displays items in a single, non-wrapping horizontal row with smooth horizontal scroll snapping.

### Variant B: Highlighted State (`highlighted`)
*   When a thumbnail has `highlighted="true"`, it renders a constant glowing border using `--q-glow-interactive` to indicate that it is actively selected, running, or featured.

### Variant C: Fullscreen Lightbox Overlay
*   When a thumbnail is clicked and `lightbox` is active, a fullscreen overlay container (`.lightbox-overlay`) is dynamically rendered directly within the shadow root of `<q-reel>`.
*   **CEF OSR Compatibility**: Instead of using the native `<dialog>` element (which can lock viewports and render black screens in game UI overlays) or `backdrop-filter: blur()`, the lightbox overlay uses a high-opacity solid backdrop (`rgba(0, 0, 0, 0.85)` via `--q-bg-overlay`) to dim the viewport.
*   **Controls**: Features close and navigation control buttons designed using custom elements and standard icons.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family`.
*   **Thumbnail Captions (`label`)**:
    *   Font size: `--q-font-size-xs` (e.g., `0.75rem` / `12px`).
    *   Font weight: `--q-font-weight-medium` (e.g., `500`).
    *   Color: `#ffffff` (fixed white for dark contrast over images).
    *   Line-height: `1.2`.
*   **Lightbox Caption**:
    *   Font size: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `600`).
    *   Color: `#ffffff`.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-reel-gap` | `16px` | Spacing gap between adjacent media thumbnails. |
| `--q-reel-columns-desktop` | `repeat(auto-fill, minmax(220px, 1fr))` | Column template layout in grid mode for desktop viewports. |
| `--q-reel-columns-mobile` | `repeat(auto-fill, minmax(140px, 1fr))` | Column template layout in grid mode for mobile viewports. |
| `--q-thumb-aspect-ratio` | `16 / 9` | Locked aspect ratio proportion for all thumbnails. |
| `--q-thumb-radius` | `var(--q-radius-md)` (8px) | Corner rounding of the thumbnail container. |
| `--q-thumb-border-color` | `transparent` | Border boundary color around each thumbnail. |
| `--q-thumb-border-highlight` | `2px solid var(--q-color-primary)` | Outline style when `highlighted` is active. |
| `--q-thumb-glow` | `var(--q-glow-interactive)` | Glowing shadow drop around a highlighted thumbnail. |
| `--q-bg-overlay` | `rgba(0, 0, 0, 0.85)` | Solid, high-opacity dimming backdrop for the media viewer. |
| `--q-lightbox-max-size` | `85%` | Max size bounds for the expanded media inside the viewer. |
| `--q-transition-normal` | `250ms ease` | Animation transition duration for hovers and fade-ins. |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

### A. Parent Container: `<q-reel>`
```tsx
@Component({
  tag: 'q-reel',
  styleUrl: 'q-reel.css',
  shadow: true,
})
export class QReel {
  @Prop() layout: 'grid' | 'carousel' = 'grid';
  @Prop() lightbox: boolean = true;

  @State() activeMedia: { src: string; label?: string; video: boolean; alt: string; triggerEl?: HTMLElement } | null = null;

  @Event() wqLightboxOpen: EventEmitter<void>;
  @Event() wqLightboxClose: EventEmitter<void>;
  @Element() el!: HTMLElement;

  private closeButtonRef?: HTMLButtonElement;
  private scrollContainer?: HTMLDivElement;

  @Listen('wqMaximize')
  handleThumbnailMaximize(event: CustomEvent) {
    if (!this.lightbox) return;
    this.activeMedia = event.detail;
    this.wqLightboxOpen.emit();
    
    // Defer focus shift to overlay close button
    setTimeout(() => {
      this.closeButtonRef?.focus();
    }, 50);
  }

  @Listen('keydown', { target: 'window' })
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (this.activeMedia && event.key === 'Escape') {
      this.closeLightbox();
    }
  }

  private closeLightbox = () => {
    const originalTrigger = this.activeMedia?.triggerEl;
    this.activeMedia = null;
    this.wqLightboxClose.emit();
    
    // Restore focus to thumbnail
    if (originalTrigger) {
      setTimeout(() => originalTrigger.focus(), 50);
    }
  };

  private handleTabTrap = (e: KeyboardEvent) => {
    if (!this.scrollContainer) return;
    
    if (e.key === 'Tab') {
      const overlay = this.scrollContainer.querySelector('.lightbox-overlay');
      if (!overlay) return;

      const focusables = Array.from(
        overlay.querySelectorAll('button, video, [tabindex="0"]')
      ) as HTMLElement[];
      if (focusables.length === 0) return;
      
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = this.el.shadowRoot?.activeElement || document.activeElement;

      if (e.shiftKey && activeEl === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && activeEl === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  render() {
    return (
      <div 
        class={{
          'reel-container': true,
          [`layout-${this.layout}`]: true
        }}
        ref={(el) => (this.scrollContainer = el)}
      >
        {/* Render Slotted Thumbnails */}
        <slot />

        {/* Custom Lightbox Overlay (OSR/CEF Safe & WAI-ARIA Compliant) */}
        {this.activeMedia && (
          <div 
            class="lightbox-overlay" 
            onClick={this.closeLightbox}
            onKeyDown={this.handleTabTrap}
            role="dialog"
            aria-modal="true"
            aria-label={this.activeMedia.label || 'Media Viewer'}
          >
            <button 
              class="lightbox-close" 
              onClick={this.closeLightbox} 
              aria-label="Close viewer"
              ref={(el) => (this.closeButtonRef = el)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div class="lightbox-content" onClick={(e) => e.stopPropagation()}>
              {this.activeMedia.video ? (
                <video class="lightbox-media" src={this.activeMedia.src} controls autoplay loop />
              ) : (
                <img class="lightbox-media" src={this.activeMedia.src} alt={this.activeMedia.alt} />
              )}
              
              {this.activeMedia.label && (
                <div class="lightbox-caption">
                  {this.activeMedia.label}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
```

### B. Child Item: `<q-thumbnail>`
```tsx
@Component({
  tag: 'q-thumbnail',
  styleUrl: 'q-thumbnail.css',
  shadow: true,
})
export class QThumbnail {
  @Prop() src: string = "";
  @Prop({ reflect: true }) video: boolean = false;
  @Prop() label?: string;
  @Prop() alt: string = "";
  @Prop({ reflect: true }) highlighted: boolean = false;

  @Element() el!: HTMLElement;

  @Event() wqMaximize: EventEmitter<{ src: string; label?: string; video: boolean; alt: string; triggerEl: HTMLElement }>;

  private handleTrigger = () => {
    this.wqMaximize.emit({
      src: this.src,
      label: this.label,
      video: this.video,
      alt: this.alt,
      triggerEl: this.el
    });
  };

  render() {
    return (
      <div 
        class={{
          'thumb-wrapper': true,
          'is-highlighted': this.highlighted,
          'is-video': this.video
        }}
        onClick={this.handleTrigger}
        role="button"
        tabindex="0"
        aria-label={this.label || this.alt || 'Media item'}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') this.handleTrigger(); }}
      >
        <div class="thumb-media-container">
          <img class="thumb-image" src={this.src} alt={this.alt} loading="lazy" />
          
          {this.video && (
            <div class="video-play-indicator">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          )}
        </div>

        {this.label && (
          <div class="thumb-caption">
            <span class="caption-text">{this.label}</span>
          </div>
        )}

        {/* Custom content overlay slot */}
        <slot />
      </div>
    );
  }
}
```

---

## 8. Component Styling (`q-reel.css` & `q-thumbnail.css`)

### A. Reel Container Layout Styles
```css
/* q-reel.css */
:host {
  display: block;
  box-sizing: border-box;
  width: 100%;
}

.reel-container {
  display: grid;
  box-sizing: border-box;
}

/* Grid Layout Mode */
.layout-grid {
  grid-gap: var(--q-reel-gap, 16px);
  grid-template-columns: var(--q-reel-columns-mobile, repeat(auto-fill, minmax(140px, 1fr)));
}

@media (min-width: 768px) {
  .layout-grid {
    grid-template-columns: var(--q-reel-columns-desktop, repeat(auto-fill, minmax(220px, 1fr)));
  }
}

/* Carousel Layout Mode */
.layout-carousel {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  gap: var(--q-reel-gap, 16px);
  padding-bottom: 8px;
}

.layout-carousel::-webkit-scrollbar {
  height: 6px;
}
.layout-carousel::-webkit-scrollbar-track {
  background: var(--q-bg-surface-1, #1f2937);
  border-radius: 3px;
}
.layout-carousel::-webkit-scrollbar-thumb {
  background: var(--q-bg-surface-3, #4b5563);
  border-radius: 3px;
}

.layout-carousel ::slotted(q-thumbnail) {
  flex: 0 0 auto;
  scroll-snap-align: start;
}

/* Fullscreen Lightbox Overlay (OSR/CEF Safe) */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--q-bg-overlay, rgba(0, 0, 0, 0.85));
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 40px;
  animation: fade-in var(--q-transition-normal, 250ms ease);
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: background var(--q-transition-normal, 250ms ease);
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightbox-close svg {
  width: 20px;
  height: 20px;
}

.lightbox-content {
  position: relative;
  max-width: var(--q-lightbox-max-size, 85%);
  max-height: var(--q-lightbox-max-size, 85%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-media {
  max-width: 100%;
  max-height: 80vh;
  border-radius: var(--q-radius-lg, 12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  object-fit: contain;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6);
}

.lightbox-caption {
  margin-top: 16px;
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-base, 1rem);
  font-weight: var(--q-font-weight-bold, 700);
  color: #ffffff;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: var(--q-radius-md, 8px);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### B. Thumbnail Component Styles
```css
/* q-thumbnail.css */
:host {
  display: block;
  box-sizing: border-box;
}

.thumb-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--q-thumb-radius, var(--q-radius-md, 8px));
  /* 2px border prevents visual frame jumping on highlight mode toggles */
  border: 2px solid var(--q-thumb-border-color, transparent);
  overflow: hidden;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  
  transition: transform var(--q-transition-normal, 250ms ease),
              box-shadow var(--q-transition-normal, 250ms ease),
              border-color var(--q-transition-normal, 250ms ease);
}

.thumb-wrapper:hover,
.thumb-wrapper:focus-visible {
  transform: scale(1.03);
  --q-thumb-border-color: var(--q-color-primary, #60a5fa);
  box-shadow: var(--q-shadow-medium, 0 8px 16px rgba(0,0,0,0.3));
}

/* Highlighted state styling */
.is-highlighted {
  --q-thumb-border-color: var(--q-color-primary, #60a5fa);
  box-shadow: var(--q-thumb-glow, var(--q-glow-interactive, 0 0 20px rgba(96,165,250,0.3)));
}

/* Media aspect ratio frame container */
.thumb-media-container {
  position: relative;
  width: 100%;
  aspect-ratio: var(--q-thumb-aspect-ratio, 16 / 9);
  background: var(--q-bg-surface-2, #374151);
  overflow: hidden;
}

.thumb-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--q-transition-normal, 250ms ease);
}

.thumb-wrapper:hover .thumb-image {
  transform: scale(1.05);
}

/* Video Play Overlay Indicator */
.video-play-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #ffffff;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition: background var(--q-transition-normal, 250ms ease), transform var(--q-transition-normal, 250ms ease);
}

.thumb-wrapper:hover .video-play-indicator {
  background: var(--q-color-primary, #60a5fa);
  transform: translate(-50%, -50%) scale(1.1);
}

.video-play-indicator svg {
  width: 16px;
  height: 16px;
  margin-left: 2px;
}

/* Caption Bottom Strip overlay */
.thumb-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0) 100%);
  padding: 12px 8px 8px 8px;
  box-sizing: border-box;
}

.caption-text {
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-xs, 0.75rem);
  font-weight: var(--q-font-weight-medium, 500);
  color: #ffffff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
```
