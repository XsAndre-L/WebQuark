# q-stack

`q-stack` arranges content in a vertical stack with consistent spacing.

**Component tag:** `<q-stack>`

**Working preview:** Run `bun start` from the repository root, open the [existing playground](http://localhost:3333), then select **Layout → Stack**. The examples below use temporary fixtures in this same registered runtime.

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
import '@webquark/core/dist/webquark/webquark.css';
import { defineCustomElements } from '@webquark/core/loader';

defineCustomElements();
```

3. Add this markup to the application page after setup.

```html
<q-stack gap="lg">
  <q-card><h3>Plan</h3><p>Choose the next milestone.</p></q-card>
  <q-card><h3>Build</h3><p>Complete the implementation.</p></q-card>
</q-stack>
```

**Result:** two full-width cards separated by 16px.

### At a glance

| Capability | Options | Default |
| :--- | :--- | :--- |
| [Spacing](#sizes) | Eight spacing tokens | lg (16px) |
| [Alignment](#alignment) | stretch, start, center, end | stretch |
| [Content](#slots) | Default slot | Empty |

**With no properties:** `<q-stack></q-stack>` renders an empty layout container with no visible content, background, border, landmark, or tab stop. It needs slotted children; gap alone does not create visible spacing.

**Playground preset:** The playground supplies cards as demonstration content.

## Examples

These examples share the registration above. Place each complete snippet in the application page; scripts use module syntax. Screenshots show the real component in the playground runtime with the shared dark theme.

### Group related content

A stack spaces two related cards vertically.

![A stack spaces two related cards vertically](./assets/q-stack-composition.png)

```html
<q-stack gap="lg">
  <q-card><h3>Plan</h3><p>Choose the next milestone.</p></q-card>
  <q-card><h3>Build</h3><p>Complete the implementation.</p></q-card>
</q-stack>
```

## Behavior & accessibility

### State and interaction

Items follow DOM order vertically. align=stretch fills available width by default; start, center, and end use cross-axis alignment without stretching.

Spacing is resolved through the shared theme tokens. Unknown spacing names fall back to 1rem unless the application defines the matching token. Properties update rendering without modifying child properties.

### Keyboard and focus

The layout has no keyboard handlers or added tab stop. Child controls retain their normal focus order; visual wrapping does not reorder the DOM.

### Labels and announcements

No role, heading, accessible name, or live region is added. Use semantic content or an outer labelled section/form where needed.

### Forms

The layout has no form value and is not a form owner. Form controls remain the application’s responsibility; WebQuark form traversal supports these wrappers.

### Limitations and compatibility

This primitive adds no background, elevation, or animation. Unknown alignment/distribution strings are passed to inline CSS and follow browser invalid-value behavior. No component-specific compatibility claim or assistive-technology test is implied.

## Styling

Use spacing and alignment properties for layout.

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

Rem values scale with the root font size. Gap is applied between items, with no outer padding.

### Alignment

`align` accepts stretch, start, center, end. Default stretch; start/center/end align the item widths within the stack.

### Custom styling

```html
<q-stack class="spaced-content" gap="lg">
  <span>First item</span><span>Second item</span>
</q-stack>
<style>
  q-stack.spaced-content { --q-space-lg: 1.25rem; }
  q-stack.spaced-content::part(layout) { padding: 8px; }
</style>
```

Layout properties are assigned inline to the part and normally win over ordinary part CSS for those same properties. Use the exposed properties/tokens for gap/alignment. Token overrides inherit to descendants; scope them intentionally. See [CSS variables](#css-variables), [Shadow Parts](#shadow-parts), and [Foundation](../foundation.md).

## API reference

See the [Stencil-generated API](../../src/components/layout/stack/readme.md) and [component source](../../src/components/layout/stack/stack.tsx). The tables below include source-level types and effective rendering constraints.

### Properties

All properties are optional and are listed alphabetically.

| Name | Default | Description |
| :--- | :--- | :--- |
| `align` | `'stretch'` | Cross-axis item alignment: stretch, start, center, end.<br>**Type:** `'stretch' \| 'start' \| 'center' \| 'end'`. **HTML attribute:** `align`. **Required:** No. |
| `gap` | `'lg'` | Vertical spacing token between items.<br>**Type:** `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'`. **HTML attribute:** `gap`. **Required:** No. |



### Slots

| Name | Description |
| :--- | :--- |
| Default (unnamed) | Layout items; no fallback. Each direct slotted child is one flex item. |

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
| `layout` | Always-rendered internal flex container. |
