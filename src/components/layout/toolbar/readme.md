# q-toolbar



<!-- Auto Generated Below -->


## Overview

Customizable edge toolbar with consumer-owned start, content, and end regions.

## Properties

| Property      | Attribute     | Description                                      | Type                                     | Default     |
| ------------- | ------------- | ------------------------------------------------ | ---------------------------------------- | ----------- |
| `ariaLabel`   | `aria-label`  | Accessible label for the toolbar content group.  | `string`                                 | `undefined` |
| `bordered`    | `bordered`    | Renders a border along the inward-facing edge.   | `boolean`                                | `false`     |
| `compact`     | `compact`     | Uses a reduced toolbar size and padding.         | `boolean`                                | `false`     |
| `edge`        | `edge`        | Edge the toolbar is arranged against.            | `"bottom" \| "left" \| "right" \| "top"` | `'top'`     |
| `sticky`      | `sticky`      | Keeps the toolbar pinned to its configured edge. | `boolean`                                | `false`     |
| `transparent` | `transparent` | Removes the toolbar background.                  | `boolean`                                | `false`     |


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
