# 🧩 Component Specification: `q-step-diagram` & `q-step-diagram-item`

The `<q-step-diagram>` component acts as a generic connected-path progress flow diagram. It displays chronological activity logs, sequential configuration steps (wizards), or project milestones. It supports both vertical and horizontal layouts, dynamic line styles, and semantic state colors, rendering smoothly in Unreal Engine's Off-Screen Rendering (OSR) browser mode.

---

## 1. Component API (Properties & Attributes)

### A. Parent Container: `<q-step-diagram>`

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `layout` | `'vertical' \| 'horizontal'` | `'vertical'` | The direction of the progress flow path. |

### B. Child Item: `<q-step-diagram-item>`

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `status` | `'pending' \| 'active' \| 'completed' \| 'success' \| 'warning' \| 'danger'` | `'completed'` | The semantic status of the step. Updates the colors of the node circle and the trailing path line. |
| `lineStyle` | `'solid' \| 'dashed' \| 'dotted' \| 'none'` | `'solid'` | The stroke style of the path line leading to the next step. |
| `layout` | `'vertical' \| 'horizontal'` | `'vertical'` | Inherited layout direction (propagated from parent `<q-step-diagram>`). |

---

## 2. Slots (on `<q-step-diagram-item>`)

*   `badge`: Custom marker displayed inside the node circle (e.g. step numbers `1`, `2`, `3`, checkmark icons, user avatars, or glowing dots).
*   `title`: Header section for timestamps, dates, or milestone headings.
*   `default` (unnamed): Core content container for step descriptions, logs, or nested cards.

---

## 3. Events (on `<q-step-diagram-item>`)

*   `wqItemClick`: Emitted when the step item content or its badge node is clicked.

---

## 4. Visual Variants

The component uses parent-child attribute selectors to support multiple layout configurations:

### Variant A: Layout Alignment (`layout`)
*   **Vertical Flow (`'vertical'`)**: Standard chronological timeline. The connecting line runs vertically down the left side, and content boxes align on the right.
*   **Horizontal Flow (`'horizontal'`)**: Stepper wizard format. The connecting line runs horizontally across the top, and content boxes align below the nodes.

### Variant B: Line Connections (`lineStyle`)
*   **Solid**: Completed/active paths.
*   **Dashed / Dotted**: Future/pending paths or optional intermediate steps.
*   **None**: Last step in a sequence (automatically calculated or overridden).

### Variant C: Semantic Node Statuses (`status`)
*   **`completed` / `success`**: Represents a completed milestone. Node is filled with `--q-color-success` (green).
*   **`active`**: Represents the current task. Node is highlighted with `--q-color-primary` (electric blue) and features a subtle pulsating animation.
*   **`pending`**: Represents future tasks. Node is styled with a light border and transparent background.
*   **`warning` / `danger`**: Represents warnings or failed steps. Node is highlighted in orange or red (`--q-color-danger`).

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family`.
*   **Step Title (Title Slot)**:
    *   Font size: `--q-font-size-sm` (e.g., `0.875rem` / `14px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `600`).
    *   Color: `--q-fg-base` (with status-specific color accents).
*   **Body Content (Default Slot)**:
    *   Font size: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   Font weight: `--q-font-weight-normal` (e.g., `400`).
    *   Line-height: `1.5`.

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-step-diag-line` | `2px solid var(--q-border-color)` | Shorthand styling for the connecting path line. |
| `--q-step-diag-border` | `var(--q-border)` | Border outline style for step content boxes. |
| `--q-step-diag-icon-size`| `32px` | Height and width of the circle badge node. |
| `--q-step-diag-item-gap` | `24px` | Spacing gap separating adjacent steps. |
| `--q-color-success` | `#10b981` | Green status fill color. |
| `--q-color-primary` | `#60a5fa` | Blue accent color for active items. |
| `--q-color-danger` | `#ef4444` | Red status fill color. |
| `--q-transition-normal` | `250ms ease` | Timing of line/status animations. |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

