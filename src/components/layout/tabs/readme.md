# q-tabs

## Variants

Use `underline` for the default active indicator, `enclosed` for tabs connected
to panel content, `pills` for fully rounded choices, or `button` for separate
standard-radius buttons.

Tab buttons are capped at `94px` and truncate longer labels. Consumers can
override the cap with `--q-tabs-tab-max-width` when required.

```html
<q-tabs variant="underline"></q-tabs>
<q-tabs variant="enclosed"></q-tabs>
<q-tabs variant="pills"></q-tabs>
<q-tabs variant="button"></q-tabs>
```

<!-- Auto Generated Below -->


## Overview

Accessible tab selector for switching between consumer-owned tab panels.

## Properties

| Property      | Attribute     | Description                                                                                        | Type                                               | Default        |
| ------------- | ------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------- |
| `ariaLabel`   | `aria-label`  | Accessible name for the tab list.                                                                  | `string`                                           | `'Sections'`   |
| `items`       | `items`       | Tab records; strings use the same text for label and value.                                        | `TabItemInput[] \| string`                         | `[]`           |
| `orientation` | `orientation` | Direction of the tab list and its corresponding arrow-key navigation.                              | `"horizontal" \| "vertical"`                       | `'horizontal'` |
| `size`        | `size`        | Visual size preset.                                                                                | `"lg" \| "md" \| "sm"`                             | `'md'`         |
| `stretch`     | `stretch`     | Makes enabled tabs share the available width evenly.                                               | `boolean`                                          | `false`        |
| `value`       | `value`       | Value of the currently selected tab. The first enabled tab is used when it does not match an item. | `string`                                           | `''`           |
| `variant`     | `variant`     | Visual presentation of the tabs.                                                                   | `"button" \| "enclosed" \| "pills" \| "underline"` | `'underline'`  |


## Events

| Event     | Description                                                               | Type                  |
| --------- | ------------------------------------------------------------------------- | --------------------- |
| `qChange` | Emitted with the selected tab value after pointer or keyboard activation. | `CustomEvent<string>` |


## Shadow Parts

| Part             | Description                    |
| ---------------- | ------------------------------ |
| `"selected-tab"` | Currently selected tab button. |
| `"tab"`          | Individual tab button.         |
| `"tablist"`      | Scrollable tab-list container. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
