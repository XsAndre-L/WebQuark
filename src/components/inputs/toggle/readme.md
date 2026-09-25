# q-toggle



<!-- Auto Generated Below -->


## Overview

Form-associated switch or checkbox toggle control.

## Properties

| Property          | Attribute          | Description                                                            | Type                                | Default     |
| ----------------- | ------------------ | ---------------------------------------------------------------------- | ----------------------------------- | ----------- |
| `checked`         | `checked`          |                                                                        | `boolean`                           | `false`     |
| `description`     | `description`      | Supporting text, replaced by an active error.                          | `string`                            | `undefined` |
| `disabled`        | `disabled`         |                                                                        | `boolean`                           | `false`     |
| `error`           | `error`            | Validation helper text displayed when the toggle is in an error state. | `string`                            | `undefined` |
| `label`           | `label`            |                                                                        | `string`                            | `undefined` |
| `labelHidden`     | `label-hidden`     | Keep the label accessible without displaying it.                       | `boolean`                           | `false`     |
| `name`            | `name`             |                                                                        | `string`                            | `undefined` |
| `required`        | `required`         |                                                                        | `boolean`                           | `false`     |
| `reserveFeedback` | `reserve-feedback` | Omitted inherits the enclosing form; false cancels reservation.        | `boolean`                           | `undefined` |
| `size`            | `size`             |                                                                        | `"inherit" \| "lg" \| "md" \| "sm"` | `'inherit'` |
| `type`            | `type`             | Controls switch/checkbox visuals and semantics.                        | `"checkbox" \| "switch"`            | `'switch'`  |


## Events

| Event     | Description                                                              | Type                      |
| --------- | ------------------------------------------------------------------------ | ------------------------- |
| `qBlur`   |                                                                          | `CustomEvent<FocusEvent>` |
| `qChange` |                                                                          | `CustomEvent<boolean>`    |
| `qClick`  | Emitted before the toggle changes due to pointer or keyboard activation. | `CustomEvent<MouseEvent>` |
| `qFocus`  |                                                                          | `CustomEvent<FocusEvent>` |


## Methods

### `checkValidity() => Promise<boolean>`

Returns whether the toggle satisfies its required constraint.

#### Returns

Type: `Promise<boolean>`



### `reportValidity() => Promise<boolean>`

Reports a required constraint violation and returns whether the toggle is valid.

#### Returns

Type: `Promise<boolean>`



### `toggle() => Promise<void>`

Programmatically toggles checked and emits qChange.

#### Returns

Type: `Promise<void>`




## Slots

| Slot               | Description                                        |
| ------------------ | -------------------------------------------------- |
|                    | Label content rendered next to the control.        |
| `"checked-icon"`   | Custom icon shown when checkbox type is checked.   |
| `"unchecked-icon"` | Custom icon shown when checkbox type is unchecked. |


## Shadow Parts

| Part               | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `"box"`            | Visual checkbox box.                                     |
| `"control"`        | Non-visual wrapper around the visual switch or checkbox. |
| `"error-msg"`      | Validation helper text.                                  |
| `"icon-checked"`   | Checked icon wrapper for checkbox type.                  |
| `"icon-unchecked"` | Unchecked icon wrapper for checkbox type.                |
| `"label"`          | Label text wrapper.                                      |
| `"thumb"`          | Visual switch thumb.                                     |
| `"track"`          | Visual switch track.                                     |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
