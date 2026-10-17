# q-textarea



## Horizontal width

See the [shared width guide](../../../../../docs/input-widths.md) for a copyable project override block.

Use `width="xs|sm|md|lg|xl|full"` to opt into a shared field width. The five widths default to 5rem, 10rem, 15rem, 20rem and 22.5rem. `full` fills the available width. Omitted, empty or unsupported values preserve the existing 100% layout. `size` still controls height and internal density independently.

Override `--q-input-width-xs` through `--q-input-width-xl` at the document or a local container. Widths are identical in compact/comfortable presets and light/dark themes, and rem values follow the root font size. Valid widths are capped to their containing block; flex/grid parents still control available space. Long content may wrap or truncate within that space rather than expanding the field.

Normal consumer CSS on the host (for example `q-textarea { width: 18rem; }`) takes precedence over these shadow styles; removing that rule restores the attribute-selected width. No inline style or JavaScript sizing is applied by the width API.

<!-- Auto Generated Below -->


## Overview

Form-associated textarea with optional auto-grow behavior and validation messaging.

## Properties

| Property          | Attribute          | Description                                                                                             | Type                                             | Default     |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------- |
| `ariaLabel`       | `aria-label`       | Accessible name for the native textarea when a visible label is not used.                               | `string`                                         | `null`      |
| `autoGrow`        | `auto-grow`        | Grows with content when `resizeMode` is `auto`.                                                         | `boolean`                                        | `true`      |
| `description`     | `description`      | Supporting text, replaced by an active error.                                                           | `string`                                         | `undefined` |
| `disabled`        | `disabled`         |                                                                                                         | `boolean`                                        | `false`     |
| `error`           | `error`            | Validation error text or error-state flag.                                                              | `string`                                         | `undefined` |
| `errorMessage`    | `error-message`    | <span style="color:red">**[DEPRECATED]**</span> Use error. Used when error is empty or unset.<br/><br/> | `string`                                         | `undefined` |
| `label`           | `label`            |                                                                                                         | `string`                                         | `undefined` |
| `labelHidden`     | `label-hidden`     | Keep the label accessible without displaying it.                                                        | `boolean`                                        | `false`     |
| `name`            | `name`             |                                                                                                         | `string`                                         | `undefined` |
| `placeholder`     | `placeholder`      |                                                                                                         | `string`                                         | `""`        |
| `required`        | `required`         |                                                                                                         | `boolean`                                        | `false`     |
| `reserveFeedback` | `reserve-feedback` | Omitted inherits the enclosing form; false cancels reservation.                                         | `boolean`                                        | `undefined` |
| `resizeMode`      | `resize-mode`      | Resize behavior: auto grows to content, manual allows vertical drag, fixed locks the height.            | `"auto" \| "fixed" \| "manual"`                  | `'auto'`    |
| `rows`            | `rows`             |                                                                                                         | `number`                                         | `3`         |
| `size`            | `size`             |                                                                                                         | `"inherit" \| "lg" \| "md" \| "sm"`              | `'inherit'` |
| `value`           | `value`            |                                                                                                         | `string`                                         | `""`        |
| `width`           | `width`            | Opt-in horizontal width; independent of size. Omitted uses the existing full-width layout.              | `"full" \| "lg" \| "md" \| "sm" \| "xl" \| "xs"` | `undefined` |


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
