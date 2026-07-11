# Component guide: `q-step-diagram-item`

`q-step-diagram-item` represents one interactive step inside `q-step-diagram`. Use it for workflow stages, setup progress, or status timelines. The parent diagram normally owns the item layout.

Canonical API: [generated Stencil reference](../../src/components/indicators/step-diagram-item/readme.md).

## Public contract

| Property | Attribute | Type | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `status` | `"pending" \| "active" \| "completed" \| "success" \| "warning" \| "danger"` | `'completed'` | Controls visual and semantic step state. |
| `lineStyle` | `line-style` | `"solid" \| "dashed" \| "dotted" \| "none"` | `'solid'` | Controls the connector after the step. |
| `layout` | `layout` | `"vertical" \| "horizontal"` | `'vertical'` | Layout propagated by the parent diagram. |

Event: `qItemClick` fires after pointer, Enter, or Space activation. Its current detail is `void`, so keep application identity in the surrounding closure or element dataset.

## Slots and parts

- `badge`: custom status marker; the badge region is decorative and does not activate the item.
- `title`: primary step title.
- Default slot: supporting step content.
- Parts: `badge`, `connector`, `content`, `title`, `body`.

## UX and accessibility

- The content region uses button semantics and is keyboard focusable.
- `status="active"` exposes `aria-current="step"`.
- `status="pending"` currently exposes `aria-disabled="true"` but still emits `qItemClick`. Until corrected, consumers must ignore activation for pending steps.
- Give every item a concise title. Do not rely on badge color alone to communicate state.
- `q-step-diagram` currently provides the list container; item list semantics should be verified when the accessibility fix in the audit is implemented.

## Styling

Primary component tokens include `--q-step-diag-border`, `--q-step-diag-line`, `--q-step-diag-icon-size`, and `--q-step-diag-item-gap`. Status colors fall back to the global primary, success, warning, danger, foreground, and surface tokens.

The component exposes `badge`, `connector`, `content`, `title`, and `body` parts for targeted styling. Prefer tokens for theme-wide changes and parts for a local exception.

## CEF/Unreal and performance

The component uses Shadow DOM, simple grid/flex layout, and 2D transforms. The active pulse is continuous animation; provide a reduced-motion override at application level until the library adds a shared `prefers-reduced-motion` policy.

## Example

```html
<q-step-diagram aria-label="Account setup progress">
  <q-step-diagram-item status="completed" line-style="solid">
    <strong slot="title">Create account</strong>
    Profile saved
  </q-step-diagram-item>
  <q-step-diagram-item status="active" line-style="dashed">
    <strong slot="title">Verify email</strong>
    Check your inbox
  </q-step-diagram-item>
  <q-step-diagram-item status="pending" line-style="none">
    <strong slot="title">Finish</strong>
  </q-step-diagram-item>
</q-step-diagram>
```

```js
document.querySelectorAll('q-step-diagram-item').forEach((item) => {
  item.addEventListener('qItemClick', () => {
    if (item.status === 'pending') return;
    // Navigate to or expand the selected step.
  });
});
```

## Known limitations

- Pending activation is not suppressed.
- The event does not include an item value, original event, or index.
- The component assumes interactive steps; there is no presentation-only mode.
