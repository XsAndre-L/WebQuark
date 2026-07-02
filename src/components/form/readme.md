# q-form



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type                                                                           | Default                               |
| ---------------- | ----------------- | ----------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| `action`         | `action`          |             | `string`                                                                       | `undefined`                           |
| `autocomplete`   | `autocomplete`    |             | `"off" \| "on"`                                                                | `'on'`                                |
| `enctype`        | `enctype`         |             | `"application/x-www-form-urlencoded" \| "multipart/form-data" \| "text/plain"` | `'application/x-www-form-urlencoded'` |
| `enterBehavior`  | `enter-behavior`  |             | `"focus-next" \| "none" \| "submit"`                                           | `'submit'`                            |
| `label`          | `label`           |             | `string`                                                                       | `undefined`                           |
| `method`         | `method`          |             | `"dialog" \| "get" \| "post"`                                                  | `'post'`                              |
| `noValidate`     | `no-validate`     |             | `boolean`                                                                      | `false`                               |
| `preventDefault` | `prevent-default` |             | `boolean`                                                                      | `true`                                |
| `target`         | `target`          |             | `"_blank" \| "_parent" \| "_self" \| "_top"`                                   | `undefined`                           |


## Events

| Event     | Description | Type                             |
| --------- | ----------- | -------------------------------- |
| `qReset`  |             | `CustomEvent<QFormResetDetail>`  |
| `qSubmit` |             | `CustomEvent<QFormSubmitDetail>` |


## Methods

### `getValues() => Promise<QFormValues>`



#### Returns

Type: `Promise<QFormValues>`



### `resetForm() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `setValues(values: QFormValues) => Promise<void>`



#### Parameters

| Name     | Type                           | Description |
| -------- | ------------------------------ | ----------- |
| `values` | `{ [x: string]: QFormValue; }` |             |

#### Returns

Type: `Promise<void>`



### `submitForm() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Shadow Parts

| Part        | Description |
| ----------- | ----------- |
| `"actions"` |             |
| `"body"`    |             |
| `"form"`    |             |
| `"header"`  |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
