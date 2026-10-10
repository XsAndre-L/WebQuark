# q-step-diagram



<!-- Auto Generated Below -->


## Overview

Groups step diagram items into a vertical or horizontal sequence.

## Properties

| Property      | Attribute     | Description                                                                                                     | Type                         | Default      |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------ |
| `ariaLabel`   | `aria-label`  | Accessible label for the step sequence.                                                                         | `string`                     | `'Steps'`    |
| `layout`      | `layout`      | <span style="color:red">**[DEPRECATED]**</span> Use orientation. Used only when orientation is unset.<br/><br/> | `"horizontal" \| "vertical"` | `'vertical'` |
| `orientation` | `orientation` | Direction of the sequence and its items. Overrides layout; defaults to vertical when both are omitted.          | `"horizontal" \| "vertical"` | `undefined`  |


## Slots

| Slot | Description                                       |
| ---- | ------------------------------------------------- |
|      | Accepts one or more q-step-diagram-item elements. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
