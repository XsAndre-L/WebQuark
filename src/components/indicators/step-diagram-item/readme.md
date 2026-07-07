# q-step-diagram-item



<!-- Auto Generated Below -->


## Overview

Interactive step item for q-step-diagram sequences.

## Properties

| Property    | Attribute    | Description                                                          | Type                                                                         | Default       |
| ----------- | ------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------- |
| `layout`    | `layout`     | Layout inherited from q-step-diagram and reflected for host styling. | `"horizontal" \| "vertical"`                                                 | `'vertical'`  |
| `lineStyle` | `line-style` | Connector line style shown after the step.                           | `"dashed" \| "dotted" \| "none" \| "solid"`                                  | `'solid'`     |
| `status`    | `status`     | Visual and semantic state of the step.                               | `"active" \| "completed" \| "danger" \| "pending" \| "success" \| "warning"` | `'completed'` |


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
