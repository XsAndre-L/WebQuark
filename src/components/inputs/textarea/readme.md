# q-textarea



<!-- Auto Generated Below -->


## Overview

Form-associated textarea with optional auto-grow behavior and validation messaging.

## Properties

| Property       | Attribute       | Description                                                                                  | Type                            | Default     |
| -------------- | --------------- | -------------------------------------------------------------------------------------------- | ------------------------------- | ----------- |
| `ariaLabel`    | `aria-label`    | Accessible name for the native textarea when a visible label is not used.                    | `string`                        | `null`      |
| `autoGrow`     | `auto-grow`     | Enables automatic height growth when resizeMode is auto.                                     | `boolean`                       | `true`      |
| `disabled`     | `disabled`      | Disables textarea interaction.                                                               | `boolean`                       | `false`     |
| `error`        | `error`         | Validation error text or error-state flag.                                                   | `string`                        | `undefined` |
| `errorMessage` | `error-message` | Validation helper text displayed when the field is in an error state.                        | `string`                        | `undefined` |
| `label`        | `label`         | Optional label rendered above the textarea.                                                  | `string`                        | `undefined` |
| `name`         | `name`          | Native form field name.                                                                      | `string`                        | `undefined` |
| `placeholder`  | `placeholder`   | Placeholder text shown when the field is empty.                                              | `string`                        | `""`        |
| `required`     | `required`      | Marks the field as required for native forms.                                                | `boolean`                       | `false`     |
| `resizeMode`   | `resize-mode`   | Resize behavior: auto grows to content, manual allows vertical drag, fixed locks the height. | `"auto" \| "fixed" \| "manual"` | `'auto'`    |
| `rows`         | `rows`          | Visible row count used by the native textarea.                                               | `number`                        | `3`         |
| `value`        | `value`         | Current textarea value.                                                                      | `string`                        | `""`        |


## Events

| Event     | Description                                      | Type                      |
| --------- | ------------------------------------------------ | ------------------------- |
| `qBlur`   | Emitted when the native textarea loses focus.    | `CustomEvent<FocusEvent>` |
| `qChange` | Emitted when the committed value changes.        | `CustomEvent<string>`     |
| `qClick`  | Emitted when the native textarea is clicked.     | `CustomEvent<MouseEvent>` |
| `qFocus`  | Emitted when the native textarea receives focus. | `CustomEvent<FocusEvent>` |
| `qInput`  | Emitted as the user types.                       | `CustomEvent<string>`     |


## Methods

### `adjustHeight() => Promise<void>`

Recalculates the auto-grow height when resizeMode is auto.

#### Returns

Type: `Promise<void>`



### `focusElement() => Promise<void>`

Moves focus to the native textarea.

#### Returns

Type: `Promise<void>`




## Shadow Parts

| Part          | Description             |
| ------------- | ----------------------- |
| `"error-msg"` | Validation helper text. |
| `"label"`     | Optional field label.   |
| `"textarea"`  | Native textarea field.  |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