### A. Parent Container: `<q-step-diagram>`
```tsx
@Component({
  tag: 'q-step-diagram',
  styleUrl: 'q-step-diagram.css',
  shadow: true,
})
export class QStepDiagram {
  @Prop() layout: 'vertical' | 'horizontal' = 'vertical';
  @Element() el!: HTMLElement;

  @Watch('layout')
  handleLayoutChange(newLayout: 'vertical' | 'horizontal') {
    this.propagateLayout(newLayout);
  }

  componentDidLoad() {
    this.propagateLayout(this.layout);
  }

  componentDidUpdate() {
    this.propagateLayout(this.layout);
  }

  private handleSlotChange = () => {
    this.propagateLayout(this.layout);
  };

  private propagateLayout(layoutVal: 'vertical' | 'horizontal') {
    const slot = this.el.shadowRoot?.querySelector('slot');
    const children = slot ? slot.assignedElements() : Array.from(this.el.children);
    children.forEach((child: any) => {
      if (child.tagName.toLowerCase() === 'q-step-diagram-item') {
        child.layout = layoutVal;
      }
    });
  }

  render() {
    return (
      <div class={{
        'step-diagram': true,
        [`layout-${this.layout}`]: true
      }}>
        <slot onSlotchange={this.handleSlotChange} />
      </div>
    );
  }
}
```

### B. Child Item: `<q-step-diagram-item>`
```tsx
@Component({
  tag: 'q-step-diagram-item',
  styleUrl: 'q-step-diagram-item.css',
  shadow: true,
})
export class QStepDiagramItem {
  @Prop({ reflect: true }) status: 'pending' | 'active' | 'completed' | 'success' | 'warning' | 'danger' = 'completed';
  @Prop({ reflect: true }) lineStyle: 'solid' | 'dashed' | 'dotted' | 'none' = 'solid';
  @Prop({ reflect: true }) layout: 'vertical' | 'horizontal' = 'vertical';
  @Element() el!: HTMLElement;

  @Event() wqItemClick: EventEmitter<void>;

  componentWillLoad() {
    const parent = this.el.closest('q-step-diagram');
    if (parent) {
      this.layout = parent.layout;
    }
  }

  private handleTrigger = (e: Event) => {
    e.stopPropagation();
    this.wqItemClick.emit();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.wqItemClick.emit();
    }
  };

  render() {
    return (
      <div 
        class={{
          'step-item': true,
          [`status-${this.status}`]: true,
          [`line-${this.lineStyle}`]: true,
          [`layout-${this.layout}`]: true
        }}
      >
        {/* Visual Line Path and Node Circle */}
        <div class="step-line-container">
          <div 
            class="step-badge" 
            onClick={this.handleTrigger} 
            onKeyDown={this.handleKeyDown}
            tabindex="0"
            role="button"
            aria-label={`Step status: ${this.status}`}
            part="badge"
          >
            <slot name="badge">
              <div class="badge-dot" />
            </slot>
          </div>
          <div class="step-connector" part="connector" />
        </div>

        {/* Content Box */}
        <div 
          class="step-content" 
          onClick={this.handleTrigger} 
          onKeyDown={this.handleKeyDown}
          tabindex="0"
          role="button"
          part="content"
        >
          <div class="step-title" part="title">
            <slot name="title" />
          </div>
          <div class="step-body" part="body">
            <slot />
          </div>
        </div>
      </div>
    );
  }
}
```

---

## 8. Component Styling (`q-step-diagram.css` & `q-step-diagram-item.css`)

### A. Parent Layout Styles
```css
/* q-step-diagram.css */
:host {
  display: block;
  box-sizing: border-box;
}

.step-diagram {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}

.layout-vertical {
  flex-direction: column;
}

.layout-horizontal {
  flex-direction: row;
  align-items: flex-start;
  overflow-x: auto;
}
```

