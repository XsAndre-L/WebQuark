# q-dropdown

Searchable dropdowns use the main editable control by default. Set `search-mode="menu"` to retain the separate popup search. Typed queries do not commit values; Escape, Tab or leaving restores the selected label. See the [component guide](../../../../../docs/components/q-dropdown.md) for external search, keyboard, form and accessibility contracts.

The option menu uses viewport-aware floating placement. Its default `auto` placement opens below
when space permits, flips above near the viewport edge, and stays clear of clipping ancestors by
using the browser top layer when supported. Keyboard option changes scroll only the internal list,
not the surrounding page or panel.


## Horizontal width

See the [shared width guide](../../../../../docs/input-widths.md) for a copyable project override block.

Use `width="xs|sm|md|lg|xl|xxl|full"` to opt into a shared field width. The six widths default to 5rem, 7.5rem, 11.25rem, 15rem, 18.125rem and 22.5rem. `full` fills the available width. Omitted, empty or unsupported values preserve the existing 100% layout. `size` still controls height and internal density independently.

Override `--q-input-width-xs` through `--q-input-width-xxl` at the document or a local container. Widths are identical in compact/comfortable presets and light/dark themes, and rem values follow the root font size. Valid widths are capped to their containing block; flex/grid parents still control available space. Long content may wrap or truncate within that space rather than expanding the field.

Normal consumer CSS on the host (for example `q-dropdown { width: 18rem; }`) takes precedence over these shadow styles; removing that rule restores the attribute-selected width. No inline style or JavaScript sizing is applied by the width API.

<!-- Auto Generated Below -->


## Overview

Form-associated dropdown/select control with optional search, incremental option rendering,
and externally loaded option pages.

## Properties

| Property           | Attribute           | Description                                                                                              | Type                                                                       | Default                 |
| ------------------ | ------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------- |
| `ariaLabel`        | `aria-label`        | Accessible name for the trigger and option list when no visible label is available.                      | `string`                                                                   | `null`                  |
| `collisionPadding` | `collision-padding` | Minimum distance maintained between the open menu and viewport edges.                                    | `number`                                                                   | `8`                     |
| `description`      | `description`       | Supporting text, replaced by an active error.                                                            | `string`                                                                   | `undefined`             |
| `disabled`         | `disabled`          |                                                                                                          | `boolean`                                                                  | `false`                 |
| `error`            | `error`             | Custom validation error; independent of currently loaded options.                                        | `string`                                                                   | `undefined`             |
| `externalSearch`   | `external-search`   | Delegates filtering and pagination to the consumer.                                                      | `boolean`                                                                  | `false`                 |
| `hasMore`          | `has-more`          | Indicates another externally loaded option page is available.                                            | `boolean`                                                                  | `false`                 |
| `label`            | `label`             |                                                                                                          | `string`                                                                   | `undefined`             |
| `labelHidden`      | `label-hidden`      | Keep the label accessible without displaying it.                                                         | `boolean`                                                                  | `false`                 |
| `loading`          | `loading`           |                                                                                                          | `boolean`                                                                  | `false`                 |
| `name`             | `name`              |                                                                                                          | `string`                                                                   | `undefined`             |
| `options`          | `options`           | Options to render; strings use the same text for label and value, while objects allow separate values.   | `DropdownOptionInput[] \| string`                                          | `[]`                    |
| `placeholder`      | `placeholder`       |                                                                                                          | `string`                                                                   | `'Select an option...'` |
| `placement`        | `placement`         | `auto` uses a side with sufficient viewport space.                                                       | `"auto" \| "bottom" \| "top"`                                              | `'auto'`                |
| `required`         | `required`          |                                                                                                          | `boolean`                                                                  | `false`                 |
| `reserveFeedback`  | `reserve-feedback`  | Omitted inherits the enclosing form; false cancels reservation.                                          | `boolean`                                                                  | `undefined`             |
| `searchMode`       | `search-mode`       | Search in the main editable control (default) or a separate menu field. Applies only when searchable.    | `"default" \| "menu"`                                                      | `'default'`             |
| `searchable`       | `searchable`        |                                                                                                          | `boolean`                                                                  | `false`                 |
| `size`             | `size`              |                                                                                                          | `"inherit" \| "lg" \| "md" \| "sm"`                                        | `'inherit'`             |
| `value`            | `value`             |                                                                                                          | `string`                                                                   | `''`                    |
| `width`            | `width`             | Opt-in horizontal width; fit-options sizes to loaded option labels. Omitted keeps the full-width layout. | `"fit-options" \| "full" \| "lg" \| "md" \| "sm" \| "xl" \| "xs" \| "xxl"` | `undefined`             |


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


## Methods

### `checkValidity() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`



### `focusElement() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `reportValidity() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`




## Slots

| Slot          | Description                                           |
| ------------- | ----------------------------------------------------- |
| `"icon-left"` | Optional leading content rendered inside the trigger. |


## Shadow Parts

| Part        | Description                                        |
| ----------- | -------------------------------------------------- |
| `"label"`   | Optional field label.                              |
| `"menu"`    | Floating option menu.                              |
| `"trigger"` | Active input or button that opens the option menu. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
