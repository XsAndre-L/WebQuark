# q-toggle



<!-- Auto Generated Below -->


## Overview

Form-associated switch or checkbox toggle control.

## Properties

| Property   | Attribute  | Description                                                            | Type                     | Default     |
| ---------- | ---------- | ---------------------------------------------------------------------- | ------------------------ | ----------- |
| `checked`  | `checked`  | Current checked state.                                                 | `boolean`                | `false`     |
| `disabled` | `disabled` | Disables toggle interaction.                                           | `boolean`                | `false`     |
| `error`    | `error`    | Validation helper text displayed when the toggle is in an error state. | `string`                 | `undefined` |
| `label`    | `label`    | Optional label rendered next to the toggle.                            | `string`                 | `undefined` |
| `name`     | `name`     | Native form field name.                                                | `string`                 | `undefined` |
| `required` | `required` | Marks the toggle as required for native forms.                         | `boolean`                | `false`     |
| `size`     | `size`     | Visual size preset.                                                    | `"lg" \| "md" \| "sm"`   | `'md'`      |
| `type`     | `type`     | Visual and semantic control type: switch or checkbox.                  | `"checkbox" \| "switch"` | `'switch'`  |


## Events

| Event     | Description                                                              | Type                      |
| --------- | ------------------------------------------------------------------------ | ------------------------- |
| `qBlur`   | Emitted when the toggle loses focus.                                     | `CustomEvent<FocusEvent>` |
| `qChange` | Emitted when the checked state changes.                                  | `CustomEvent<boolean>`    |
| `qClick`  | Emitted before the toggle changes due to pointer or keyboard activation. | `CustomEvent<MouseEvent>` |
| `qFocus`  | Emitted when the toggle receives focus.                                  | `CustomEvent<FocusEvent>` |


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
