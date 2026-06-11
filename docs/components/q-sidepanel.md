# 🧩 Component Specification: `q-sidepanel`

The `<q-sidepanel>` is a customizable slide-out drawer component. It slides in from any screen edge (left, right, top, or bottom) to host navigation, playlist grids, or settings panels. It uses standard 2D translation transforms and a lightweight semi-transparent backdrop layer to remain completely glitch-free inside Unreal Engine's Off-Screen Rendering (OSR) browser context.

---

## 1. Component API (Properties & Attributes)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `open` | `boolean` | `false` | Controls the visibility of the side panel. |
| `side` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | The edge of the screen from which the panel slides in. |
| `panelSize` | `string` | `"320px"` | The width (for left/right) or height (for top/bottom) of the panel drawer. |

---

## 2. Slots

*   `header`: Optional header slot for titles, branding, or custom close buttons.
*   `default` (unnamed): Core content container for nested lists, widgets, or forms.

---

## 3. Events

*   `qClose`: Emitted when the user requests to close the panel (by clicking the backdrop or an internal close trigger).

---

## 4. Visual Variants

The component handles stateful layout adjustments to support three visual configurations:

### Variant A: Slide Sides (`side`)
*   **Left / Right Panels**: The drawer occupies 100% height of the screen and stretches horizontally matching the `panelSize` property. Slides on the X-axis (`transform: translateX()`).
*   **Top / Bottom Panels**: The drawer occupies 100% width of the screen and stretches vertically matching the `panelSize` property. Slides on the Y-axis (`transform: translateY()`).

### Variant B: Animation States (`open`)
*   **Closed State**: The panel rests outside the browser viewport boundaries using 100% translation offsets. The background backdrop is set to `opacity: 0` and blocks pointer clicks.
*   **Open State**: The panel slides smoothly into view (`transform: translate(0)`). The backdrop fades in to a semi-transparent dim overlay (`opacity: 1`) and registers click triggers to close the drawer.

### Variant C: Backdrop Overlay (Unreal Safe)
*   **Behavior**: Avoids complex background blur filters (`backdrop-filter`) which fail to render in Unreal CEF, instead using a standard dark-dim overlay.
*   **Styling**: Uses a simple dark backdrop color (`rgba(0, 0, 0, 0.5)`) to focus the user's attention on the side panel.

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family`.
*   **Header Slot Text**:
    *   Font size: `--q-font-size-lg` (e.g., `1.125rem` / `18px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `600`).
    *   Line-height: `1.4`.
*   **Drawer Body Content (Default Slot)**:
    *   Font size: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   Font weight: `--q-font-weight-normal` (e.g., `400`).
    *   Line-height: `1.5`.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-panel-bg` | `var(--q-bg-surface-1)` | Panel drawer background color (dark slate). |
| `--q-panel-border` | `var(--q-border)` | Edge separator border line. |
| `--q-panel-shadow` | `var(--q-shadow-high)` | Shadow depth applied on the drawer border. |
| `--q-panel-transition-duration`| `var(--q-transition-normal)` (250ms) | Slide animation duration. |
| `--q-transition-normal` | `250ms ease` | Normal easing transition timing function. |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-sidepanel',
  styleUrl: 'q-sidepanel.css',
  shadow: true,
})
export class QSidepanel {
  @Prop({ reflect: true }) open: boolean = false;
  @Prop({ reflect: true }) side: 'left' | 'right' | 'top' | 'bottom' = 'right';
  @Prop() panelSize: string = "320px";

  @Event() qClose: EventEmitter<void>;

  private drawerEl?: HTMLDivElement;
  private previousActiveElement: HTMLElement | null = null;

  @Watch('open')
  handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.previousActiveElement = document.activeElement as HTMLElement;
      setTimeout(() => {
        this.drawerEl?.focus();
      }, 50);
    } else if (this.previousActiveElement) {
      setTimeout(() => this.previousActiveElement?.focus(), 50);
    }
  }

  @Listen('keydown', { target: 'window' })
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (this.open && event.key === 'Escape') {
      this.handleClose();
    }
  }

  private handleClose = () => {
    this.qClose.emit();
  };

  private getFocusableElements(): HTMLElement[] {
    if (!this.drawerEl) return [];
    
    const selector = 'button, [href], input, select, textarea, [tabindex="0"]';
    const focusables: HTMLElement[] = [];

    const traverse = (node: Node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as HTMLElement;

      if (el.matches(selector) && !(el as any).disabled) {
        focusables.push(el);
      }

      if (el.tagName.toLowerCase() === 'slot') {
        const slot = el as HTMLSlotElement;
        slot.assignedElements({ flatten: true }).forEach(assigned => traverse(assigned));
      } else {
        const children = Array.from(el.childNodes);
        children.forEach(child => traverse(child));
      }
    };

    traverse(this.drawerEl);
    return focusables;
  }

  private handleTabTrap = (e: KeyboardEvent) => {
    if (!this.open || !this.drawerEl) return;
    
    if (e.key === 'Tab') {
      const focusables = this.getFocusableElements();
      
      if (focusables.length === 0) return;
      
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = this.el?.shadowRoot?.activeElement || document.activeElement;

      if (e.shiftKey && activeEl === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && activeEl === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  @Element() el!: HTMLElement;

  render() {
    const classes = {
      'sidepanel-wrapper': true,
      'is-open': this.open,
      [`side-${this.side}`]: true
    };

    // Bind size via CSS custom properties so layout sizes are customizable via CSS stylesheets
    const customSizeStyle = {
      '--q-panel-width': this.panelSize
    };

    return (
      <div class={classes} onKeyDown={this.handleTabTrap}>
        {/* Semi-transparent Backdrop Overlay */}
        <div 
          class="sidepanel-backdrop" 
          onClick={this.handleClose}
          part="backdrop"
        />

        {/* Sliding Panel Drawer */}
        <div 
          ref={(el) => (this.drawerEl = el)}
          class="sidepanel-drawer" 
          style={customSizeStyle}
          part="drawer"
          role="dialog"
          aria-modal="true"
          aria-hidden={this.open ? 'false' : 'true'}
          tabindex="-1"
        >
          {/* Header Slot (Optional title and close btn) */}
          <div class="drawer-header" part="header">
            <slot name="header" />
          </div>

          {/* Core Content Slot */}
          <div class="drawer-body" part="body">
            <slot />
          </div>
        </div>
      </div>
    );
  }
}
```

