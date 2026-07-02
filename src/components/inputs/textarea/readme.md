# q-textarea



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description | Type                            | Default     |
| -------------- | --------------- | ----------- | ------------------------------- | ----------- |
| `autoGrow`     | `auto-grow`     |             | `boolean`                       | `true`      |
| `disabled`     | `disabled`      |             | `boolean`                       | `false`     |
| `error`        | `error`         |             | `string`                        | `undefined` |
| `errorMessage` | `error-message` |             | `string`                        | `undefined` |
| `label`        | `label`         |             | `string`                        | `undefined` |
| `name`         | `name`          |             | `string`                        | `undefined` |
| `placeholder`  | `placeholder`   |             | `string`                        | `""`        |
| `required`     | `required`      |             | `boolean`                       | `false`     |
| `resizeMode`   | `resize-mode`   |             | `"auto" \| "fixed" \| "manual"` | `'auto'`    |
| `rows`         | `rows`          |             | `number`                        | `3`         |
| `value`        | `value`         |             | `string`                        | `""`        |


## Events

| Event     | Description | Type                      |
| --------- | ----------- | ------------------------- |
| `qBlur`   |             | `CustomEvent<FocusEvent>` |
| `qChange` |             | `CustomEvent<string>`     |
| `qClick`  |             | `CustomEvent<MouseEvent>` |
| `qFocus`  |             | `CustomEvent<FocusEvent>` |
| `qInput`  |             | `CustomEvent<string>`     |


## Methods

### `adjustHeight() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `focusElement() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Shadow Parts

| Part          | Description |
| ------------- | ----------- |
| `"error-msg"` |             |
| `"label"`     |             |
| `"textarea"`  |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
