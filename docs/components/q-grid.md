# q-grid

`q-grid` arranges content in a responsive grid constrained by a maximum column count.

**Component tag:** `<q-grid>`

**Working preview:** Run `bun start` from the repository root, open the [existing playground](http://localhost:3333), then select **Layout → Grid**. The examples below use temporary fixtures in this same registered runtime.

**On this page**

- [Quick start](#quick-start)
- [Examples](#examples)
- [Behavior & accessibility](#behavior--accessibility)
- [Styling](#styling)
- [API reference](#api-reference)

## Quick start

1. Follow the central [installation instructions](../../README.md#1-install-library).
2. Add registration to your application entry file (`main.js`). This requires a bundler that resolves package imports and CSS imports.

```javascript
import '@webquark/browser/dist/webquark/webquark.css';
import { defineCustomElements } from '@webquark/browser/loader';

defineCustomElements();
```

3. Add this markup to the application page after setup.

```html
<q-grid columns="2" min-item-width="16rem" gap="lg">
  <q-card><h3>Plan</h3><p>Choose the next milestone.</p></q-card>
  <q-card><h3>Build</h3><p>Complete the implementation.</p></q-card>
  <q-card data-q-span="full"><h3>Review</h3><p>Check the result together.</p></q-card>
</q-grid>
```

**Result:** two columns when at least 32rem plus the gap fits; Review spans the full last row.

### At a glance

| Capability | Options | Default |
| :--- | :--- | :--- |
| [Spacing](#sizes) | gap plus independent row-gap/column-gap | lg (16px) |
| [Columns](#state-and-interaction) | 1–4 maximum; container-fitting | 2 |
| [Full rows](#slots) | data-q-span="full" on direct children | Normal cells |

**With no properties:** `<q-grid></q-grid>` renders an empty layout container with no visible content, background, border, landmark, or tab stop. It needs slotted children; gap alone does not create visible spacing.

**Playground preset:** The playground supplies form fields as demonstration content.

## Examples

These examples share the registration above. Place each complete snippet in the application page; scripts use module syntax. Screenshots show the real component in the playground runtime with the shared dark theme.

### Fit cards to the available space

A grid places two cards beside each other and one across the full row.

![A grid places two cards beside each other and one across the full row](./assets/q-grid-composition.png)

```html
<q-grid columns="2" min-item-width="16rem" gap="lg">
  <q-card><h3>Plan</h3><p>Choose the next milestone.</p></q-card>
  <q-card><h3>Build</h3><p>Complete the implementation.</p></q-card>
  <q-card data-q-span="full"><h3>Review</h3><p>Check the result together.</p></q-card>
</q-grid>
```

### Fit the same grid into a narrow panel

The same grid reduces to one column in a narrow container.

![The same grid reduces to one column in a narrow container](./assets/q-grid-narrow.png)

```html
<div style="max-width:300px">
<q-grid columns="2" min-item-width="16rem" gap="lg">
  <q-card><h3>Plan</h3><p>Choose the next milestone.</p></q-card>
  <q-card><h3>Build</h3><p>Complete the implementation.</p></q-card>
  <q-card data-q-span="full"><h3>Review</h3><p>Check the result together.</p></q-card>
</q-grid>
</div>
```

Responsive fitting uses the container width, not a viewport breakpoint.

## Behavior & accessibility

### State and interaction

The layout uses auto-fit grid tracks. columns defaults 2 and caps the intended count; minItemWidth defaults 16rem. Narrow containers reduce the count. A direct child with data-q-span="full" spans every track. Items align at the top; differing field label heights do not synchronize input baselines.

Rendering converts columns with Number, uses 2 for zero/NaN/empty, then clamps 1–4. Values below 1 render the 1-column calculation; Infinity becomes 4 and −Infinity becomes 1. Fractional inputs are not rounded even though the public type only accepts integers. The supplied property is not mutated. Invalid minItemWidth CSS can invalidate the grid track declaration; use a CSS length.

Spacing is resolved through the shared theme tokens. Unknown spacing names fall back to 1rem unless the application defines the matching token. Properties update rendering without modifying child properties.

### Keyboard and focus

The layout has no keyboard handlers or added tab stop. Child controls retain their normal focus order; visual wrapping does not reorder the DOM.

### Labels and announcements

No role, heading, accessible name, or live region is added. Use semantic content or an outer labelled section/form where needed.

### Forms

The layout has no form value and is not a form owner. Form controls remain the application’s responsibility; WebQuark form traversal supports these wrappers.

### Limitations and compatibility

This primitive adds no background, elevation, or animation. Grid counts respond to width, minimum sizing, gaps, and how many cells are present. No component-specific compatibility claim or assistive-technology test is implied.

## Styling

Use spacing and column sizing properties for layout.

### Sizes

| Value | Default spacing |
| :--- | :--- |
| `none` | 0 (0px at a 16px root) |
| `xs` | 0.25rem (4px at a 16px root) |
| `sm` | 0.5rem (8px at a 16px root) |
| `md` | 0.75rem (12px at a 16px root) |
| `lg` | 1rem (16px at a 16px root) |
| `xl` | 1.5rem (24px at a 16px root) |
| `2xl` | 2rem (32px at a 16px root) |
| `3xl` | 3rem (48px at a 16px root) |

Rem values scale with the root font size. row-gap and column-gap override gap independently; absent values inherit gap.

### Custom styling

```html
<q-grid class="spaced-content" gap="lg">
  <span>First item</span><span>Second item</span>
</q-grid>
<style>
  q-grid.spaced-content { --q-space-lg: 1.25rem; }
  q-grid.spaced-content::part(layout) { padding: 8px; }
</style>
```

Layout properties are assigned inline to the part and normally win over ordinary part CSS for those same properties. Use the exposed properties/tokens for gap/alignment. Token overrides inherit to descendants; scope them intentionally. See [CSS variables](#css-variables), [Shadow Parts](#shadow-parts), and [Foundation](../foundation.md).

## API reference

See the [Stencil-generated API](../../src/browser/components/layout/grid/readme.md) and [component source](../../src/browser/components/layout/grid/grid.tsx). The tables below include source-level types and effective rendering constraints.

### Properties

All properties are optional and are listed alphabetically.

| Name | Default | Description |
| :--- | :--- | :--- |
| `columnGap` | `undefined` | Column spacing token; undefined uses gap.<br>**Type:** `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'`. **HTML attribute:** `column-gap`. **Required:** No. |
| `columns` | `2` | Maximum intended column count (1, 2, 3, 4). Actual number fits available width and minItemWidth.<br>**Type:** `1 \| 2 \| 3 \| 4`. **HTML attribute:** `columns`. **Required:** No. |
| `gap` | `'lg'` | Shared row/column spacing token.<br>**Type:** `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'`. **HTML attribute:** `gap`. **Required:** No. |
| `minItemWidth` | `'16rem'` | CSS minimum preferred item width; capped at container width to avoid a fixed minimum overflow.<br>**Type:** `string`. **HTML attribute:** `min-item-width`. **Required:** No. |
| `rowGap` | `undefined` | Row spacing token; undefined uses gap.<br>**Type:** `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'`. **HTML attribute:** `row-gap`. **Required:** No. |



### Slots

| Name | Description |
| :--- | :--- |
| Default (unnamed) | Layout items; no fallback. Only direct slotted children with data-q-span="full" span all columns. |

### Events

This component emits no public events.

### Methods

This component exposes no public methods.

### Styling hooks

Defaults below include the imported shared stylesheet; `var(...)` values follow the active theme. Component-specific hooks and the shared tokens they consume are listed. For shared setup, see [Theme variables](../theme_variables.md).

#### CSS variables

| Name | Default | Controls |
| :--- | :--- | :--- |
| `--q-space-2xl` | `2rem` | Spacing value used when the corresponding gap token is selected; shared token inherited by descendants. |
| `--q-space-3xl` | `3rem` | Spacing value used when the corresponding gap token is selected; shared token inherited by descendants. |
| `--q-space-lg` | `1rem` | Spacing value used when the corresponding gap token is selected; shared token inherited by descendants. |
| `--q-space-md` | `0.75rem` | Spacing value used when the corresponding gap token is selected; shared token inherited by descendants. |
| `--q-space-none` | `0rem` | Spacing value used when the corresponding gap token is selected; shared token inherited by descendants. |
| `--q-space-sm` | `0.5rem` | Spacing value used when the corresponding gap token is selected; shared token inherited by descendants. |
| `--q-space-xl` | `1.5rem` | Spacing value used when the corresponding gap token is selected; shared token inherited by descendants. |
| `--q-space-xs` | `0.25rem` | Spacing value used when the corresponding gap token is selected; shared token inherited by descendants. |

#### Shadow Parts

| Name | Targets |
| :--- | :--- |
| `layout` | Always-rendered internal grid container. |
