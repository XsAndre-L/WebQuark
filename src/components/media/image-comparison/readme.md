# q-image-comparison



<!-- Auto Generated Below -->


## Overview

Compare two complete images in a stable frame by revealing Before from the left.

## Properties

| Property      | Attribute      | Description                                               | Type     | Default              |
| ------------- | -------------- | --------------------------------------------------------- | -------- | -------------------- |
| `afterAlt`    | `after-alt`    | Accessible description of the After image.                | `string` | `''`                 |
| `afterLabel`  | `after-label`  | Caption for the right image.                              | `string` | `'After'`            |
| `afterSrc`    | `after-src`    | Source of the image revealed on the right.                | `string` | `''`                 |
| `ariaLabel`   | `aria-label`   | Accessible name of the comparison control.                | `string` | `'Image comparison'` |
| `aspectRatio` | `aspect-ratio` | Positive width / height ratio; invalid values use 16 / 9. | `number` | `16 / 9`             |
| `beforeAlt`   | `before-alt`   | Accessible description of the Before image.               | `string` | `''`                 |
| `beforeLabel` | `before-label` | Caption for the left image.                               | `string` | `'Before'`           |
| `beforeSrc`   | `before-src`   | Source of the image revealed on the left.                 | `string` | `''`                 |
| `position`    | `position`     | Percentage of Before revealed, clamped to 0–100.          | `number` | `50`                 |


## Events

| Event     | Description                                                             | Type                  |
| --------- | ----------------------------------------------------------------------- | --------------------- |
| `qChange` | Emits the numeric reveal percentage continuously for user changes only. | `CustomEvent<number>` |


## Shadow Parts

| Part             | Description |
| ---------------- | ----------- |
| `"after-image"`  |             |
| `"after-label"`  |             |
| `"before-image"` |             |
| `"before-label"` |             |
| `"control"`      |             |
| `"divider"`      |             |
| `"frame"`        |             |
| `"handle"`       |             |
| `"status"`       |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
