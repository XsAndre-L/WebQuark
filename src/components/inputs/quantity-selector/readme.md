# q-quantity-selector



<!-- Auto Generated Below -->


## Properties

| Property  | Attribute | Description                                            | Type                         | Default        |
| --------- | --------- | ------------------------------------------------------ | ---------------------------- | -------------- |
| `max`     | `max`     | Maximum allowed value limit (optional).                | `number`                     | `undefined`    |
| `min`     | `min`     | Minimum allowed value limit (optional).                | `number`                     | `undefined`    |
| `step`    | `step`    | The increment/decrement step amount.                   | `number`                     | `1`            |
| `value`   | `value`   | The current quantity value.                            | `number`                     | `0`            |
| `variant` | `variant` | Layout alignment variants: 'horizontal' or 'vertical'. | `"horizontal" \| "vertical"` | `'horizontal'` |


## Events

| Event     | Description                              | Type                      |
| --------- | ---------------------------------------- | ------------------------- |
| `qBlur`   |                                          | `CustomEvent<FocusEvent>` |
| `qChange` | Emitted when the quantity value changes. | `CustomEvent<number>`     |
| `qClick`  |                                          | `CustomEvent<MouseEvent>` |
| `qFocus`  |                                          | `CustomEvent<FocusEvent>` |


## Shadow Parts

| Part      | Description |
| --------- | ----------- |
| `"input"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
