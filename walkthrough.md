# Mobile Responsiveness Implementation Walkthrough

This document outlines the detailed steps and design decisions taken to make the WebQuark Component Playground mobile-responsive under 900px width.

## 1. HTML Markup Additions

Two structural changes were introduced in `src/index.html` to support drawer structures:
- **Sidebar Backdrop element**: Added `<div class="sidebar-backdrop" id="sidebarBackdrop"></div>` right at the start of `<body>` to act as a dark dimmed screen overlay when either the sidebar drawer or the knobs bottom-sheet is open.
- **Hamburger toggle**: Added `<button class="hamburger-menu" id="hamburgerMenu">` inside `.app-header` right before the logo text. It contains three horizontal bars (`.hamburger-line`) that animate when active.
- **Knobs Panel Header**: Added `<div class="knobs-panel-header">` at the top of the knobs panel, containing a title and `#knobsCloseBtn` to close the sheet.
- **Knobs Toggle Button**: Added `<button id="knobsToggleBtn" class="knobs-toggle-btn">` floating action button at the bottom of the body.

## 2. CSS Styles & Media Query (`@media (max-width: 900px)`)

The following CSS definitions are managed in the playground:
- **Hamburger Menu & Backdrop**: Styled default and active states with transitions:
  - Backdrop implements a `blur(4px)` backdrop filter with opacity transitions.
  - Hamburger lines rotate and translate to form an "X" when the `.open` class is applied.
- **Drawer Transformation**: Under `900px`, the `.sidebar` changes from a static layout column to `position: fixed` spanning full height below the header, translated to `translateX(-100%)`. Toggling the `.open` class translates it back to `translateX(0)`.
- **Sandbox Vertical Stacking**: Flex direction for `.sandbox-layout` changes to `column`.
- **Knobs Panel Bottom-Sheet**: Under `900px`, `.knobs-panel` is fixed to the bottom of the screen with a height of `60vh`, sliding off-screen (`translateY(100%)`) and sliding up when `.open` class is applied.
- **Stage Container compacting**: Scaled padding to `20px` and min-height to `320px`.
- **Horizontal Scrollable Tabs**: Styled `.tabs-bar` to stack items vertically, setting `.tab-buttons` to `overflow-x: auto` and `.tab-btn` to `flex-shrink: 0`. Scrollbars are hidden on webkit-based browsers for an app-like navigation feel.
- **Single-column Grid**: `.variants-grid` scales down to a single column template.

## 3. Text Selection Prevention (user-select)

To keep UI components behaving like native applications, `user-select: none` and `-webkit-user-select: none` are applied to:
- **Playground UI components in `src/index.html`**:
  - Logo, sub-tabs bar, buttons, section headers, badges, sidebar items, and controls toggles.
- **Component Classes**:
  - `.btn` in `q-button.css`
  - `.drawer-header` and `.sidepanel-backdrop` in `q-sidepanel.css`
  - `.arrow-btn` and `.indicator-dot` in `q-carousel.css`
  - `.thumb-wrapper` in `q-thumbnail.css`

## 4. JavaScript Interaction Wiring

The script block was upgraded to support drawer lifecycle states:
- **Sidebar helpers**: `openSidebar()`, `closeSidebar()`, and `toggleSidebar()` handle opening/closing sidebar elements, synchronizing the backdrop.
- **Knobs helpers**: `openKnobs()`, `closeKnobs()`, and `toggleKnobs()` manage bottom-sheet state and synchronize the backdrop.
- **Event Listeners**:
  - Registered click handlers on `#hamburgerMenu` and `#knobsToggleBtn` to toggle active panels.
  - Registered click handlers on `#sidebarBackdrop` and `#knobsCloseBtn` to close active drawers.
  - Configured `#sidebarBackdrop` click handler to close both the sidebar and knobs panel.
  - Bound auto-closing of sidebar and knobs panels to component switches (`selectComponent(tag)`) and theme switches (`themeToggle`).
  - Synced `#knobsToggleBtn` visibility so it only displays when the "Interactive Sandbox" tab is active.

## 5. QScrollable Component Architectural Design

The `<q-scrollable>` component is a hybrid scroll container designed to provide a smooth, customized scrolling experience while keeping native performance:
- **Viewport Layout**: The component wraps elements in an `.q-scrollable-viewport` container with a nested `.q-scrollable-content` element. A `ResizeObserver` monitors size changes of both the viewport and content wrapper to dynamically update the custom scrollbar thumb height according to $\text{Thumb Height} = (\text{Viewport ClientHeight}^2) / \text{Viewport ScrollHeight}$.
- **Performance-Throttled Updates**: During scroll events, thumb translations (`translateY`) are calculated and applied using CSS transforms wrapped in a `requestAnimationFrame` block to avoid layout thrashing.
- **Drag Handling**: Using pointer capture (`setPointerCapture`) on the custom thumb, the viewport position is updated programmatically on `pointermove`. Smooth scroll behavior is bypassed during dragging to maintain tight pointer synchronization.
- **Mobile Fallback**: To support touch devices, custom overlays are hidden (`display: none`) and native scrollbars are restored in the viewport when `nativeOnMobile` is enabled.
- **Auto-Hide (Fade-on-Idle)**: The custom scrollbar transitions its opacity to 0 after 1.5s of inactivity. It instantly returns to opacity 1 when scrolling, hovering, or dragging.
- **Native Style Injection**: In `'native'` mode, the custom scrollbar elements are hidden. A style block (`<style>`) is dynamically created and injected into either the parent element or a custom selector `target` element. This style block targets native scrollbar pseudo-elements (`::-webkit-scrollbar` etc.) to match our design theme, and is fully cleaned up when the component is destroyed.
- **Sandbox Integration**: The component is integrated in the registry with variants testing custom mode, native mode, max-height, and edge-cases like empty content or long text lines. The `qScroll` event is also registered for dispatches logging in the sandbox.

## 6. Build Verification

The Stencil build was executed to compile the modified HTML, CSS, components, and loader files:
```cmd
$ npm run build
...
build finished in 3.25 s
```
The compilation successfully compiled all targets without any syntax errors.

