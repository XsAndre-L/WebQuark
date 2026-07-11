# 🧩 Component Specification: `q-reel`

> Contract note: see [Current public contracts](./current-contracts.md#q-reel), the [generated API](../../src/components/media/reel/readme.md), and the separate [q-thumbnail guide](./q-thumbnail.md). Generated API wins if an older design note below differs.

The `<q-reel>` and `<q-thumbnail>` components collaborate to create a premium, modular media showcase grid or horizontal gallery (carousel) that supports a built-in media viewer (lightbox). It is specifically optimized to avoid rendering bugs inside Unreal Engine's Off-Screen Rendering (OSR) environments.

---

## 1. Component API (Properties & Attributes)

### A. Parent Reel Container: `<q-reel>`

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `layout` | `layout` | `"grid" \| "carousel"` | `'grid'` | Visual arrangement of the thumbnails. `'grid'` wraps items into a multi-column responsive layout. `'carousel'` aligns them horizontally with a scrollbar. |
| `lightbox` | `lightbox` | `boolean` | `true` | When `true`, clicking a thumbnail automatically opens the fullscreen media viewer overlay. |

### B. Child Thumbnail: `<q-thumbnail>`

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `src` | `src` | `string` | `""` | Image or video media source URL. |
| `video` | `video` | `boolean` | `false` | Marks the thumbnail as a video. If `true`, a play button overlay is drawn. |
| `label` | `label` | `string` | `undefined` | Translucent text caption displayed at the bottom of the thumbnail. |
| `alt` | `alt` | `string` | `""` | Alternate text description for screen readers and accessibility. |
| `highlighted` | `highlighted` | `boolean` | `false` | Applies an active glowing accent border frame. |

---

## 2. Slots

### A. Parent Container: `<q-reel>`
*   `default` (unnamed): Receives the list of `<q-thumbnail>` items.

### B. Child Thumbnail: `<q-thumbnail>`
*   `default` (unnamed): Optional custom overlays or text content to show on top of the image container.

---

## 3. Events

### A. Child Thumbnail: `<q-thumbnail>`
*   `qMaximize`: Emitted when the thumbnail is clicked. The event payload carries the thumbnail's data: `{ src: string; label?: string; video: boolean; alt: string; triggerEl: HTMLElement }`.

### B. Parent Reel: `<q-reel>`
*   `qLightboxOpen`: Emitted when the fullscreen media overlay opens.
*   `qLightboxClose`: Emitted when the fullscreen media overlay is closed.

---

## 4. Visual Variants

The components change layout and animations based on properties and active states:

### Variant A: Reel Layouts (`layout`)
*   **Grid Flow (`layout="grid"`)**: Displays items in a responsive grid that automatically wraps based on screen width using CSS grid columns (`--q-reel-columns-desktop` and `--q-reel-columns-mobile`).
*   **Carousel Flow (`layout="carousel"`)**: Displays items in a single, non-wrapping horizontal row with smooth horizontal scroll snapping.

### Variant B: Highlighted State (`highlighted`)
*   When a thumbnail has `highlighted="true"`, it renders a constant glowing border using `--q-thumb-border-color` and `--q-thumb-glow` to indicate that it is actively selected, running, or featured.

### Variant C: Fullscreen Lightbox Overlay
*   When a thumbnail is clicked and `lightbox` is active, a fullscreen overlay container (`.lightbox-overlay`) is dynamically rendered directly within the shadow root of `<q-reel>`.
*   **CEF OSR Compatibility**: Instead of using the native `<dialog>` element (which can lock viewports and render black screens in game UI overlays) or `backdrop-filter: blur()`, the lightbox overlay uses a high-opacity solid backdrop (`rgba(0, 0, 0, 0.85)` via `--q-bg-overlay`) to dim the viewport.
*   **Controls**: Features close and navigation control buttons designed using custom SVGs. Keyboard arrows (`ArrowLeft` / `ArrowRight`) slide items.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family` (e.g., system font).
*   **Thumbnail Captions (`label`)**:
    *   Font size: `--q-font-size-xs` (e.g., `0.75rem` / `12px`).
    *   Font weight: `--q-font-weight-medium` (e.g., `500`).
    *   Color: `#ffffff` (fixed white for dark contrast over images).
    *   Line-height: `1.2` (with ellipsis clamp clipping).
*   **Lightbox Caption**:
    *   Font size: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `700`).
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
| `--q-thumb-radius` | `var(--q-radius-md, 8px)` | Corner rounding of the thumbnail container. |
| `--q-thumb-border-color` | `transparent` | Border boundary color around each thumbnail. |
| `--q-thumb-glow` | `var(--q-glow-interactive, 0 0 20px rgba(96,165,250,0.3))` | Glowing shadow drop around a highlighted thumbnail. |
| `--q-bg-overlay` | `rgba(0, 0, 0, 0.85)` | Solid, high-opacity dimming backdrop for the media viewer. |
| `--q-lightbox-max-size` | `85%` | Max size bounds for the expanded media inside the viewer. |
| `--q-transition-normal` | `250ms ease` | Animation transition duration for hovers and fade-ins. |
| `--q-color-primary` | `#60a5fa` | Primary color applied to highlighted borders and video icon hovers. |
| `--q-bg-surface-2` | `#374151` | Fallback background color for thumbnail media loaders. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **Custom Lightbox Modal (No `<dialog>` Element)**: Native HTML `<dialog>` elements suffer from overlay and positioning miscalculations under CEF OSR, frequently rendering as opaque black viewports. `<q-reel>` prevents this by assembling the fullscreen overlay using standard HTML `<div>` nodes structured absolute inside the shadow DOM.
*   **No Backdrop Blur**: The media viewer overlay backdrop uses a solid high-opacity color (`rgba(0, 0, 0, 0.85)` via `--q-bg-overlay`) instead of `backdrop-filter: blur(...)`. This prevents major OSR performance degradation or WebUI rendering thread crashes.
*   **2D Image Scale Transitions**: Hovering thumbnails triggers standard 2D vector zooms (`transform: scale(1.03)` on the wrapper, and `scale(1.05)` on the internal `.thumb-image`). This works smoothly and avoids clipping or redrawing errors.
*   **Focus Restoring**: When closing the lightbox overlay, the component restores focus to the previously active `<q-thumbnail>` trigger element, ensuring focus tracking behaves correctly on the game UI framework.
*   **Video Codecs**: Video thumbnails rendered in lightbox mode require the CEF container to support the underlying video codec. CEF configurations without proprietary video codecs (like H.264) will fail to render native `<video>` elements. Consider standard WebM/VP8 formats for video source assets.

---

## 9. Developer Guidelines & Examples

### Basic Media Grid Layout
```html
<q-reel layout="grid">
  <q-thumbnail src="/media/img1.jpg" alt="First scene description" label="Introduction Scene"></q-thumbnail>
  <q-thumbnail src="/media/video1.mp4" video alt="Cinematic trailer" label="Cinematic Trailer"></q-thumbnail>
  <q-thumbnail src="/media/img2.jpg" alt="Final artwork" label="Ending Screen" highlighted></q-thumbnail>
</q-reel>
```

### Programmatic Lightbox Listeners
```html
<q-reel id="gallery-reel" layout="carousel">
  <q-thumbnail src="/media/scene1.jpg" label="Act 1"></q-thumbnail>
  <q-thumbnail src="/media/scene2.jpg" label="Act 2"></q-thumbnail>
</q-reel>

<script>
  const reel = document.getElementById('gallery-reel');
  
  reel.addEventListener('qLightboxOpen', () => {
    console.log('Lightbox overlay has opened!');
  });

  reel.addEventListener('qLightboxClose', () => {
    console.log('Lightbox overlay closed, restoring game focus.');
  });
</script>
```
