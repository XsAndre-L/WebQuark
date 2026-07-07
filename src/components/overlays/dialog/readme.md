# q-dialog



<!-- Auto Generated Below -->


## Properties

| Property              | Attribute                | Description                                                                                                       | Type                          | Default          |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------- |
| `backdropEffect`      | `backdrop-effect`        | Backdrop rendering style. The `blur` option uses backdrop-filter and is not safe for CEF/Unreal Webview contexts. | `"blur" \| "none" \| "solid"` | `'blur'`         |
| `cancelLabel`         | `cancel-label`           | Text shown on the cancel action button.                                                                           | `string`                      | `'Cancel'`       |
| `closeLabel`          | `close-label`            | Accessible label for the header close button.                                                                     | `string`                      | `'Close dialog'` |
| `closeOnEsc`          | `close-on-esc`           | Allows the Escape key to cancel and close the dialog.                                                             | `boolean`                     | `true`           |
| `closeOnOverlayClick` | `close-on-overlay-click` | Allows backdrop clicks to cancel and close the dialog.                                                            | `boolean`                     | `true`           |
| `confirmLabel`        | `confirm-label`          | Text shown on the confirm action button.                                                                          | `string`                      | `'Confirm'`      |
| `dialogTitle`         | `dialog-title`           | Optional title text rendered in the default dialog header.                                                        | `string`                      | `undefined`      |
| `loading`             | `loading`                | Disables dialog actions and marks the confirm button busy.                                                        | `boolean`                     | `false`          |
| `message`             | `message`                | Optional message text rendered in the default dialog body.                                                        | `string`                      | `undefined`      |
| `open`                | `open`                   | Controls the dialog's visibility.                                                                                 | `boolean`                     | `false`          |
| `showCancel`          | `show-cancel`            | Shows the cancel action button.                                                                                   | `boolean`                     | `true`           |
| `showConfirm`         | `show-confirm`           | Shows the confirm action button.                                                                                  | `boolean`                     | `true`           |


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




## Shadow Parts

| Part            | Description |
| --------------- | ----------- |
| `"backdrop"`    |             |
| `"body"`        |             |
| `"cancel-btn"`  |             |
| `"close-btn"`   |             |
| `"confirm-btn"` |             |
| `"footer"`      |             |
| `"header"`      |             |
| `"modal"`       |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
