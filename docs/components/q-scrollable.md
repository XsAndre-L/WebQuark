# 🧩 Component Specification: `q-scrollable`

> Contract note: see [Current public contracts](./current-contracts.md#q-scrollable) and the [generated API](../../src/components/layout/scrollable/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

The `<q-scrollable>` is a layout wrapper component that provides highly customizable scrollbars. It supports two modes: a custom-styled, overlay scrollbar (custom mode) and native scrollbar overrides (native mode). It includes pointer drag listeners, scroll progress tracking, auto-hide dynamics, and mobile touch responsive fallbacks, making it perfect for Unreal Engine CEF layouts.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `height` | `height` | `string` | `'100%'` | Fixed height layout boundary of the scroll wrapper (reflected). |
| `maxHeight` | `max-height` | `string` | `''` | Maximum height boundary constraint (reflected). |
| `autoHide` | `auto-hide` | `boolean` | `true` | When `true`, automatically fades the custom scrollbar out when not scrolling or hovered. |
| `nativeOnMobile` | `native-on-mobile` | `boolean` | `true` | When `true`, falls back to native scrolling on touch-coarse mobile devices. |
| `mode` | `mode` | `"custom" \| "native"` | `'custom'` | Scrollbar type. `'custom'` renders custom overlays, `'native'` styles browser defaults. |
| `target` | `target` | `string` | `''` | CSS selector mapping to target parents/containers for native scrollbar styling. |

### Methods

*   `scrollToBottom() => Promise<void>`: Programmatically scrolls the viewport container to the bottom.
*   `scrollToPosition(top: number) => Promise<void>`: Programmatically scrolls the viewport to a specific vertical offset.

---

## 2. Slots

*   `default` (unnamed): Receives the content nodes that require vertical scrolling.

---

## 3. Events

*   `qScroll`: Emitted when the user scrolls the viewport. The payload carries: `{ scrollTop: number; scrollHeight: number; clientHeight: number; }`.

---

## 4. Visual Variants

The component supports distinct layout modes:

### Variant A: Custom Overlay Scrollbar (`mode="custom"`)
*   Hides native browser scrollbars entirely. Renders absolute-positioned scroll tracks (`.q-scrollbar-track`) and custom drag thumbs (`.q-scrollbar-thumb`).
*   **Drag State**: Clicking and dragging the thumb activates pointer captures, applying pointer lock cursors and selected background glow states (`.is-dragging`).
*   **Auto-Hide**: Fades out track visibility (`opacity: 0`) after 1.5 seconds of inactivity. Hovering the container wrapper reveals it again.

### Variant B: Native Scrollbar Overrides (`mode="native"`)
*   Enables standard native browser scroll viewports, but styles native scrollbars using CSS scrollbar-color and Webkit scrollbar pseudo-classes.
*   If `target` selector is provided, the component dynamically injects style overrides into that target element's parent tree instead.

### Variant C: Mobile Coarse Fallback (`nativeOnMobile="true"`)
*   On touch screens, custom overlay elements are hidden (`display: none`), and native scrolling is restored to ensure smooth hardware inertia touch scrolling.

---

## 5. Typography & Font Styles

*   The component is a structural wrapper and does not impose typography constraints on slotted children.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-bg-surface-3` | `#4b5563` | Custom scrollbar thumb base background color. |
| `--q-color-primary` | `#3b82f6` | Scrollbar thumb hover and selection background color. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **Custom Drag Pointer Capture**: Custom scroll thumb dragging relies on HTML5 pointer capture events (`setPointerCapture` and `releasePointerCapture`). Under CEF OSR, ensure mouse coordinates and drag thresholds map correctly to the game viewport frame rate.
*   **Custom scrollbar hidden rules**: Standard scrollbars are safely hidden from CEF using Webkit scrollbar rules (`::-webkit-scrollbar { display: none; }`).
*   **No Backdrop Filters**: Tracks and thumbs use solid alpha colors, avoiding backdrop filters which cause rendering thread crashes in OSR.
*   **ResizeObserver Support**: Custom track scales are recalculated dynamically via `ResizeObserver`. Modern CEF browsers correctly execute these handlers.

---

## 9. Developer Guidelines & Examples

### Custom Scrollbar Wrapper
```html
<q-scrollable height="300px">
  <div style="padding: 20px;">
    <h2>Long Document Title</h2>
    <p>Paragraph 1...</p>
    <p>Paragraph 2...</p>
    <p>Paragraph 3...</p>
    <p>Paragraph 4...</p>
    <p>Paragraph 5...</p>
  </div>
</q-scrollable>
```

### Native Target Scrollbar Customization
```html
<div id="parent-layout" style="height: 400px; overflow: auto;">
  <!-- Native layout content -->
</div>

<!-- Stylizes the parent-layout container native scrollbar -->
<q-scrollable mode="native" target="#parent-layout"></q-scrollable>
```

### Programmatic Scroll listener
```html
<q-scrollable id="chat-scroller" height="400px">
  <div id="chat-messages"></div>
</q-scrollable>

<script>
  const scroller = document.getElementById('chat-scroller');
  
  scroller.addEventListener('qScroll', (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.detail;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      console.log('User is near the bottom of chat!');
    }
  });

  // Programmatically jump to bottom
  function addNewMessage(txt) {
    document.getElementById('chat-messages').innerHTML += `<p>${txt}</p>`;
    scroller.scrollToBottom();
  }
</script>
```
