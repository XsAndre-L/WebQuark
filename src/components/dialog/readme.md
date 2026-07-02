# q-dialog



<!-- Auto Generated Below -->


## Properties

| Property              | Attribute                | Description | Type                          | Default     |
| --------------------- | ------------------------ | ----------- | ----------------------------- | ----------- |
| `backdropEffect`      | `backdrop-effect`        |             | `"blur" \| "none" \| "solid"` | `'blur'`    |
| `cancelLabel`         | `cancel-label`           |             | `string`                      | `'Cancel'`  |
| `closeOnEsc`          | `close-on-esc`           |             | `boolean`                     | `true`      |
| `closeOnOverlayClick` | `close-on-overlay-click` |             | `boolean`                     | `true`      |
| `confirmLabel`        | `confirm-label`          |             | `string`                      | `'Confirm'` |
| `dialogTitle`         | `dialog-title`           |             | `string`                      | `undefined` |
| `loading`             | `loading`                |             | `boolean`                     | `false`     |
| `message`             | `message`                |             | `string`                      | `undefined` |
| `open`                | `open`                   |             | `boolean`                     | `false`     |
| `showCancel`          | `show-cancel`            |             | `boolean`                     | `true`      |
| `showConfirm`         | `show-confirm`           |             | `boolean`                     | `true`      |


## Events

| Event      | Description | Type                |
| ---------- | ----------- | ------------------- |
| `qCancel`  |             | `CustomEvent<void>` |
| `qClose`   |             | `CustomEvent<void>` |
| `qConfirm` |             | `CustomEvent<void>` |


## Methods

### `cancel() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `close() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `confirm() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `show() => Promise<void>`



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
