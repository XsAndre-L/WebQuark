# q-quantity-selector



<!-- Auto Generated Below -->


## Overview

Numeric quantity control with increment/decrement buttons and a bounded editable value.

## Properties

| Property  | Attribute | Description | Type                         | Default        |
| --------- | --------- | ----------- | ---------------------------- | -------------- |
| `max`     | `max`     |             | `number`                     | `undefined`    |
| `min`     | `min`     |             | `number`                     | `undefined`    |
| `step`    | `step`    |             | `number`                     | `1`            |
| `value`   | `value`   |             | `number`                     | `0`            |
| `variant` | `variant` |             | `"horizontal" \| "vertical"` | `'horizontal'` |


## Events

| Event     | Description                                                        | Type                      |
| --------- | ------------------------------------------------------------------ | ------------------------- |
| `qBlur`   | Emitted when the input loses focus, after the value is reconciled. | `CustomEvent<FocusEvent>` |
| `qChange` |                                                                    | `CustomEvent<number>`     |
| `qClick`  |                                                                    | `CustomEvent<MouseEvent>` |
| `qFocus`  |                                                                    | `CustomEvent<FocusEvent>` |


## Shadow Parts

| Part      | Description                   |
| --------- | ----------------------------- |
| `"input"` | Editable numeric value field. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
