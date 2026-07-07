# q-carousel



<!-- Auto Generated Below -->


## Overview

A horizontal carousel viewport with optional arrow and dot navigation.

## Properties

| Property         | Attribute         | Description                                                                                           | Type                                     | Default   |
| ---------------- | ----------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------- |
| `itemWidth`      | `item-width`      | Sets the flex-basis/width for each slotted carousel item. Use "auto" to preserve natural item sizing. | `string`                                 | `'auto'`  |
| `repeat`         | `repeat`          | Wraps arrow and programmatic navigation from the first slide to the last, and back again.             | `boolean`                                | `false`   |
| `showArrows`     | `show-arrows`     | Shows previous and next arrow buttons over the carousel viewport.                                     | `boolean`                                | `false`   |
| `showIndicators` | `show-indicators` | Shows clickable slide indicator dots when the carousel can scroll.                                    | `boolean`                                | `false`   |
| `snapAlignment`  | `snap-alignment`  | Controls the CSS scroll-snap alignment applied to each slide.                                         | `"center" \| "end" \| "none" \| "start"` | `'start'` |


## Events

| Event          | Description                                | Type                                      |
| -------------- | ------------------------------------------ | ----------------------------------------- |
| `qSlideChange` | Fires when the active slide index changes. | `CustomEvent<QCarouselSlideChangeDetail>` |


## Methods

### `slideTo(index: number) => Promise<void>`

Scrolls the carousel to a zero-based slide index.

#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `index` | `number` |             |

#### Returns

Type: `Promise<void>`



### `updateLimits() => Promise<void>`

Recalculates slide offsets, scroll bounds, and navigation states.

#### Returns

Type: `Promise<void>`




## Slots

| Slot | Description             |
| ---- | ----------------------- |
|      | Carousel slide content. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
