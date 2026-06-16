# q-dropdown



<!-- Auto Generated Below -->


## Properties

| Property      | Attribute     | Description | Type                   | Default                 |
| ------------- | ------------- | ----------- | ---------------------- | ----------------------- |
| `disabled`    | `disabled`    |             | `boolean`              | `false`                 |
| `label`       | `label`       |             | `string`               | `undefined`             |
| `options`     | `options`     |             | `Option[] \| string`   | `[]`                    |
| `placeholder` | `placeholder` |             | `string`               | `"Select an option..."` |
| `searchable`  | `searchable`  |             | `boolean`              | `false`                 |
| `size`        | `size`        |             | `"lg" \| "md" \| "sm"` | `'md'`                  |
| `value`       | `value`       |             | `string`               | `""`                    |


## Events

| Event     | Description | Type                      |
| --------- | ----------- | ------------------------- |
| `qBlur`   |             | `CustomEvent<FocusEvent>` |
| `qChange` |             | `CustomEvent<string>`     |
| `qClick`  |             | `CustomEvent<MouseEvent>` |
| `qFocus`  |             | `CustomEvent<FocusEvent>` |
| `qSelect` |             | `CustomEvent<Option>`     |


## Shadow Parts

| Part        | Description |
| ----------- | ----------- |
| `"label"`   |             |
| `"menu"`    |             |
| `"trigger"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
