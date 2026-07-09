# q-navbar

`q-navbar` is a responsive top navigation header for public pages, docs, and simple app shells. It is distinct from `q-sidepanel`, which is intended for persistent dashboard/workspace navigation.

Key props: `brand`, `logoSrc`, `brandHref`, `items`, `activeValue`, `mobileMode`, `sticky`, `compact`, `transparent`, `bordered`.

`items` entries support text labels, links, active state, disabled state, and icons. Use `icon` for a Lucide icon, `iconOnly` to hide the visual label while keeping the item accessible, and `ariaLabel` when the accessible label should differ from `label`.

Set `mobileMode="inline"` when navigation items should stay visible at mobile widths instead of collapsing into the menu button.

Slots: `brand`, `nav`, `actions`, `mobile-nav`, `mobile-actions`.
