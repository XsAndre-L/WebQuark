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
| `disabled`         | `disabled`          | Disables the trigger and prevents selection changes.                                                   | `boolean`                         | `false`                 |
| `externalSearch`   | `external-search`   | Leaves filtering and pagination to the consumer instead of filtering options locally.                  | `boolean`                         | `false`                 |
| `hasMore`          | `has-more`          | Indicates that another externally loaded option page is available.                                     | `boolean`                         | `false`                 |
| `label`            | `label`             | Optional label rendered above the trigger.                                                             | `string`                          | `undefined`             |
| `loading`          | `loading`           | Displays the menu loading state while options are being fetched.                                       | `boolean`                         | `false`                 |
| `name`             | `name`              | Form field name.                                                                                       | `string`                          | `undefined`             |
| `options`          | `options`           | Options to render; strings use the same text for label and value, while objects allow separate values. | `DropdownOptionInput[] \| string` | `[]`                    |
| `placeholder`      | `placeholder`       | Placeholder text shown when no option is selected.                                                     | `string`                          | `'Select an option...'` |
| `placement`        | `placement`         | Preferred menu direction. Auto uses the side with enough viewport space.                               | `"auto" \| "bottom" \| "top"`     | `'auto'`                |
| `searchable`       | `searchable`        | Shows a search input inside the menu.                                                                  | `boolean`                         | `false`                 |
| `size`             | `size`              | Visual size preset.                                                                                    | `"lg" \| "md" \| "sm"`            | `'md'`                  |
| `value`            | `value`             | Selected option value.                                                                                 | `string`                          | `''`                    |


## Events

| Event       | Description                                                                           | Type                      |
| ----------- | ------------------------------------------------------------------------------------- | ------------------------- |
| `qBlur`     | Emitted when the trigger loses focus.                                                 | `CustomEvent<FocusEvent>` |
| `qChange`   | Emitted with the selected option value when selection changes.                        | `CustomEvent<string>`     |
| `qClick`    | Emitted before the trigger toggles the menu.                                          | `CustomEvent<MouseEvent>` |
| `qFocus`    | Emitted when the trigger receives focus.                                              | `CustomEvent<FocusEvent>` |
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
