# q-chip

> Contract note: see [Current public contracts](./current-contracts.md#q-chip) and the [generated API](../../src/components/actions/chip/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

`q-chip` is a compact UI primitive for filters, quick navigation, tags, and low-emphasis status labels.

Use it when the control should read as a small piece of metadata or a scoped filter. Use `q-button` for primary commands and `q-link` for inline text links.

## Core Usage

```html
<q-chip href="#users" variant="filter" selected>Users</q-chip>
<q-chip variant="success">Synced</q-chip>
<q-chip removable value="region-west">Western Cape</q-chip>
```

## Properties

| Property | Type | Default | Purpose |
| --- | --- | --- | --- |
| `variant` | `neutral \| filter \| primary \| success \| warning \| danger` | `neutral` | Visual tone for the chip. |
| `size` | `sm \| md \| lg` | `md` | Chip height, padding, and text size. |
| `label` | `string` | `undefined` | Fallback label when no default slot is provided. |
| `value` | `string` | `undefined` | Stable value emitted with `qRemove`. |
| `selected` | `boolean` | `false` | Applies selected styling and `aria-pressed` for button chips. |
| `disabled` | `boolean` | `false` | Blocks navigation and interaction. |
| `clickable` | `boolean` | `false` | Renders a button chip when no `href` is supplied. |
| `removable` | `boolean` | `false` | Shows a trailing remove action and emits `qRemove`. |
| `href`, `target`, `rel`, `download` | `string` | `undefined` | Anchor behavior for navigation chips. |

## Slots

Default content is the label. `icon-left` and `icon-right` can host icons or small symbols.

## Events

`qClick` fires for clickable button chips and anchor chips. `qRemove` fires from the remove action with `{ value, label }`.

## Accessibility

Anchor chips preserve native link behavior. Button chips expose `aria-pressed` when selected. Removable chips render the remove action as its own button to avoid nested interactive elements.
