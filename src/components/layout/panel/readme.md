# q-panel



<!-- Auto Generated Below -->


## Overview

Flexible panel surface with optional header, body, and footer regions.

## Properties

| Property       | Attribute       | Description                                                                     | Type                                 | Default      |
| -------------- | --------------- | ------------------------------------------------------------------------------- | ------------------------------------ | ------------ |
| `ariaLabel`    | `aria-label`    | Accessible label for the panel container and scrollable body region.            | `string`                             | `null`       |
| `fullHeight`   | `full-height`   | Stretches the panel to fill the available height.                               | `boolean`                            | `false`      |
| `noBorders`    | `no-borders`    | Removes the panel border while preserving the selected variant's other styling. | `boolean`                            | `false`      |
| `padding`      | `padding`       | Padding density applied to the body region.                                     | `"lg" \| "md" \| "none" \| "sm"`     | `'md'`       |
| `scrollable`   | `scrollable`    | Enables internal scrolling for overflowing panel content.                       | `boolean`                            | `false`      |
| `stickyFooter` | `sticky-footer` | Keeps the footer pinned when the panel itself is the scroll container.          | `boolean`                            | `false`      |
| `stickyHeader` | `sticky-header` | Keeps the header pinned when the panel itself is the scroll container.          | `boolean`                            | `false`      |
| `variant`      | `variant`       | Visual treatment for the panel container.                                       | `"bordered" \| "plain" \| "surface"` | `'bordered'` |


## Slots

| Slot       | Description              |
| ---------- | ------------------------ |
|            | Main panel body content. |
| `"footer"` | Optional footer content. |
| `"header"` | Optional header content. |


## Shadow Parts

| Part       | Description      |
| ---------- | ---------------- |
| `"body"`   | Body region.     |
| `"footer"` | Footer region.   |
| `"header"` | Header region.   |
| `"panel"`  | Panel container. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
