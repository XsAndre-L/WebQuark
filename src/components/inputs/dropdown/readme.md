# q-dropdown

The option menu uses viewport-aware floating placement. Its default `auto` placement opens below
when space permits, flips above near the viewport edge, and stays clear of clipping ancestors by
using the browser top layer when supported. Keyboard option changes scroll only the internal list,
not the surrounding page or panel.


<!-- Auto Generated Below -->


## Overview

Form-associated dropdown/select control with optional search, incremental option rendering,
and externally loaded option pages.

## Properties

| Property           | Attribute           | Description                                                                                            | Type                              | Default                 |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- | ----------------------- |
| `ariaLabel`        | `aria-label`        | Accessible name for the trigger and option list when no visible label is available.                    | `string`                          | `null`                  |
| `collisionPadding` | `collision-padding` | Minimum distance maintained between the open menu and viewport edges.                                  | `number`                          | `8`                     |
| `disabled`         | `disabled`          |                                                                                                        | `boolean`                         | `false`                 |
| `externalSearch`   | `external-search`   | Delegates filtering and pagination to the consumer.                                                    | `boolean`                         | `false`                 |
| `hasMore`          | `has-more`          | Indicates another externally loaded option page is available.                                          | `boolean`                         | `false`                 |
| `label`            | `label`             |                                                                                                        | `string`                          | `undefined`             |
| `loading`          | `loading`           |                                                                                                        | `boolean`                         | `false`                 |
| `name`             | `name`              |                                                                                                        | `string`                          | `undefined`             |
| `options`          | `options`           | Options to render; strings use the same text for label and value, while objects allow separate values. | `DropdownOptionInput[] \| string` | `[]`                    |
| `placeholder`      | `placeholder`       |                                                                                                        | `string`                          | `'Select an option...'` |
| `placement`        | `placement`         | `auto` uses a side with sufficient viewport space.                                                     | `"auto" \| "bottom" \| "top"`     | `'auto'`                |
| `searchable`       | `searchable`        |                                                                                                        | `boolean`                         | `false`                 |
| `size`             | `size`              |                                                                                                        | `"lg" \| "md" \| "sm"`            | `'md'`                  |
| `value`            | `value`             |                                                                                                        | `string`                          | `''`                    |


## Events

| Event       | Description                                                                           | Type                      |
| ----------- | ------------------------------------------------------------------------------------- | ------------------------- |
| `qBlur`     |                                                                                       | `CustomEvent<FocusEvent>` |
| `qChange`   | Emitted with the selected option value when selection changes.                        | `CustomEvent<string>`     |
| `qClick`    | Emitted before the trigger toggles the menu.                                          | `CustomEvent<MouseEvent>` |
| `qFocus`    |                                                                                       | `CustomEvent<FocusEvent>` |
| `qLoadMore` | Emitted when an externally loaded option list reaches its scroll boundary.            | `CustomEvent<void>`       |
| `qSearch`   | Emitted with the current search term when a searchable dropdown uses external search. | `CustomEvent<string>`     |
| `qSelect`   | Emitted with the selected option object when selection changes.                       | `CustomEvent<Option>`     |


## Slots

| Slot          | Description                                           |
| ------------- | ----------------------------------------------------- |
| `"icon-left"` | Optional leading content rendered inside the trigger. |


## Shadow Parts

| Part        | Description                        |
| ----------- | ---------------------------------- |
| `"label"`   | Optional field label.              |
| `"menu"`    | Floating option menu.              |
| `"trigger"` | Button that opens the option menu. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
