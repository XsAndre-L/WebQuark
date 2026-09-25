# q-card



<!-- Auto Generated Below -->


## Overview

Flexible content card with optional header slot, elevation, glass, lift, and interactive button semantics.

## Properties

| Property        | Attribute        | Description                                                             | Type                                                                      | Default     |
| --------------- | ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------- |
| `dividers`      | `dividers`       |                                                                         | `boolean`                                                                 | `false`     |
| `elevation`     | `elevation`      | Numeric values remain supported as legacy elevation aliases.            | `"high" \| "low" \| "medium" \| "none" \| 1 \| 2 \| 3`                    | `'low'`     |
| `footerPadding` | `footer-padding` |                                                                         | `"2xl" \| "3xl" \| "lg" \| "md" \| "none" \| "sm" \| "xl" \| "xs"`        | `undefined` |
| `glass`         | `glass`          | Applies translucent glass styling without backdrop-filter.              | `boolean`                                                                 | `false`     |
| `headerPadding` | `header-padding` |                                                                         | `"2xl" \| "3xl" \| "lg" \| "md" \| "none" \| "sm" \| "xl" \| "xs"`        | `undefined` |
| `interactive`   | `interactive`    | Adds button semantics and keyboard activation to the card container.    | `boolean`                                                                 | `false`     |
| `lift`          | `lift`           | Applies a visual hover/focus lift without adding interactive semantics. | `boolean`                                                                 | `false`     |
| `padding`       | `padding`        |                                                                         | `"2xl" \| "3xl" \| "lg" \| "md" \| "none" \| "sm" \| "xl" \| "xs"`        | `'lg'`      |
| `surface`       | `surface`        | Explicit surface; omitted preserves the variant's role.                 | `"canvas" \| "card" \| "field" \| "floating" \| "panel" \| "transparent"` | `undefined` |


## Slots

| Slot       | Description                                               |
| ---------- | --------------------------------------------------------- |
|            | Main card body content.                                   |
| `"footer"` | Optional footer content, hidden automatically when empty. |
| `"header"` | Optional header content, hidden automatically when empty. |


## Shadow Parts

| Part          | Description            |
| ------------- | ---------------------- |
| `"body"`      | Body slot container.   |
| `"container"` | Card surface.          |
| `"footer"`    | Footer slot container. |
| `"header"`    | Header slot container. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
