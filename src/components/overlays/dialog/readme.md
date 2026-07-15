# q-dialog



<!-- Auto Generated Below -->


## Overview

Modal confirmation or message dialog with focus trapping and safe solid backdrops.

## Properties

| Property              | Attribute                | Description                                                                                                    | Type                | Default          |
| --------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------- |
| `ariaLabel`           | `aria-label`             | Accessible name for the dialog, especially when using a custom header without dialogTitle.                     | `string`            | `null`           |
| `backdropEffect`      | `backdrop-effect`        | Backdrop rendering style. Solid is the default CEF/Unreal-safe dimmer; none keeps the click layer transparent. | `"none" \| "solid"` | `'solid'`        |
| `cancelLabel`         | `cancel-label`           | Text shown on the cancel action button.                                                                        | `string`            | `'Cancel'`       |
| `closeLabel`          | `close-label`            | Accessible label for the header close button.                                                                  | `string`            | `'Close dialog'` |
| `closeOnEsc`          | `close-on-esc`           | Allows the Escape key to cancel and close the dialog.                                                          | `boolean`           | `true`           |
| `closeOnOverlayClick` | `close-on-overlay-click` | Allows backdrop clicks to cancel and close the dialog.                                                         | `boolean`           | `true`           |
| `confirmLabel`        | `confirm-label`          | Text shown on the confirm action button.                                                                       | `string`            | `'Confirm'`      |
| `dialogTitle`         | `dialog-title`           | Optional title text rendered in the default dialog header.                                                     | `string`            | `undefined`      |
| `loading`             | `loading`                | Disables dialog actions and marks the confirm button busy.                                                     | `boolean`           | `false`          |
| `message`             | `message`                | Optional message text rendered in the default dialog body.                                                     | `string`            | `undefined`      |
| `open`                | `open`                   | Controls the dialog's visibility.                                                                              | `boolean`           | `false`          |
| `showCancel`          | `show-cancel`            | Shows the cancel action button.                                                                                | `boolean`           | `true`           |
| `showConfirm`         | `show-confirm`           | Shows the confirm action button.                                                                               | `boolean`           | `true`           |


## Events

| Event      | Description                                                    | Type                |
| ---------- | -------------------------------------------------------------- | ------------------- |
| `qCancel`  | Emitted when the cancel action is activated.                   | `CustomEvent<void>` |
| `qClose`   | Emitted whenever the dialog is closed through a public action. | `CustomEvent<void>` |
| `qConfirm` | Emitted when the confirm action is activated.                  | `CustomEvent<void>` |


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

Opens the dialog.

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
