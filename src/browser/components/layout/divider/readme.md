# q-divider

See the [component guide](../../../../../docs/components/q-divider.md) for examples and the container sizing contract. Auto fills the allocated host extent minus theme endpoint insets; vertical block-flow use requires an allocated height. Explicit lengths are centered and bounded.


<!-- Auto Generated Below -->


## Overview

Static, container-relative separator.

## Properties

| Property      | Attribute     | Description                                                                     | Type                                                               | Default        |
| ------------- | ------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------- |
| `decorative`  | `decorative`  | Hide a purely visual separator from assistive technology.                       | `boolean`                                                          | `false`        |
| `length`      | `length`      | CSS length or percentage, capped to the allocated extent minus endpoint insets. | `string`                                                           | `'auto'`       |
| `orientation` | `orientation` | Physical direction of the separator.                                            | `"horizontal" \| "vertical"`                                       | `'horizontal'` |
| `spacing`     | `spacing`     | Symmetric external spacing perpendicular to the line.                           | `"2xl" \| "3xl" \| "lg" \| "md" \| "none" \| "sm" \| "xl" \| "xs"` | `'lg'`         |


## Shadow Parts

| Part     | Description                 |
| -------- | --------------------------- |
| `"line"` | The visible separator line. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
