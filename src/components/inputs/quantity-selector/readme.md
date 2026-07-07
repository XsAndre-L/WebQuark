# q-quantity-selector



<!-- Auto Generated Below -->


## Overview

Numeric quantity control with increment/decrement buttons and a bounded editable value.

## Properties

| Property  | Attribute | Description                                            | Type                         | Default        |
| --------- | --------- | ------------------------------------------------------ | ---------------------------- | -------------- |
| `max`     | `max`     | Maximum allowed value limit (optional).                | `number`                     | `undefined`    |
| `min`     | `min`     | Minimum allowed value limit (optional).                | `number`                     | `undefined`    |
| `step`    | `step`    | The increment/decrement step amount.                   | `number`                     | `1`            |
| `value`   | `value`   | The current quantity value.                            | `number`                     | `0`            |
| `variant` | `variant` | Layout alignment variants: 'horizontal' or 'vertical'. | `"horizontal" \| "vertical"` | `'horizontal'` |


## Events

| Event     | Description                                                        | Type                      |
| --------- | ------------------------------------------------------------------ | ------------------------- |
| `qBlur`   | Emitted when the input loses focus, after the value is reconciled. | `CustomEvent<FocusEvent>` |
| `qChange` | Emitted when the quantity value changes.                           | `CustomEvent<number>`     |
| `qClick`  | Emitted when the quantity selector is clicked.                     | `CustomEvent<MouseEvent>` |
| `qFocus`  | Emitted when the input receives focus.                             | `CustomEvent<FocusEvent>` |


## Shadow Parts

| Part      | Description                   |
| --------- | ----------------------------- |
| `"input"` | Editable numeric value field. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
