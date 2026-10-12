# q-panel



<!-- Auto Generated Below -->


## Overview

Flexible panel surface with optional header, body, and footer regions.

## Properties

| Property        | Attribute        | Description                                                                                                   | Type                                                                      | Default      |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------ |
| `ariaLabel`     | `aria-label`     | Accessible label for the panel container and scrollable body region.                                          | `string`                                                                  | `null`       |
| `borderless`    | `borderless`     | Removes the panel border while preserving the selected variant's other styling.                               | `boolean`                                                                 | `undefined`  |
| `dividers`      | `dividers`       |                                                                                                               | `boolean`                                                                 | `false`      |
| `footerPadding` | `footer-padding` |                                                                                                               | `"2xl" \| "3xl" \| "lg" \| "md" \| "none" \| "sm" \| "xl" \| "xs"`        | `undefined`  |
| `fullHeight`    | `full-height`    |                                                                                                               | `boolean`                                                                 | `false`      |
| `headerPadding` | `header-padding` |                                                                                                               | `"2xl" \| "3xl" \| "lg" \| "md" \| "none" \| "sm" \| "xl" \| "xs"`        | `undefined`  |
| `noBorders`     | `no-borders`     | <span style="color:red">**[DEPRECATED]**</span> Use borderless. Used only when borderless is unset.<br/><br/> | `boolean`                                                                 | `false`      |
| `padding`       | `padding`        |                                                                                                               | `"2xl" \| "3xl" \| "lg" \| "md" \| "none" \| "sm" \| "xl" \| "xs"`        | `'lg'`       |
| `scrollable`    | `scrollable`     |                                                                                                               | `boolean`                                                                 | `false`      |
| `stickyFooter`  | `sticky-footer`  | Keeps the footer pinned when the panel itself is the scroll container.                                        | `boolean`                                                                 | `false`      |
| `stickyHeader`  | `sticky-header`  | Keeps the header pinned when the panel itself is the scroll container.                                        | `boolean`                                                                 | `false`      |
| `surface`       | `surface`        | Explicit surface; omitted preserves the variant's role.                                                       | `"canvas" \| "card" \| "field" \| "floating" \| "panel" \| "transparent"` | `undefined`  |
| `variant`       | `variant`        |                                                                                                               | `"bordered" \| "plain" \| "surface"`                                      | `'bordered'` |


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
