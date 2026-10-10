# q-image-comparison



<!-- Auto Generated Below -->


## Overview

Compare independently framed images by revealing Before from the left.

## Properties

| Property      | Attribute      | Description                                                                                                                        | Type        | Default              |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------- |
| `afterAlt`    | `after-alt`    | Accessible description of the After image.                                                                                         | `string`    | `''`                 |
| `afterCrop`   | --             | Source-percentage rectangle selected from After; omitted means the full image.                                                     | `ImageCrop` | `undefined`          |
| `afterLabel`  | `after-label`  | Caption for the right image.                                                                                                       | `string`    | `'After'`            |
| `afterSrc`    | `after-src`    | Source of the image revealed on the right.                                                                                         | `string`    | `''`                 |
| `ariaLabel`   | `aria-label`   | Accessible name of the comparison control.                                                                                         | `string`    | `'Image comparison'` |
| `aspectRatio` | `aspect-ratio` | Positive frame width / height ratio. Omitted derives from partial After, then Before, otherwise 16 / 9; invalid values use 16 / 9. | `number`    | `undefined`          |
| `beforeAlt`   | `before-alt`   | Accessible description of the Before image.                                                                                        | `string`    | `''`                 |
| `beforeCrop`  | --             | Source-percentage rectangle selected from Before; omitted means the full image.                                                    | `ImageCrop` | `undefined`          |
| `beforeLabel` | `before-label` | Caption for the left image.                                                                                                        | `string`    | `'Before'`           |
| `beforeSrc`   | `before-src`   | Source of the image revealed on the left.                                                                                          | `string`    | `''`                 |
| `position`    | `position`     | Percentage of Before revealed, clamped to 0–100.                                                                                   | `number`    | `50`                 |


## Events

| Event     | Description                                                             | Type                  |
| --------- | ----------------------------------------------------------------------- | --------------------- |
| `qChange` | Emits the numeric reveal percentage continuously for user changes only. | `CustomEvent<number>` |


## Shadow Parts

| Part                | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `"after-image"`     | Complete After image, uniformly scaled inside its viewport.  |
| `"after-label"`     |                                                              |
| `"after-layer"`     | Full-frame After layer.                                      |
| `"after-viewport"`  | Centered clip for the selected After region.                 |
| `"before-image"`    | Complete Before image, uniformly scaled inside its viewport. |
| `"before-label"`    |                                                              |
| `"before-layer"`    | Full-frame Before reveal plane.                              |
| `"before-viewport"` | Centered clip for the selected Before region.                |
| `"control"`         |                                                              |
| `"divider"`         |                                                              |
| `"frame"`           |                                                              |
| `"handle"`          |                                                              |
| `"status"`          |                                                              |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
