# q-dialog



<!-- Auto Generated Below -->


## Overview

Modal confirmation or message dialog with focus trapping and safe solid backdrops.

## Properties

| Property              | Attribute                | Description                                                                                | Type                             | Default          |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------- | ---------------- |
| `ariaLabel`           | `aria-label`             | Accessible name for the dialog, especially when using a custom header without dialogTitle. | `string`                         | `null`           |
| `backdropEffect`      | `backdrop-effect`        | `solid` is CEF-safe; `none` keeps only a transparent click layer.                          | `"none" \| "solid"`              | `'solid'`        |
| `cancelLabel`         | `cancel-label`           |                                                                                            | `string`                         | `'Cancel'`       |
| `closeLabel`          | `close-label`            | Accessible label for the header close button.                                              | `string`                         | `'Close dialog'` |
| `closeOnEsc`          | `close-on-esc`           |                                                                                            | `boolean`                        | `true`           |
| `closeOnOverlayClick` | `close-on-overlay-click` |                                                                                            | `boolean`                        | `true`           |
| `confirmLabel`        | `confirm-label`          |                                                                                            | `string`                         | `'Confirm'`      |
| `dialogTitle`         | `dialog-title`           | Rendered by the default dialog header.                                                     | `string`                         | `undefined`      |
| `loading`             | `loading`                | Disables dialog actions and marks the confirm button busy.                                 | `boolean`                        | `false`          |
| `message`             | `message`                | Rendered by the default dialog body.                                                       | `string`                         | `undefined`      |
| `open`                | `open`                   |                                                                                            | `boolean`                        | `false`          |
| `showCancel`          | `show-cancel`            |                                                                                            | `boolean`                        | `true`           |
| `showConfirm`         | `show-confirm`           |                                                                                            | `boolean`                        | `true`           |
| `size`                | `size`                   |                                                                                            | `"full" \| "lg" \| "md" \| "sm"` | `'md'`           |


## Events

| Event      | Description                                                    | Type                |
| ---------- | -------------------------------------------------------------- | ------------------- |
| `qCancel`  |                                                                | `CustomEvent<void>` |
| `qClose`   | Emitted whenever the dialog is closed through a public action. | `CustomEvent<void>` |
| `qConfirm` |                                                                | `CustomEvent<void>` |


## Methods

### `cancel() => Promise<void>`

Runs the cancel action unless the dialog is loading.

#### Returns

Type: `Promise<void>`



### `close() => Promise<void>`

Closes the dialog and emits qClose.

#### Returns

Type: `Promise<void>`



### `confirm() => Promise<void>`

Runs the confirm action unless the dialog is loading.

#### Returns

Type: `Promise<void>`



### `show() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Slots

| Slot       | Description                                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
|            | Custom dialog body content.                                                          |
| `"footer"` | Custom action content. Consumers own disabled/loading behavior for slotted controls. |
| `"header"` | Custom header content. Provide an accessible name when replacing `dialogTitle`.      |


## Shadow Parts

| Part            | Description             |
| --------------- | ----------------------- |
| `"backdrop"`    | Backdrop click target.  |
| `"body"`        | Body region.            |
| `"cancel-btn"`  | Default cancel button.  |
| `"close-btn"`   | Header close button.    |
| `"confirm-btn"` | Default confirm button. |
| `"footer"`      | Footer region.          |
| `"header"`      | Header region.          |
| `"modal"`       | Dialog surface.         |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
