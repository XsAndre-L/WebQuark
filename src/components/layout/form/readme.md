# q-form



<!-- Auto Generated Below -->


## Overview

Form wrapper that bridges slotted WebQuark controls to a native form element.
Named controls in the light DOM and assigned slots participate in validation,
value collection, reset, and `FormData`. Controls hidden inside a
consumer-owned nested shadow root are outside this explicit boundary.

## Properties

| Property         | Attribute         | Description                                             | Type                                                                           | Default                               |
| ---------------- | ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| `action`         | `action`          |                                                         | `string`                                                                       | `undefined`                           |
| `autocomplete`   | `autocomplete`    |                                                         | `"off" \| "on"`                                                                | `'on'`                                |
| `enctype`        | `enctype`         |                                                         | `"application/x-www-form-urlencoded" \| "multipart/form-data" \| "text/plain"` | `'application/x-www-form-urlencoded'` |
| `enterBehavior`  | `enter-behavior`  | Controls how Enter behaves inside text-like controls.   | `"focus-next" \| "none" \| "submit"`                                           | `'submit'`                            |
| `label`          | `label`           | Names the native form when no custom header is slotted. | `string`                                                                       | `undefined`                           |
| `method`         | `method`          |                                                         | `"dialog" \| "get" \| "post"`                                                  | `'post'`                              |
| `noValidate`     | `no-validate`     |                                                         | `boolean`                                                                      | `false`                               |
| `preventDefault` | `prevent-default` | Prevents the native submit event's default navigation.  | `boolean`                                                                      | `true`                                |
| `target`         | `target`          |                                                         | `"_blank" \| "_parent" \| "_self" \| "_top"`                                   | `undefined`                           |


## Events

| Event     | Description                                                      | Type                             |
| --------- | ---------------------------------------------------------------- | -------------------------------- |
| `qReset`  |                                                                  | `CustomEvent<QFormResetDetail>`  |
| `qSubmit` | Emitted after a valid submit with collected values and FormData. | `CustomEvent<QFormSubmitDetail>` |


## Methods

### `getValues() => Promise<QFormValues>`

Returns values collected from named native and WebQuark form controls.

#### Returns

Type: `Promise<QFormValues>`



### `resetForm() => Promise<void>`

Resets the native form and associated controls.

#### Returns

Type: `Promise<void>`



### `setValues(values: QFormValues) => Promise<void>`

Applies values to matching named native and WebQuark form controls.

#### Parameters

| Name     | Type                           | Description |
| -------- | ------------------------------ | ----------- |
| `values` | `{ [x: string]: QFormValue; }` |             |

#### Returns

Type: `Promise<void>`



### `submitForm() => Promise<void>`

Requests native form submission, falling back to dispatching a submit event.

#### Returns

Type: `Promise<void>`




## Slots

| Slot        | Description                     |
| ----------- | ------------------------------- |
|             | Form fields and body content.   |
| `"actions"` | Optional form action controls.  |
| `"header"`  | Optional custom header content. |


## Shadow Parts

| Part        | Description                |
| ----------- | -------------------------- |
| `"actions"` | Action controls container. |
| `"body"`    | Body content container.    |
| `"form"`    | Native form element.       |
| `"header"`  | Header container.          |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
