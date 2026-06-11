# 📋 WebQuark Planned Components Tracker

This document tracks the implementation of generic Web Components (Custom Elements) being ported from the DecaFrame UI to the **WebQuark** Stencil library.

For details on available theme styles and customization, see the [CSS Theme Variables Reference](file:///D:/Dev/WebApps/WebQuark/docs/theme_variables.md).
For rendering constraints and practices to prevent glitches inside game engines, see the [Unreal Engine Webview Compatibility Guide](file:///D:/Dev/WebApps/WebQuark/docs/unreal_compatibility.md).

---

## Component Checklist

### 1. `q-card` (Generic UI Card Container)
A glassmorphic-styled layout card with shadow encapsulation.
*   [ ] **Setup Directory & Core Files**: `src/components/q-card/` (tsx, css)
*   [ ] **Properties**:
    *   `elevation` (`'low' | 'medium' | 'high'`) — Shadow depth level.
    *   `interactive` (`boolean`) — Enables hover lift and scale animations.
*   [ ] **Slots**:
    *   `header` — Slot for header text or action controls.
    *   `default` — Default slot for core body contents.
*   [ ] **Styling**: Scoped glassmorphic backdrop filter and borders using WebQuark design tokens.

### 2. `q-step-diagram` & `q-step-diagram-item` (Universal Step & Progress Flow)
A generic connected-path diagram component that displays sequential data (logs, setup wizard steps, milestone roadmaps) in horizontal or vertical layouts.
*   [ ] **Setup Directory & Core Files**: `src/components/q-step-diagram/` and `src/components/q-step-diagram-item/`
*   [ ] **Properties (on `q-step-diagram`)**:
    *   `layout` (`'vertical' | 'horizontal'`) — The layout alignment path direction (defaults to `'vertical'`).
*   [ ] **Properties (on `q-step-diagram-item`)**:
    *   `status` (`'pending' | 'active' | 'completed' | 'success' | 'warning' | 'danger'`) — Semantic status mapping. Shifting paths and node badge colors.
    *   `lineStyle` (`'solid' | 'dashed' | 'dotted' | 'none'`) — Stroke style connecting to the next node (defaults to `'solid'`).
*   [ ] **Events (on `q-step-diagram-item`)**:
    *   `itemClick` — Emitted when a step node or item card is clicked.
*   [ ] **Slots (on `q-step-diagram-item`)**:
    *   `badge` — Custom marker (step number, user avatar, status icon, or glowing dot).
    *   `title` — Slot for date, timestamp, or step title header.
    *   `default` — Main body event content.


### 3. `q-reel` & `q-thumbnail` (Media Grid & Lightbox Viewer)
A generic carousel and grid system holding clickable media thumbnails that support a built-in zoom/lightbox view on click.
*   [ ] **Setup Directory & Core Files**: `src/components/q-reel/` and `src/components/q-thumbnail/`
*   [ ] **Properties (on `q-thumbnail`)**:
    *   `src` (`string`) — Image/video media source URL.
    *   `label` (`string`) — Translucent text caption overlayed on the thumbnail.
    *   `highlighted` (`boolean`) — Applies an active glowing border frame (defaults to `false`).
*   [ ] **Events (on `q-thumbnail`)**:
    *   `wqMaximize` — Emitted when a thumbnail is clicked to request a full-screen lightbox zoom.
*   [ ] **Features (on `q-reel`)**:
    *   [ ] Auto-listening and catching click events from child `<q-thumbnail>` elements to dynamically pop open a centered fullscreen media overlay (lightbox).


### 4. `q-circular-progress` (Circular Progress Diagram)
An SVG-driven reactive circular progress ring with fill animations.
*   [ ] **Setup Directory & Core Files**: `src/components/q-circular-progress/`
*   [ ] **Properties**:
    *   `value` (`number`) — Progress percentage (0 to 100).
    *   `label` (`string`) — Custom text label centered inside (falls back to value%).
    *   `stroke` (`string`) — Color code or class reference for progress ring gradient.
*   [ ] **Styling**: SVG layout with reactive stroke-dasharray properties.

### 5. `q-button` (Premium Custom Button)
A highly customizable button element designed to match our design system. Renders as a standard `<button>` or as an anchor `<a>` if `href` is supplied, with built-in loading spinners, press interactions, and layout sizing.
*   [ ] **Setup Directory & Core Files**: `src/components/q-button/` (tsx, css)
*   [ ] **Properties**:
    *   `variant` (`'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'text'`) — Visual hierarchy theme (defaults to `'primary'`).
    *   `size` (`'sm' | 'md' | 'lg'`) — Button layout height and padding (defaults to `'md'`).
    *   `disabled` (`boolean`) — HTML standard disabled state (defaults to `false`).
    *   `loading` (`boolean`) — Disables button and replaces label with a loading spinner (defaults to `false`).
    *   `type` (`'button' | 'submit' | 'reset'`) — Form execution behavior (defaults to `'button'`).
    *   `expand` (`boolean`) — Makes the button span full container width (defaults to `false`).
    *   `href` (`string`) — Optional target URL. If supplied, the component renders as an `<a>` anchor tag styled as a button.
    *   `target` (`string`) — Link open target (e.g. `'_blank'`), only used with `href`.
    *   `download` (`string`) — Triggers file download, only used with `href`.
*   [ ] **Slots**:
    *   `icon-left` — Optional slot for prefix icons/SVGs.
    *   `icon-right` — Optional slot for suffix icons/SVGs.
    *   `default` — Inner button label text.
*   [ ] **Styling**: Scoped glassmorphic hover shadows, active-state tactile scale down (`scale(0.97)`), and spinner SVG animations.

### 6. `q-input` (Text Input Field)
A premium text input component with custom borders, floating label behavior, prefix/suffix icon support, validation feedback, and clear button.
*   [ ] **Setup Directory & Core Files**: `src/components/q-input/` (tsx, css)
*   [ ] **Properties**:
    *   `value` (`string`) — Current text value of the input.
    *   `type` (`'text' | 'password' | 'email' | 'number' | 'url' | 'search'`) — Input type (defaults to `'text'`).
    *   `placeholder` (`string`) — Secondary text hint.
    *   `label` (`string`) — Floating header label.
    *   `disabled` (`boolean`) — Disable input actions.
    *   `error` (`string`) — Error message text (shows red border and validation feedback when populated).
    *   `clearable` (`boolean`) — Displays a clear button when text exists.
*   [ ] **Events**:
    *   `qChange` — Emitted when the input value changes.
    *   `qInput` — Emitted on every keypress.
*   [ ] **Slots**:
    *   `prefix` — Slot for prefix elements/icons.
    *   `suffix` — Slot for suffix elements/icons.

### 7. `q-textarea` (Text Area Field)
An expandable multi-line text input field supporting auto-resizing.
*   [ ] **Setup Directory & Core Files**: `src/components/q-textarea/` (tsx, css)
*   [ ] **Properties**:
    *   `value` (`string`) — Current text area value.
    *   `placeholder` (`string`) — Text placeholder.
    *   `label` (`string`) — Header label.
    *   `rows` (`number`) — Initial line height rows (defaults to `3`).
    *   `autoGrow` (`boolean`) — Automatically increases height to fit text content (defaults to `true`).
    *   `disabled` (`boolean`) — Disable typing.
    *   `error` (`string`) — Error message string.
*   [ ] **Events**:
    *   `qChange` — Emitted on value commit.
    *   `qInput` — Emitted on keypress.

### 8. `q-dropdown` (Custom Select Dropdown)
A fully custom select dropdown menu using WebComponents shadow layout to ensure matching aesthetics and smooth expansion transitions.
*   [ ] **Setup Directory & Core Files**: `src/components/q-dropdown/` (tsx, css)
*   [ ] **Properties**:
    *   `value` (`string`) — Current selected option value.
    *   `label` (`string`) — Header label.
    *   `placeholder` (`string`) — Prompt when no option is selected.
    *   `options` (`{ label: string; value: string }[]`) — Array of selectable items.
    *   `disabled` (`boolean`) — Disables dropdown opening.
*   [ ] **Events**:
    *   `wqSelect` — Emitted when a new option is chosen.

### 9. `q-sidepanel` (Slide-Out Drawer)
A panel drawer that slides out from the screen edges (left, right, top, bottom) to host options, playlists, or controls.
*   [ ] **Setup Directory & Core Files**: `src/components/q-sidepanel/` (tsx, css)
*   [ ] **Properties**:
    *   `open` (`boolean`) — Controls drawer visibility.
    *   `side` (`'left' | 'right' | 'top' | 'bottom'`) — Direction from which the panel slides in (defaults to `'right'`).
    *   `size` (`string`) — Custom panel width or height (defaults to `'320px'`).
*   [ ] **Events**:
    *   `qClose` — Emitted when the panel backdrop is clicked or closed.
*   [ ] **Slots**:
    *   `header` — Optional header section.
    *   `default` — Core body content.

### 10. `q-carousel` (Generic Horizontal Scroll Slider)
A generic layout container that scrolls slotted children horizontally with touch drag and snapping.
*   [ ] **Setup Directory & Core Files**: `src/components/q-carousel/` (tsx, css)
*   [ ] **Properties**:
    *   `snapAlignment` (`'start' | 'center' | 'end' | 'none'`) — Item alignment point for scroll snapping.
    *   `showArrows` (`boolean`) — Enables layout navigation arrows (prev/next).
    *   `showIndicators` (`boolean`) — Shows active progress slide dots underneath.
    *   `itemWidth` (`string`) — Custom CSS width bounds to align child layout elements.
*   [ ] **Events**:
    *   `wqSlideChange` — Emitted when the carousel center/start viewport focus shifts.



