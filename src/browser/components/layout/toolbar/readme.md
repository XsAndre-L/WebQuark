# q-toolbar



<!-- Auto Generated Below -->


## Overview

Customizable edge toolbar with consumer-owned start, content, and end regions.

## Properties

| Property      | Attribute     | Description                                     | Type                                                               | Default     |
| ------------- | ------------- | ----------------------------------------------- | ------------------------------------------------------------------ | ----------- |
| `ariaLabel`   | `aria-label`  | Accessible label for the toolbar content group. | `string`                                                           | `null`      |
| `bordered`    | `bordered`    |                                                 | `boolean`                                                          | `false`     |
| `compact`     | `compact`     |                                                 | `boolean`                                                          | `false`     |
| `edge`        | `edge`        |                                                 | `"bottom" \| "left" \| "right" \| "top"`                           | `'top'`     |
| `gap`         | `gap`         |                                                 | `"2xl" \| "3xl" \| "lg" \| "md" \| "none" \| "sm" \| "xl" \| "xs"` | `'sm'`      |
| `size`        | `size`        |                                                 | `"inherit" \| "lg" \| "md" \| "sm"`                                | `'inherit'` |
| `sticky`      | `sticky`      |                                                 | `boolean`                                                          | `false`     |
| `transparent` | `transparent` |                                                 | `boolean`                                                          | `false`     |
| `wrap`        | `wrap`        |                                                 | `boolean`                                                          | `true`      |


## Slots

| Slot      | Description                                    |
| --------- | ---------------------------------------------- |
|           | Primary toolbar content.                       |
| `"end"`   | Optional content aligned to the ending edge.   |
| `"start"` | Optional content aligned to the starting edge. |


## Shadow Parts

| Part        | Description              |
| ----------- | ------------------------ |
| `"content"` | Primary content region.  |
| `"end"`     | Ending content region.   |
| `"row"`     | Toolbar layout region.   |
| `"start"`   | Starting content region. |
| `"toolbar"` | Toolbar container.       |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
