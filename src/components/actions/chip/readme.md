# q-chip



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute   | Description | Type                                                                       | Default     |
| ----------- | ----------- | ----------- | -------------------------------------------------------------------------- | ----------- |
| `clickable` | `clickable` |             | `boolean`                                                                  | `false`     |
| `disabled`  | `disabled`  |             | `boolean`                                                                  | `false`     |
| `download`  | `download`  |             | `string`                                                                   | `undefined` |
| `href`      | `href`      |             | `string`                                                                   | `undefined` |
| `label`     | `label`     |             | `string`                                                                   | `undefined` |
| `rel`       | `rel`       |             | `string`                                                                   | `undefined` |
| `removable` | `removable` |             | `boolean`                                                                  | `false`     |
| `selected`  | `selected`  |             | `boolean`                                                                  | `false`     |
| `size`      | `size`      |             | `"lg" \| "md" \| "sm"`                                                     | `'md'`      |
| `target`    | `target`    |             | `"_blank" \| "_parent" \| "_self" \| "_top"`                               | `undefined` |
| `value`     | `value`     |             | `string`                                                                   | `undefined` |
| `variant`   | `variant`   |             | `"danger" \| "filter" \| "neutral" \| "primary" \| "success" \| "warning"` | `'neutral'` |


## Events

| Event     | Description | Type                             |
| --------- | ----------- | -------------------------------- |
| `qBlur`   |             | `CustomEvent<FocusEvent>`        |
| `qClick`  |             | `CustomEvent<MouseEvent>`        |
| `qFocus`  |             | `CustomEvent<FocusEvent>`        |
| `qRemove` |             | `CustomEvent<QChipRemoveDetail>` |


## Shadow Parts

| Part              | Description |
| ----------------- | ----------- |
| `"chip"`          |             |
| `"label"`         |             |
| `"remove-button"` |             |
| `"remove-icon"`   |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
