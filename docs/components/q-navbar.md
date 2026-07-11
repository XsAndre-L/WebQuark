# q-navbar

> Contract note: see [Current public contracts](./current-contracts.md#q-navbar) and the [generated API](../../src/components/layout/navbar/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

`q-navbar` is responsive edge navigation for public pages, docs, and application shells. It is distinct from `q-toolbar`, which provides consumer-owned layout without navigation behavior, and `q-sidepanel`, which is intended for persistent dashboard/workspace navigation.

Key props: `brand`, `logoSrc`, `brandHref`, `items`, `activeValue`, `ariaLabel`, `edge`, `mobileMode`, `sticky`, `compact`, `transparent`, `bordered`.

Use `edge="top"`, `edge="right"`, `edge="bottom"`, or `edge="left"` to control orientation, inward-facing borders, sticky positioning, and safe-area padding. Top and bottom navbars are horizontal; left and right navbars are vertical.

For simple navigation, `items` accepts strings and uses each string as both label and selected value. Object entries remain available for links, active or disabled state, and icons. Use `icon` for a Lucide icon, `iconOnly` to hide the visual label while keeping the item accessible, and the item's `ariaLabel` when that name should differ from `label`.

```js
navbar.items = ['Home', 'Docs', 'Support'];
```

Set the component's `aria-label` to name both responsive navigation regions when “Primary navigation” is not specific enough.

Set `mobileMode="inline"` when navigation items should stay visible at mobile widths instead of collapsing into the menu button.

Slots: `brand`, `nav`, `actions`, `mobile-nav`, `mobile-actions`.