### B. Item Layout & Path Styles
```css
/* q-step-diagram-item.css */
:host {
  display: block;
  box-sizing: border-box;
  flex: 1; /* For equal horizontal spacing */
}

.step-item {
  display: flex;
  box-sizing: border-box;
  position: relative;
}

/* Vertical Positioning (OSR safe host selectors) */
:host([layout="vertical"]) .step-item {
  flex-direction: row;
  padding-bottom: var(--q-step-diag-item-gap, 24px);
}

/* Horizontal Positioning (OSR safe host selectors) */
:host([layout="horizontal"]) .step-item {
  flex-direction: column;
  align-items: center;
  padding-right: var(--q-step-diag-item-gap, 24px);
}

/* Badge Circle Node */
.step-badge {
  position: relative;
  width: var(--q-step-diag-icon-size, 32px);
  height: var(--q-step-diag-icon-size, 32px);
  border-radius: 50%;
  background: var(--q-bg-surface-2, #374151);
  border: var(--q-step-diag-border, var(--q-border, 1px solid var(--q-border-color, #4b5563)));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  cursor: pointer;
  outline: none;
  
  transition: all var(--q-transition-normal, 250ms ease);
}

.step-badge:focus-visible {
  border-color: var(--q-color-primary, #60a5fa);
  box-shadow: 0 0 0 2px var(--q-color-primary, #60a5fa);
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--q-color-secondary, #9ca3af);
  transition: background var(--q-transition-normal, 250ms ease);
}

/* Connector Line Paths */
.step-line-container {
  display: flex;
  position: relative;
  align-items: center;
}

:host([layout="vertical"]) .step-line-container {
  flex-direction: column;
  width: var(--q-step-diag-icon-size, 32px);
}

:host([layout="horizontal"]) .step-line-container {
  flex-direction: row;
  width: 100%;
}

.step-connector {
  position: absolute;
  z-index: 1;
  border-color: var(--q-border-color, #4b5563);
  transition: border-color var(--q-transition-normal, 250ms ease);
}

/* Vertical Line path */
:host([layout="vertical"]) .step-connector {
  top: var(--q-step-diag-icon-size, 32px);
  left: calc(50% - 1px);
  height: 100%;
  border-left: var(--q-step-diag-line, 2px solid var(--q-border-color, #4b5563));
}

/* Horizontal Line path */
:host([layout="horizontal"]) .step-connector {
  left: var(--q-step-diag-icon-size, 32px);
  top: calc(50% - 1px);
  width: 100%;
  border-top: var(--q-step-diag-line, 2px solid var(--q-border-color, #4b5563));
}

/* Line Styles Overrides */
.line-dashed .step-connector { border-style: dashed; }
.line-dotted .step-connector { border-style: dotted; }
.line-none .step-connector { display: none; }

/* Status Color Mappings */
/* Completed / Success */
.status-completed .step-badge,
.status-success .step-badge {
  background: var(--q-color-success, #34d399);
  border-color: var(--q-color-success, #34d399);
}
.status-completed .badge-dot,
.status-success .badge-dot {
  background: var(--q-bg-base, #111827);
}
.status-completed .step-connector,
.status-success .step-connector {
  border-color: var(--q-color-success, #34d399);
}

/* Active status GPU-friendly pulse animation (opacity/scale overlay) */
.status-active .step-badge {
  background: var(--q-bg-surface-2, #374151);
  border-color: var(--q-color-primary, #60a5fa);
}
.status-active .badge-dot {
  background: var(--q-color-primary, #60a5fa);
}

.status-active .step-badge::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  border: 2px solid var(--q-color-primary, #60a5fa);
  opacity: 0;
  animation: active-pulse-gpu 2s infinite ease-out;
  pointer-events: none;
}

/* Content Box Styling */
.step-content {
  flex: 1;
  background: var(--q-bg-surface-1, #1f2937);
  border: var(--q-step-diag-border, var(--q-border, 1px solid var(--q-border-color, #4b5563)));
  border-radius: var(--q-radius-lg, 12px);
  padding: var(--q-padding-md, 16px);
  margin-left: var(--q-padding-md, 16px);
  cursor: pointer;
  outline: none;
  
  transition: all var(--q-transition-normal, 250ms ease);
}

:host([layout="horizontal"]) .step-content {
  margin-left: 0;
  margin-top: var(--q-padding-md, 16px);
  width: 100%;
}

.step-content:hover,
.step-content:focus-visible {
  border-color: var(--q-color-primary, #60a5fa);
  transform: translateY(-2px);
  box-shadow: var(--q-shadow-low, 0 2px 4px rgba(0,0,0,0.1));
}

/* Content Text Typographies */
.step-title {
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-sm, 0.875rem);
  font-weight: var(--q-font-weight-bold, 700);
  color: var(--q-color-primary, #60a5fa);
  margin-bottom: 4px;
}

.step-body {
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-base, 1rem);
  font-weight: var(--q-font-weight-normal, 400);
  color: var(--q-fg-base, #f9fafb);
}

/* GPU Optimized Scale and Opacity pulse */
@keyframes active-pulse-gpu {
  0% {
    transform: scale(0.95);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}
```
