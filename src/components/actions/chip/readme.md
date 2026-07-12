# q-chip



<!-- Auto Generated Below -->


## Overview

Compact label, link, filter, or removable token.

## Properties

| Property    | Attribute   | Description                                                                                          | Type                                                                       | Default     |
| ----------- | ----------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------- |
| `clickable` | `clickable` | Renders the whole chip as a button when no href is set. Ignored when removable.                      | `boolean`                                                                  | `false`     |
| `disabled`  | `disabled`  | Disables interaction and removal.                                                                    | `boolean`                                                                  | `false`     |
| `download`  | `download`  | Download filename or boolean download hint for link chips.                                           | `string`                                                                   | `undefined` |
| `href`      | `href`      | URL to render the chip as a link. Ignored when removable to avoid nested interactive controls.       | `string`                                                                   | `undefined` |
| `label`     | `label`     | Visible label text. Also used in qRemove detail and the remove button accessible name.               | `string`                                                                   | `undefined` |
| `rel`       | `rel`       | Link rel value. Defaults to noopener noreferrer for target="_blank".                                 | `string`                                                                   | `undefined` |
| `removable` | `removable` | Adds a remove button. Removable chips render as non-interactive containers to avoid nested controls. | `boolean`                                                                  | `false`     |
| `selected`  | `selected`  | Marks the chip as selected.                                                                          | `boolean`                                                                  | `false`     |
| `size`      | `size`      | Chip size.                                                                                           | `"lg" \| "md" \| "sm"`                                                     | `'md'`      |
| `target`    | `target`    | Link target used when `href` is set.                                                                 | `"_blank" \| "_parent" \| "_self" \| "_top"`                               | `undefined` |
| `value`     | `value`     | Consumer-provided identifier included in qRemove detail.                                             | `string`                                                                   | `undefined` |
| `variant`   | `variant`   | Visual style of the chip.                                                                            | `"danger" \| "filter" \| "neutral" \| "primary" \| "success" \| "warning"` | `'neutral'` |


## Events

| Event     | Description                                                        | Type                             |
| --------- | ------------------------------------------------------------------ | -------------------------------- |
| `qBlur`   | Emitted when the interactive chip or remove button loses focus.    | `CustomEvent<FocusEvent>`        |
| `qClick`  | Emitted when an interactive chip is clicked.                       | `CustomEvent<MouseEvent>`        |
| `qFocus`  | Emitted when the interactive chip or remove button receives focus. | `CustomEvent<FocusEvent>`        |
| `qRemove` | Emitted when the remove button is clicked.                         | `CustomEvent<QChipRemoveDetail>` |


## Slots

| Slot           | Description                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
|                | Chip label text. If using this for visible text on a removable chip, also set `label` for the remove button accessible name. |
| `"icon-left"`  | Content placed before the label.                                                                                             |
| `"icon-right"` | Content placed after the label.                                                                                              |


## Shadow Parts

| Part              | Description           |
| ----------------- | --------------------- |
| `"chip"`          | Root chip element.    |
| `"label"`         | Chip label wrapper.   |
| `"remove-button"` | Remove action button. |
| `"remove-icon"`   | Remove action icon.   |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
