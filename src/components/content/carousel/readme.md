# q-carousel



## Transitions

`transition="slide"` retains native horizontal scrolling. `crossfade` and `instant`
show one full-width slide at a time, using the tallest item's height. Arrows, dots,
`repeat`, `slideTo()` and `qSlideChange` work across all modes.

`transitionDuration` defaults to 500 milliseconds and controls only crossfade.
Instant has no animation; slide timing remains browser-controlled. Reduced motion
disables fading. Overlay modes support horizontal touch swipes and arrow keys;
vertical page scrolling and nested interactive controls retain their behavior.
Inactive overlay slides are inert and hidden from assistive technology. Authored
attributes are restored when leaving overlay mode or disconnecting. Consumers
remain responsible for pausing media in inactive slides and for autoplay policy.

<!-- Auto Generated Below -->


## Overview

A carousel with sliding, crossfade or instant transitions and shared navigation.

## Properties

| Property             | Attribute             | Description                                                                         | Type                                     | Default   |
| -------------------- | --------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------- | --------- |
| `itemWidth`          | `item-width`          | `auto` preserves each slotted item's natural width.                                 | `string`                                 | `'auto'`  |
| `repeat`             | `repeat`              | Wraps arrow and programmatic navigation at either end.                              | `boolean`                                | `false`   |
| `showArrows`         | `show-arrows`         |                                                                                     | `boolean`                                | `false`   |
| `showIndicators`     | `show-indicators`     | Shows clickable slide indicator dots when the carousel can scroll.                  | `boolean`                                | `false`   |
| `snapAlignment`      | `snap-alignment`      |                                                                                     | `"center" \| "end" \| "none" \| "start"` | `'start'` |
| `transition`         | `transition`          | Animation used when selecting a slide. Overlay modes show one full-width item.      | `"crossfade" \| "instant" \| "slide"`    | `'slide'` |
| `transitionDuration` | `transition-duration` | Crossfade duration in milliseconds; native sliding keeps browser-controlled timing. | `number`                                 | `500`     |


## Events

| Event          | Description | Type                                      |
| -------------- | ----------- | ----------------------------------------- |
| `qSlideChange` |             | `CustomEvent<QCarouselSlideChangeDetail>` |


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

| Slot               | Description                                    |
| ------------------ | ---------------------------------------------- |
|                    | Carousel slide content.                        |
| `"controls-extra"` | Additional content below the slide indicators. |


## Shadow Parts

| Part         | Description                                             |
| ------------ | ------------------------------------------------------- |
| `"controls"` | Container shared by indicators and additional controls. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
