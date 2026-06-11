# 🧩 Component Specification: `q-circular-progress`

The `<q-circular-progress>` is an SVG-driven, reactive circular progress indicator. It displays a progress ring with smooth fill animations and a centered text label. It is built in a highly modular, lightweight fashion without heavy JavaScript charting library dependencies.

---

## 1. Component API (Properties & Attributes)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `number` | `0` | The progress percentage from `0` to `100`. |
| `label` | `string` | `undefined` | Optional centered text label. If not provided, it falls back to displaying `${value}%`. |
| `indeterminate` | `boolean` | `false` | When `true`, the progress ring spins continuously (infinite spinner state) and ignores the `value` property. |

---

## 2. Visual Variants

The component adapts its styling and behavior dynamically to cover four distinct display variants:

### Variant A: Standard Percentage Ring
*   **Behavior**: Displays the progress `value` inside the center of the ring, formatted as a percentage (e.g., `"75%"`).
*   **Styling**: Employs standard brand primary fill (`--q-progress-fill-color`) and standard borders.

### Variant B: Custom Text Label
*   **Behavior**: Replaces the percentage with custom short phrases (e.g., `"Done"`, `"LOCKED"`, `"Active"`).
*   **Styling**: Automatically scales the typography inside the ring to ensure the text remains centered and does not overflow the circular boundaries.

### Variant C: Indeterminate Spinner
*   **Behavior**: Used for loading indicators. The progress ring fills to exactly 25% and performs an infinite rotation animation.
*   **Styling**: Utilizes `--q-transition-normal` duration timings for smooth, hardware-friendly 2D spin transforms (safe for Unreal OSR).

### Variant D: Semantic Status Rings
*   **Behavior**: Color shifts to represent positive, warning, or error states.
*   **Styling**: The progress fill color is mapped to standard semantic tokens (`--q-color-success`, `--q-color-warning`, `--q-color-danger`) by passing a class or overriding `--q-progress-fill-color`.

---

## 3. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family`.
*   **Center Label Text**:
    *   Font size: `--q-progress-font-size` (defaults to `--q-font-size-lg`, e.g., `1.125rem` / `18px`).
    *   Font weight: `--q-progress-font-weight` (defaults to `--q-font-weight-bold`, e.g., `600`).
    *   Text Anchor: `middle` (SVG property to force perfect horizontal centering).
    *   Dominant Baseline: `central` (SVG property to force perfect vertical centering).
    *   Fill Color: Inherits `--q-fg-base` (adapts to light/dark themes).

---

## 4. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-progress-size` | `120px` | Outer width and height of the circular container. |
| `--q-progress-stroke-width` | `8px` | Thickness of the background track and active fill rings. |
| `--q-progress-linecap` | `round` | Line ending style (`round` for modern rounded endpoints, `butt` for sharp borders). |
| `--q-progress-track-color` | `var(--q-border-color)` | Background inactive track circle color. |
| `--q-progress-fill-color` | `var(--q-color-primary)` | Active progress percentage ring color. |
| `--q-progress-font-size` | `var(--q-font-size-lg)` | Font size of the central label. |
| `--q-progress-font-weight`| `var(--q-font-weight-bold)` | Font weight of the central label. |
| `--q-progress-animation-duration`| `1s` | Timeline duration for the fill animation. |
| `--q-transition-normal` | `250ms cubic-bezier(...)` | Normal transition speed for text modifications. |

---

## 5. HTML/TSX Structure (Shadow DOM Layout)

The component utilizes math to calculate the circumference of the circle (`2 * Math.PI * radius`) and applies `stroke-dashoffset` dynamically to draw the percentage ring:

