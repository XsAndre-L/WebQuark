# q-accordion

`q-accordion` is a public content scaffold that currently projects consumer-owned content without disclosure behavior.

**Component tag:** `<q-accordion>`

**Working preview:** There is no permanent q-accordion preset. Run `bun start`, open the [existing playground](http://localhost:3333), and use its browser console to insert the example markup into the page after registration. The examples below were executed as temporary fixtures in that runtime.

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
<q-accordion>
  <h3>Delivery</h3>
  <p>Orders arrive within five working days.</p>
  <h3>Returns</h3>
  <p>Contact support for return instructions.</p>
</q-accordion>
```

**Result:** both headings and both answers are visible; nothing collapses.

### At a glance

| Capability | Options | Default |
| :--- | :--- | :--- |
| [Content](#slots) | Default slot | Empty |
| [Reserved options](#state-and-interaction) | single, multiple | Declared only; no visual effect |

**With no properties:** `<q-accordion></q-accordion>` is an empty block with `min-width: 0`; it shows no text, control, or placeholder.

## Examples

These examples share the registration above. Place each complete snippet in the application page; scripts use module syntax. Screenshots show the real component in the playground runtime with the shared dark theme.

### Display static grouped content

The scaffold displays both answers as ordinary content.

![The scaffold displays both answers as ordinary content](./assets/q-accordion-content.png)

```html
<q-accordion>
  <h3>Delivery</h3>
  <p>Orders arrive within five working days.</p>
  <h3>Returns</h3>
  <p>Contact support for return instructions.</p>
</q-accordion>
```

The headings are not disclosure buttons. `mode="single"` does not hide either answer.

## Behavior & accessibility

### State and interaction

This is a scaffold. `mode` reflects to an attribute but does not create disclosures, item coordination, or open state. Changing, emptying, or supplying an unrecognized property value does not activate additional behavior.

### Keyboard and focus

The host has no added tab stop or keyboard handler. Slotted links and controls retain native behavior.

### Labels and announcements

The scaffold creates no role, heading, accessible name, or live region. Supply semantic headings and labels in the content. Do not expose it as an accordion to users until your application implements the actual disclosure pattern.

### Limitations and compatibility

The public props reserve future behavior; the current implementation is only slots and a block host. No automatic form value, events, focus management, or motion is provided.

## Styling

There are currently no implemented variants, size presets, tones, component CSS variables, or Shadow Parts. Reserved properties in [Properties](#properties) have no visual effect.

### Custom styling

Use ordinary host and light-DOM CSS for consumer presentation.

```html
<q-accordion class="content-shell"><p>Consumer content</p></q-accordion>
<style>
  q-accordion.content-shell { padding: 16px; border: 1px solid #64748b; }
  q-accordion.content-shell > p { margin: 0; }
</style>
```

See the empty [CSS-variable](#css-variables) and [Shadow-Part](#shadow-parts) inventories, and central [theme setup](../theme_variables.md).

## API reference

See the [Stencil-generated API](../../src/browser/components/data-display/accordion/readme.md) and [component source](../../src/browser/components/data-display/accordion/accordion.tsx). The tables below include source-level types and effective rendering constraints.

### Properties

All properties are optional and are listed alphabetically.

| Name | Default | Description |
| :--- | :--- | :--- |
| `mode` | `'single'` | Reserved disclosure mode; single and multiple currently have identical behavior.<br>**Type:** `'single' \| 'multiple'`. **HTML attribute:** `mode`. **Required:** No. |



### Slots

| Name | Description |
| :--- | :--- |
| Default (unnamed) | Consumer-owned content; no fallback and no built-in item requirements. |

### Events

This component emits no public events.

### Methods

This component exposes no public methods.

### Styling hooks

Defaults below include the imported shared stylesheet; `var(...)` values follow the active theme. Component-specific hooks and the shared tokens they consume are listed. For shared setup, see [Theme variables](../theme_variables.md).

#### CSS variables

This component declares no public CSS variables.

#### Shadow Parts

This component exposes no Shadow Parts.
