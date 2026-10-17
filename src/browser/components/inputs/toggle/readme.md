# q-toggle



## Label and control layout

Switches (the default `type="switch"`) place the label at the inline start and
switch at the inline end of the available row. Checkboxes (`type="checkbox"`)
keep the checkbox before its label. Both layouts follow the inherited text
direction, including RTL. The existing host sizing is unchanged: use a stretched
grid item or a host width when a full-width setting row is wanted.

Property labels, slotted labels and visually hidden labels retain the same
accessible name and click/keyboard behavior. Feedback remains below the row.
For a deliberate control-first switch layout, existing parts allow a local
CSS override without another component property:

```css
q-toggle.control-first::part(control) {
  order: 0;
  margin-inline-start: 0;
}
```

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
