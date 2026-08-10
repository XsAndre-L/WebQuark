# q-textarea



<!-- Auto Generated Below -->


## Overview

Form-associated textarea with optional auto-grow behavior and validation messaging.

## Properties

| Property       | Attribute       | Description                                                                                  | Type                            | Default     |
| -------------- | --------------- | -------------------------------------------------------------------------------------------- | ------------------------------- | ----------- |
| `ariaLabel`    | `aria-label`    | Accessible name for the native textarea when a visible label is not used.                    | `string`                        | `null`      |
| `autoGrow`     | `auto-grow`     | Grows with content when `resizeMode` is `auto`.                                              | `boolean`                       | `true`      |
| `disabled`     | `disabled`      |                                                                                              | `boolean`                       | `false`     |
| `error`        | `error`         | Validation error text or error-state flag.                                                   | `string`                        | `undefined` |
| `errorMessage` | `error-message` | Validation helper text displayed when the field is in an error state.                        | `string`                        | `undefined` |
| `label`        | `label`         |                                                                                              | `string`                        | `undefined` |
| `name`         | `name`          |                                                                                              | `string`                        | `undefined` |
| `placeholder`  | `placeholder`   |                                                                                              | `string`                        | `""`        |
| `required`     | `required`      |                                                                                              | `boolean`                       | `false`     |
| `resizeMode`   | `resize-mode`   | Resize behavior: auto grows to content, manual allows vertical drag, fixed locks the height. | `"auto" \| "fixed" \| "manual"` | `'auto'`    |
| `rows`         | `rows`          |                                                                                              | `number`                        | `3`         |
| `value`        | `value`         |                                                                                              | `string`                        | `""`        |


## Events

| Event     | Description                               | Type                      |
| --------- | ----------------------------------------- | ------------------------- |
| `qBlur`   |                                           | `CustomEvent<FocusEvent>` |
| `qChange` | Emitted when the committed value changes. | `CustomEvent<string>`     |
| `qClick`  |                                           | `CustomEvent<MouseEvent>` |
| `qFocus`  |                                           | `CustomEvent<FocusEvent>` |
| `qInput`  |                                           | `CustomEvent<string>`     |


## Methods

### `adjustHeight() => Promise<void>`

Recalculates the auto-grow height when resizeMode is auto.

#### Returns

Type: `Promise<void>`



### `checkValidity() => Promise<boolean>`

Returns whether the control satisfies native and custom constraints.

#### Returns

Type: `Promise<boolean>`



### `focusElement() => Promise<void>`

Moves focus to the native textarea.

#### Returns

Type: `Promise<void>`



### `reportValidity() => Promise<boolean>`

Reports native or custom constraint violations and returns whether the control is valid.

#### Returns

Type: `Promise<boolean>`




## Shadow Parts

| Part          | Description             |
| ------------- | ----------------------- |
| `"error-msg"` | Validation helper text. |
| `"label"`     | Optional field label.   |
| `"textarea"`  | Native textarea field.  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