```tsx
@Component({
  tag: 'q-circular-progress',
  styleUrl: 'q-circular-progress.css',
  shadow: true,
})
export class QCircularProgress {
  @Prop() value: number = 0;
  @Prop() label?: string;
  @Prop() indeterminate: boolean = false;

  render() {
    const size = 120; // Internal SVG viewBox size coordinate
    const radius = 52; // Center radius (leaving safety margin for stroke width)
    const circumference = 2 * Math.PI * radius;
    
    // Clamp progress value between 0 and 100
    const clampedValue = Math.min(Math.max(this.value, 0), 100);
    const strokeDashoffset = this.indeterminate 
      ? circumference * 0.75 // 25% filled for spinner
      : circumference - (clampedValue / 100) * circumference;

    const displayLabel = this.label !== undefined ? this.label : `${clampedValue}%`;

    return (
      <div 
        class={{
          'progress-container': true,
          'is-indeterminate': this.indeterminate
        }}
        role="progressbar"
        aria-valuenow={this.indeterminate ? undefined : clampedValue}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={this.label || 'Circular Progress'}
      >
        <svg class="progress-svg" viewBox={`0 0 ${size} ${size}`}>
          {/* Group rotated -90deg so circles start at 12 o'clock, leaving text unrotated (OSR safe) */}
          <g class="progress-ring-circles">
            {/* Background Inactive Track */}
            <circle
              class="progress-track"
              cx={size / 2}
              cy={size / 2}
              r={radius}
            />
            {/* Foreground Active Ring */}
            <circle
              class="progress-fill"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke-dasharray={circumference}
              stroke-dashoffset={strokeDashoffset}
            />
          </g>
          {/* Centered Label text (rendered horizontally without rotation vectors) */}
          {!this.indeterminate && (
            <text
              class="progress-text"
              x="50%"
              y="50%"
              style={displayLabel.length > 5 ? { fontSize: `calc(var(--q-progress-font-size, var(--q-font-size-lg, 1.125rem)) * ${5 / displayLabel.length})` } : {}}
            >
              {displayLabel}
            </text>
          )}
        </svg>
      </div>
    );
  }
}
```

---

## 6. Component Styling (`q-circular-progress.css`)

```css
:host {
  display: inline-block;
  width: var(--q-progress-size, 120px);
  height: var(--q-progress-size, 120px);
  box-sizing: border-box;
}

.progress-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.progress-svg {
  width: 100%;
  height: 100%;
}

/* Rotates only the circle layers to 12 o'clock (prevents text rendering glitches in OSR) */
.progress-ring-circles {
  transform: rotate(-90deg);
  transform-origin: center;
}

/* Inactive circle track */
.progress-track {
  fill: none;
  stroke: var(--q-progress-track-color, var(--q-border-color, #374151));
  stroke-width: var(--q-progress-stroke-width, 8px);
}

/* Active progress circle */
.progress-fill {
  fill: none;
  stroke: var(--q-progress-fill-color, var(--q-color-primary, #60a5fa));
  stroke-width: var(--q-progress-stroke-width, 8px);
  stroke-linecap: var(--q-progress-linecap, round);
  
  /* Unreal Engine OSR safe animation: simple CSS transition property */
  transition: stroke-dashoffset var(--q-progress-animation-duration, 1s) cubic-bezier(0.4, 0, 0.2, 1);
}

/* Central Text Label (unrotated and sharp) */
.progress-text {
  fill: var(--q-fg-base, #f9fafb);
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-progress-font-size, var(--q-font-size-lg, 1.125rem));
  font-weight: var(--q-progress-font-weight, var(--q-font-weight-bold, 700));
  text-anchor: middle;
  dominant-baseline: central;
  
  transition: fill var(--q-transition-normal, 250ms ease);
}

/* Indeterminate infinite loading spinner (OSR safe 2D rotation of circles only) */
.is-indeterminate .progress-ring-circles {
  animation: q-spin 1.4s linear infinite;
}

@keyframes q-spin {
  0% {
    transform: rotate(-90deg);
  }
  100% {
    transform: rotate(270deg);
  }
}
```
