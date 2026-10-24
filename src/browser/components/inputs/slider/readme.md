# q-slider



<!-- Auto Generated Below -->


## Overview

Single-value range input with a themed track, glowing thumb and optional value badge.

## Properties

| Property    | Attribute    | Description                                          | Type      | Default     |
| ----------- | ------------ | ---------------------------------------------------- | --------- | ----------- |
| `ariaLabel` | `aria-label` |                                                      | `string`  | `null`      |
| `disabled`  | `disabled`   |                                                      | `boolean` | `false`     |
| `label`     | `label`      |                                                      | `string`  | `undefined` |
| `max`       | `max`        |                                                      | `number`  | `100`       |
| `min`       | `min`        |                                                      | `number`  | `0`         |
| `name`      | `name`       |                                                      | `string`  | `undefined` |
| `showValue` | `show-value` |                                                      | `boolean` | `true`      |
| `step`      | `step`       |                                                      | `number`  | `1`         |
| `suffix`    | `suffix`     | Suffix for the displayed value, such as px or %.     | `string`  | `''`        |
| `value`     | `value`      | Current value. Defaults to the minimum when omitted. | `number`  | `undefined` |


## Events

| Event     | Description                                                              | Type                  |
| --------- | ------------------------------------------------------------------------ | --------------------- |
| `qChange` | Numeric value emitted when the interaction is committed.                 | `CustomEvent<number>` |
| `qInput`  | Numeric value emitted continuously while dragging or using the keyboard. | `CustomEvent<number>` |


## Methods

### `focusElement() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Shadow Parts

| Part      | Description           |
| --------- | --------------------- |
| `"input"` | Native range control. |
| `"label"` | Label and value row.  |
| `"value"` | Current-value badge.  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
