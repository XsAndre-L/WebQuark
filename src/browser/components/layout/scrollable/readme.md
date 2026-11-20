# q-scrollable



<!-- Auto Generated Below -->


## Overview

Scroll container with custom or native scrollbar styling.

## Properties

| Property         | Attribute          | Description                                                                                 | Type                   | Default    |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------------- | ---------------------- | ---------- |
| `autoHide`       | `auto-hide`        | Hides the custom scrollbar until hover, scroll, or drag activity.                           | `boolean`              | `true`     |
| `height`         | `height`           |                                                                                             | `string`               | `'100%'`   |
| `maxHeight`      | `max-height`       |                                                                                             | `string`               | `''`       |
| `mode`           | `mode`             | `custom` renders a WebQuark thumb; `native` styles browser scrollbars.                      | `"custom" \| "native"` | `'custom'` |
| `nativeOnMobile` | `native-on-mobile` | Uses native scrollbars on coarse-pointer devices.                                           | `boolean`              | `true`     |
| `target`         | `target`           | CSS selector for an external native-scroll target resolved from this component's root node. | `string`               | `''`       |


## Events

| Event     | Description | Type                                  |
| --------- | ----------- | ------------------------------------- |
| `qScroll` |             | `CustomEvent<QScrollableEventDetail>` |


## Methods

### `scrollToBottom() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `scrollToPosition(top: number) => Promise<void>`



#### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| `top` | `number` |             |

#### Returns

Type: `Promise<void>`




## Slots

| Slot | Description                                      |
| ---- | ------------------------------------------------ |
|      | Content rendered inside the scrollable viewport. |


## Shadow Parts

| Part         | Description                          |
| ------------ | ------------------------------------ |
| `"content"`  | Content wrapper inside the viewport. |
| `"thumb"`    | Custom scrollbar thumb.              |
| `"track"`    | Custom scrollbar track.              |
| `"viewport"` | Scrollable viewport element.         |


## Dependencies

### Used by

 - [q-syntax-box](../../data-display/syntax-box)
 - [q-syntax-view](../../data-display/syntax-view)

### Graph
```mermaid
graph TD;
  q-syntax-box --> q-scrollable
  q-syntax-view --> q-scrollable
  style q-scrollable fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
