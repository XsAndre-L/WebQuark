# q-step-diagram-item



<!-- Auto Generated Below -->


## Overview

Interactive step item for q-step-diagram sequences.

## Properties

| Property      | Attribute     | Description                                                                                                     | Type                                                                         | Default       |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------- |
| `layout`      | `layout`      | <span style="color:red">**[DEPRECATED]**</span> Use orientation. Used only when orientation is unset.<br/><br/> | `"horizontal" \| "vertical"`                                                 | `'vertical'`  |
| `lineStyle`   | `line-style`  |                                                                                                                 | `"dashed" \| "dotted" \| "none" \| "solid"`                                  | `'solid'`     |
| `orientation` | `orientation` | Direction of the step. A q-step-diagram parent supplies its orientation; standalone default is vertical.        | `"horizontal" \| "vertical"`                                                 | `undefined`   |
| `status`      | `status`      |                                                                                                                 | `"active" \| "completed" \| "danger" \| "pending" \| "success" \| "warning"` | `'completed'` |


## Events

| Event        | Description                                                                       | Type                |
| ------------ | --------------------------------------------------------------------------------- | ------------------- |
| `qItemClick` | Emitted when the focusable step content is clicked or activated with Enter/Space. | `CustomEvent<void>` |


## Slots

| Slot      | Description                    |
| --------- | ------------------------------ |
|           | Step body content.             |
| `"badge"` | Optional custom badge content. |
| `"title"` | Step title content.            |


## Shadow Parts

| Part          | Description                   |
| ------------- | ----------------------------- |
| `"badge"`     | Decorative badge node.        |
| `"body"`      | Step body wrapper.            |
| `"connector"` | Connector line between steps. |
| `"content"`   | Focusable content button.     |
| `"title"`     | Step title wrapper.           |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
