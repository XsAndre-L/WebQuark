# q-navbar

`q-navbar` is responsive edge navigation for public pages, docs, and application shells. It is distinct from `q-toolbar`, which provides consumer-owned layout without navigation behavior, and `q-sidepanel`, which is intended for persistent dashboard/workspace navigation.

Key props: `brand`, `logoSrc`, `brandHref`, `items`, `activeValue`, `edge`, `mobileMode`, `sticky`, `compact`, `transparent`, `bordered`.

Use `edge="top"`, `edge="right"`, `edge="bottom"`, or `edge="left"` to control orientation, inward-facing borders, sticky positioning, and safe-area padding. Top and bottom navbars are horizontal; left and right navbars are vertical.

`items` entries support text labels, links, active state, disabled state, and icons. Use `icon` for a Lucide icon, `iconOnly` to hide the visual label while keeping the item accessible, and `ariaLabel` when the accessible label should differ from `label`.

Set `mobileMode="inline"` when navigation items should stay visible at mobile widths instead of collapsing into the menu button.

Slots: `brand`, `nav`, `actions`, `mobile-nav`, `mobile-actions`.
