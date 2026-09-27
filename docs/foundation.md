# Sizing, spacing, surfaces, and forms

WebQuark provides shared geometry and composition primitives. Import the global
stylesheet for the theme; components also carry dimension fallbacks when used alone.
The [generated token reference](theme-tokens.md) and playground theme designer
read the same definitions in `src/theme/tokens.ts`.

## Choose size once

`q-form` and `q-toolbar` publish an inherited control size. Their default is
`inherit`; without an ancestor size, controls use `md`. Set `sm`, `md`, or `lg`
on an individual control to override its scope. Nested scopes can override or
return to inheritance without changing child properties.

| Size | Minimum height | Text / line height | Horizontal padding | Icon | Radius |
| --- | --- | --- | --- | --- | --- |
| sm | 28px | 12 / 16px | 8px | 14px | 5.5px |
| md | 36px | 14 / 20px | 12px | 16px | 7px |
| lg | 44px | 16 / 24px | 16px | 20px | 8.5px |

Tokens use rem units. These pixel equivalents assume a 16px root font. Heights
are minimums so wrapped labels and enlarged text can grow. Textareas keep their
row count; toggle graphics are smaller than their interaction row. Avatars,
chips, circular buttons, and stacked button content keep their own geometry.

`--q-control-radius-sm/md/lg` provides proportional corners for buttons, inputs,
textareas, dropdown triggers, radio groups, and quantity selectors. Radius follows
explicit or inherited control size, including runtime form/toolbar size changes.
Textarea radius follows size rather than row count. Component radius overrides
take precedence; fields also support `--q-field-radius`. Explicit button sizes
honor `--q-btn-radius-sm/md/lg` before `--q-btn-radius`. Library root defaults for
these override tokens are removed so they do not mask the shared scale.
General `--q-radius-sm/md/lg` surface tokens and pill/circle shapes are unchanged.

Auto-growing textareas recalculate when their explicit or inherited size, row
count, or container width changes. Manual and fixed resize modes retain their
height. Color inputs use the same control heights as other inputs.

## Compose layouts

- `q-stack`: vertical flow, `gap="lg"`, `align="stretch"`.
- `q-inline`: wrapping horizontal flow, `gap="sm"`, `align="center"`, `justify="start"`.
- `q-grid`: at most `columns="2"` columns, `min-item-width="16rem"`, `gap="lg"`.
  It fits its container. Set `row-gap` or `column-gap` independently; put
  `data-q-span="full"` on a **direct child** for a full row.

Spacing names are `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`:
0, 4, 8, 12, 16, 24, 32, 48px. Grid fields align at their top edge;
different numbers of label lines do not synchronize control baselines.

```html
<q-dialog size="lg" heading="Billing details" open>
  <q-form label="Billing details" label-hidden size="md" reserve-feedback>
    <q-grid columns="2" min-item-width="16rem" gap="lg">
      <q-input data-q-span="full" label="Payer name" name="payer" required></q-input>
      <q-input label="Email" name="email" type="email" required></q-input>
      <q-dropdown label="Country" name="country" required></q-dropdown>
    </q-grid>
    <q-inline slot="actions" justify="end">
      <q-button variant="ghost">Cancel</q-button>
      <q-button type="submit">Apply</q-button>
    </q-inline>
  </q-form>
</q-dialog>
```

Use `description` for field help and `error` for validation feedback. An error
replaces the description. `label-hidden` keeps the label accessible. Feedback
space is collapsed by default; `reserve-feedback` on a form reserves one line.
A control's `reserveFeedback = false` opts out explicitly. Longer messages grow.
The existing `errorMessage` aliases remain available where previously supported.
Dropdowns expose `checkValidity()`, `reportValidity()`, and `focusElement()`;
required dropdowns accept any nonempty value, including values outside a loaded
options page. Toggle custom errors remain presentation only. `q-form` validation,
reset, submit events, and `noValidate` keep their existing behavior through wrappers.

## Pick a surface by purpose

| Role | Palette fallback |
| --- | --- |
| canvas | `--q-bg-base` |
| panel | `--q-bg-surface-1` |
| card | `--q-bg-surface-2` |
| field | `--q-bg-surface-3` |
| floating | `--q-bg-surface-4` |
| transparent | transparent |

Set `surface` on cards/panels. Override a role with `--q-bg-{role}` at the
desired scope. Nesting never changes the surface automatically. Component
overrides such as `--q-card-bg` and `--q-panel-bg` take precedence; card glass
takes precedence over `surface` when no component background is set.

Cards and panels accept `padding`, `header-padding`, `footer-padding`, and
`dividers`. Padding applies to each region locally. Cards expose `header`,
default, and `footer` slots and parts; `elevation="none"` disables the shadow.
Dialogs use floating surfaces, 16px viewport gutters, and widths `sm`=24rem,
`md`=36rem, `lg`=48rem, `full`=available width. Their region CSS tokens remain
available. Horizontal toolbars wrap and grow; `compact` controls chrome padding,
while `size` controls descendants. Left/right toolbars retain their vertical layout.

## Migration notes

This changes visual defaults. Control size defaults become `inherit`, card
elevation becomes `low`, panel padding becomes `lg`, and dialog width becomes
`md`. Existing `--q-padding-sm/md/lg` aliases now resolve to **8/12/16px**
(previously 4/9/16px). Replace repeated control sizes, layout CSS, and shadow-part
spacing fixes with scopes and primitives. Review intentional bespoke overrides.

Consumer CSS overrides remain supported. Library root defaults that previously
masked role or geometry fallbacks were removed; scoped palette changes now reach
their descendants. Keep global theme tokens at theme scope and component-specific
overrides at the component that needs them. Upgrade core and framework wrappers
together; this change does not publish packages or change consumer version pins.

Icon-only buttons continue to honor `--q-btn-icon-padding-sm/md/lg` for their
explicit size. Textarea padding resolves `--q-input-padding` first, then
`--q-field-padding`, then the shared geometry fallback. The library no longer
sets a root `--q-field-padding` default that would mask that fallback.

Run `bun run packages:build`, `bun run check:prop-order`, and
`bunx vitest run --project browser src/theme/test/foundation.cmp.test.ts`.
The foundation browser tests import built custom elements, so rebuild before
running them after source changes.
