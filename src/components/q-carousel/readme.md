# q-carousel



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description | Type                                     | Default   |
| ---------------- | ----------------- | ----------- | ---------------------------------------- | --------- |
| `itemWidth`      | `item-width`      |             | `string`                                 | `"auto"`  |
| `repeat`         | `repeat`          |             | `boolean`                                | `false`   |
| `showArrows`     | `show-arrows`     |             | `boolean`                                | `false`   |
| `showIndicators` | `show-indicators` |             | `boolean`                                | `false`   |
| `snapAlignment`  | `snap-alignment`  |             | `"center" \| "end" \| "none" \| "start"` | `'start'` |


## Events

| Event          | Description | Type                                                    |
| -------------- | ----------- | ------------------------------------------------------- |
| `qSlideChange` |             | `CustomEvent<{ index: number; element: HTMLElement; }>` |


## Methods

### `slideTo(index: number) => Promise<void>`



#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `index` | `number` |             |

#### Returns

Type: `Promise<void>`



### `updateLimits() => Promise<void>`



#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
