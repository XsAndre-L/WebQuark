# 🎮 Unreal Engine Webview (WebUI/CEF) Compatibility Guide

When developing web components or user interfaces destined for Unreal Engine's Webview plugins (which use Chromium Embedded Framework - CEF in Off-Screen Rendering mode), you must avoid specific CSS properties, HTML elements, and Web APIs. 

Below is the complete list of elements and properties to avoid to prevent rendering glitches, black boxes, layout transparency, or engine crashes.

---

## 1. CSS Properties to Avoid

### ❌ `backdrop-filter`
*   **The Glitch**: Renders as either a black box, a completely transparent (invisible) panel, or causes a rendering thread crash.
*   **Why**: OSR (Off-Screen Rendering) renders Webview layouts to a memory texture rather than the screen buffer. The browser compositor cannot fetch the pixels of the 3D game scene *behind* it to apply the blur filter.
*   **Alternative**: Use high-opacity fallback background colors (`rgba(..., 0.85)`).

### ❌ `mix-blend-mode` & `background-blend-mode`
*   **The Glitch**: Blends render as solid black, solid white, or are completely ignored.
*   **Why**: Offscreen textures do not support standard browser compositing blend math against underlying rendering layers.
*   **Alternative**: Implement pre-blended colors or use alpha opacity (`rgba` / `hsla`) to simulate transparency.

### ❌ `filter: drop-shadow()`
*   **The Glitch**: Causes severe frame rate drops (lag) or fails to render entirely.
*   **Why**: Drop-shadow filters require expensive GPU pixel processing passes on the offscreen canvas texture.
*   **Alternative**: Use standard `box-shadow` which uses optimized browser box approximations.

### ❌ 3D Transforms (`translate3d`, `rotate3d`, `perspective`)
*   **The Glitch**: Elements flicker, clip through boundaries, or fail to redraw when updated via JavaScript.
*   **Why**: OSR sometimes struggles to resolve 3D layer compositing boundaries in hardware acceleration mode.
*   **Alternative**: Use standard 2D transforms (`transform: translate() scale() rotate()`).

### ❌ Container Queries (`@container`)
*   **The Glitch**: Layouts fail to adapt or get stuck in default states.
*   **Why**: Unreal CEF versions are often several versions behind mainline Google Chrome, meaning newer specifications like container queries are unsupported.
*   **Alternative**: Use standard Media Queries (`@media`).

---

## 2. HTML Elements to Avoid

### ❌ HTML5 `<video>` (DRM/Protected Streams)
*   **The Glitch**: Renders as a solid green, blue, or black block with audio only.
*   **Why**: Standard CEF builds lack proprietary video codecs (like H.264/AAC) and DRM modules (like Widevine) due to licensing restrictions.
*   **Alternative**: Use open codecs like WebM/VP8, or host videos via standard unencrypted HTTP streams.

### ❌ Native `<dialog>` Element
*   **The Glitch**: The modal backdrop (`::backdrop`) renders as a solid black cover over the entire screen, blocking all UI interaction.
*   **Why**: Screen-centering calculations and overlays can fail or miscalculate the viewport boundaries in OSR.
*   **Alternative**: Build custom modals using standard absolute `<div>` containers.

### ❌ Heavy WebGL `<canvas>` Contexts
*   **The Glitch**: Causes the entire Unreal Engine editor or game client to crash (GPU Driver Crash).
*   **Why**: Initializing a heavy WebGL canvas inside CEF creates a nested OpenGL context that competes with Unreal's DX12/Vulkan rendering loop.
*   **Alternative**: Keep canvas work to lightweight 2D contexts (`canvas.getContext('2d')`).

---

## 3. Web APIs to Avoid

### ❌ Secure X-Frame Iframes
*   **The Glitch**: The iframe is completely blank or throws SECURE_CONNECTION errors.
*   **Why**: CEF lacks the typical redirection and cookie permission handlers found in standalone Chrome, meaning frames with strict security headers will block loading.
*   **Alternative**: Fetch data via REST API and render it inside native components instead of nesting external sites.

### ❌ SMIL SVG Animations (`<animate>`, `<animateTransform>`)
*   **The Glitch**: SVG elements freeze at frame 0 or fail to scale.
*   **Why**: XML-based SVG animation rendering is CPU-heavy and deprecated or broken in older CEF packages.
*   **Alternative**: Animate SVGs using standard CSS keyframe animations (e.g. `transform: rotate()`).

---

## 4. Specific Component Design Guidelines

### 🟢 Dropdowns (`q-dropdown`)
*   **Guideline**: Do **not** use the native HTML `<select>` tag. Native dropdown selectors render as OS-level overlay windows, which are invisible or detached in off-screen rendering.
*   **Build pattern**: Build the select menu using custom HTML structures (a click `<button>` trigger displaying an absolute-positioned `<ul>` options panel).

### 🟢 Sidepanels (`q-sidepanel`)
*   **Guideline**: Do **not** use 3D hardware-accelerated transforms (`translate3d`) or shifting positions (`right: -320px` to `right: 0`), as they trigger continuous repaints and frame drops.
*   **Build pattern**: Use lightweight 2D translation offsets (`transform: translateX(100%)` to `transform: translateX(0)`) and standard `rgba` backdrops (no `backdrop-filter`).

### 🟢 Inputs & Textareas (`q-input` / `q-textarea`)
*   **Guideline**: Do **not** use custom content-editable `<div>` components for text fields, as CEF focus capture events fail to register keyboard focus bridges from Unreal Engine.
*   **Build pattern**: Wrap native `<input>` and `<textarea>` elements inside the component shadow DOM, and apply styles to them directly.