---

## 8. Component Styling (`q-sidepanel.css`)

```css
:host {
  display: block;
  box-sizing: border-box;
}

/* Base Wrapper stretches over full viewport when open */
.sidepanel-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  
  display: flex;
  pointer-events: none; /* Allows click-throughs when closed */
  overflow: hidden;
  box-sizing: border-box;
}

.sidepanel-wrapper.is-open {
  pointer-events: auto; /* Restricts click-throughs when active */
}

/* Semi-transparent Backdrop Dim Overlay */
.sidepanel-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--q-bg-overlay, rgba(0, 0, 0, 0.5)); /* Safe OSR solid transparency fallback */
  opacity: 0;
  transition: opacity var(--q-panel-transition-duration, var(--q-transition-normal, 250ms ease)) cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.is-open .sidepanel-backdrop {
  opacity: 1;
}

/* Sliding Drawer Panel Base styling */
.sidepanel-drawer {
  position: absolute;
  background: var(--q-panel-bg, var(--q-bg-surface-1, #1f2937));
  box-shadow: var(--q-panel-shadow, var(--q-shadow-high, 0 16px 32px rgba(0,0,0,0.12)));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  outline: none;
  
  /* Unreal OSR-Safe 2D slide-out animations */
  transition: transform var(--q-panel-transition-duration, var(--q-transition-normal, 250ms ease)) cubic-bezier(0.4, 0, 0.2, 1);
}

/* Slide Edges Positioning & Translations */
/* Left Edge */
.side-left .sidepanel-drawer {
  top: 0;
  left: 0;
  width: var(--q-panel-width, 320px);
  height: 100vh;
  border-right: var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151)));
  transform: translateX(-100%);
}
.side-left.is-open .sidepanel-drawer {
  transform: translateX(0);
}

/* Right Edge */
.side-right .sidepanel-drawer {
  top: 0;
  right: 0;
  width: var(--q-panel-width, 320px);
  height: 100vh;
  border-left: var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151)));
  transform: translateX(100%);
}
.side-right.is-open .sidepanel-drawer {
  transform: translateX(0);
}

/* Top Edge */
.side-top .sidepanel-drawer {
  top: 0;
  left: 0;
  width: 100vw;
  height: var(--q-panel-width, 320px);
  border-bottom: var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151)));
  transform: translateY(-100%);
}
.side-top.is-open .sidepanel-drawer {
  transform: translateY(0);
}

/* Bottom Edge */
.side-bottom .sidepanel-drawer {
  bottom: 0;
  left: 0;
  width: 100vw;
  height: var(--q-panel-width, 320px);
  border-top: var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151)));
  transform: translateY(100%);
}
.side-bottom.is-open .sidepanel-drawer {
  transform: translateY(0);
}

/* Header Typography */
.drawer-header {
  padding: var(--q-padding-lg, 24px);
  border-bottom: var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151)));
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-lg, 1.125rem);
  font-weight: var(--q-font-weight-bold, 700);
  line-height: 1.4;
  color: var(--q-fg-base, #f9fafb);
}

/* Body Content container */
.drawer-body {
  flex: 1;
  padding: var(--q-padding-lg, 24px);
  overflow-y: auto;
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-base, 1rem);
  font-weight: var(--q-font-weight-normal, 400);
  line-height: 1.5;
  color: var(--q-fg-base, #f9fafb);
}
```
```
