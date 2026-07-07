# q-card



<!-- Auto Generated Below -->


## Overview

Flexible content card with optional header slot, elevation, glass, lift, and interactive button semantics.

## Properties

| Property      | Attribute     | Description                                                                                      | Type                                         | Default    |
| ------------- | ------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------- | ---------- |
| `elevation`   | `elevation`   | Visual elevation level; numeric values are accepted as legacy aliases for low, medium, and high. | `"high" \| "low" \| "medium" \| 1 \| 2 \| 3` | `'medium'` |
| `glass`       | `glass`       | Applies translucent glass styling without backdrop-filter.                                       | `boolean`                                    | `false`    |
| `interactive` | `interactive` | Adds button semantics and keyboard activation to the card container.                             | `boolean`                                    | `false`    |
| `lift`        | `lift`        | Applies a visual hover/focus lift without adding interactive semantics.                          | `boolean`                                    | `false`    |


## Slots

| Slot       | Description                                               |
| ---------- | --------------------------------------------------------- |
|            | Main card body content.                                   |
| `"header"` | Optional header content, hidden automatically when empty. |


## Shadow Parts

| Part       | Description            |
| ---------- | ---------------------- |
| `"body"`   | Body slot container.   |
| `"header"` | Header slot container. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
