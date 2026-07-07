# q-dropdown



<!-- Auto Generated Below -->


## Overview

Form-associated dropdown/select control with optional search and incremental option rendering.

## Properties

| Property      | Attribute     | Description                                                                       | Type                   | Default                 |
| ------------- | ------------- | --------------------------------------------------------------------------------- | ---------------------- | ----------------------- |
| `disabled`    | `disabled`    | Disables the trigger and prevents selection changes.                              | `boolean`              | `false`                 |
| `label`       | `label`       | Optional label rendered above the trigger.                                        | `string`               | `undefined`             |
| `name`        | `name`        | Form field name.                                                                  | `string`               | `undefined`             |
| `options`     | `options`     | Options to render; accepts an array or a JSON string of { label, value } objects. | `Option[] \| string`   | `[]`                    |
| `placeholder` | `placeholder` | Placeholder text shown when no option is selected.                                | `string`               | `'Select an option...'` |
| `searchable`  | `searchable`  | Shows a search input inside the menu.                                             | `boolean`              | `false`                 |
| `size`        | `size`        | Visual size preset.                                                               | `"lg" \| "md" \| "sm"` | `'md'`                  |
| `value`       | `value`       | Selected option value.                                                            | `string`               | `''`                    |


## Events

| Event     | Description                                                     | Type                      |
| --------- | --------------------------------------------------------------- | ------------------------- |
| `qBlur`   | Emitted when the trigger loses focus.                           | `CustomEvent<FocusEvent>` |
| `qChange` | Emitted with the selected option value when selection changes.  | `CustomEvent<string>`     |
| `qClick`  | Emitted before the trigger toggles the menu.                    | `CustomEvent<MouseEvent>` |
| `qFocus`  | Emitted when the trigger receives focus.                        | `CustomEvent<FocusEvent>` |
| `qSelect` | Emitted with the selected option object when selection changes. | `CustomEvent<Option>`     |


## Shadow Parts

| Part        | Description                        |
| ----------- | ---------------------------------- |
| `"label"`   | Optional field label.              |
| `"menu"`    | Floating option menu.              |
| `"trigger"` | Button that opens the option menu. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
