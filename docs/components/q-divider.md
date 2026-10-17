# q-divider

A static horizontal or vertical separator using the inherited theme border color.

```html
<q-divider></q-divider>
<div style="display:flex; align-items:center; gap:var(--q-space-sm, .5rem)">
  <q-button>Save</q-button>
  <q-divider orientation="vertical"></q-divider>
  <q-button>Cancel</q-button>
</div>
```

## Container sizing

The host needs an allocated extent along the line axis. Horizontal dividers fill normal block width; vertical dividers stretch between sibling controls in a row flex toolbar. A vertical divider in block flow requires an explicitly sized wrapper or flex/grid allocation. A horizontal divider on the main axis of a row flex layout needs an allocated width or flex slot. Grid tracks must obtain their size from content or container constraints. Keep wrapped action groups together; a divider stretches within its own flex line. Nested wrappers own their layout. Initial writing-mode support is horizontal-tb, including LTR and RTL.

`length="auto"` fills the allocated host extent minus the endpoint inset at both ends. Explicit CSS lengths are centered and capped to that same usable extent; percentages resolve against the full allocated extent before the cap. Containers smaller than twice the inset draw a zero-length line. The absolute internal line contributes no intrinsic long-axis size and follows container or sibling resizing without JavaScript measurements.

## Inputs

| Input | Default | Behavior |
| --- | --- | --- |
| `orientation` | `horizontal` | Physical `horizontal` or `vertical` direction. |
| `length` | `auto` | CSS length/percentage or `auto`, bounded by the container. |
| `spacing` | `lg` | QSpace token: none, xs, sm, md, lg, xl, 2xl, 3xl. Symmetric external block spacing for horizontal; inline spacing for vertical. Default lg supplies 16px per side at the standard theme baseline. Parent gap adds independently; use none when only the parent gap should supply spacing. |
| `decorative` | `false` | Hide purely visual separation from assistive technology. |

## Theme and accessibility

`--q-divider-inset` defaults to `var(--q-space-sm, .5rem)` at each endpoint. This is independent of perpendicular `spacing`. `--q-divider-thickness` defaults to `1px`. `--q-divider-color` falls back to inherited `--q-border-color`, then `#374151`; light/dark themes supply the inherited color. Forced colors uses CanvasText. The `line` shadow part exposes the visible line.

The host is the sole semantic separator with explicit orientation, no focus behavior, and no accessible name requirement for this static use. Decorative separators use aria-hidden. See [WAI-ARIA separator](https://www.w3.org/TR/wai-aria-1.3/#separator).
