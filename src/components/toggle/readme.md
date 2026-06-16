# q-toggle



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description | Type                     | Default     |
| ---------- | ---------- | ----------- | ------------------------ | ----------- |
| `checked`  | `checked`  |             | `boolean`                | `false`     |
| `disabled` | `disabled` |             | `boolean`                | `false`     |
| `error`    | `error`    |             | `string`                 | `undefined` |
| `label`    | `label`    |             | `string`                 | `undefined` |
| `required` | `required` |             | `boolean`                | `false`     |
| `size`     | `size`     |             | `"lg" \| "md" \| "sm"`   | `'md'`      |
| `type`     | `type`     |             | `"checkbox" \| "switch"` | `'switch'`  |


## Events

| Event     | Description | Type                      |
| --------- | ----------- | ------------------------- |
| `qBlur`   |             | `CustomEvent<FocusEvent>` |
| `qChange` |             | `CustomEvent<boolean>`    |
| `qClick`  |             | `CustomEvent<MouseEvent>` |
| `qFocus`  |             | `CustomEvent<FocusEvent>` |


## Methods

### `setChecked(value: boolean) => Promise<void>`

Programmatically set checked state without emitting qChange.
Use this from external controllers (e.g. playground) to avoid
the SYNCBACK_MAP → registry → effect → prop-set feedback loop.

#### Parameters

| Name    | Type      | Description |
| ------- | --------- | ----------- |
| `value` | `boolean` |             |

#### Returns

Type: `Promise<void>`



### `toggle() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Shadow Parts

| Part               | Description |
| ------------------ | ----------- |
| `"box"`            |             |
| `"control"`        |             |
| `"error-msg"`      |             |
| `"icon-checked"`   |             |
| `"icon-unchecked"` |             |
| `"label"`          |             |
| `"thumb"`          |             |
| `"track"`          |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
