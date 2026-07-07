# q-thumbnail



<!-- Auto Generated Below -->


## Overview

Media thumbnail that emits qMaximize for gallery and reel lightbox workflows.

## Properties

| Property      | Attribute     | Description                                                       | Type      | Default     |
| ------------- | ------------- | ----------------------------------------------------------------- | --------- | ----------- |
| `alt`         | `alt`         | Alternative text for the thumbnail image.                         | `string`  | `''`        |
| `highlighted` | `highlighted` | Applies the highlighted visual state.                             | `boolean` | `false`     |
| `label`       | `label`       | Visible caption text and preferred accessible label.              | `string`  | `undefined` |
| `src`         | `src`         | Image or poster URL rendered by the thumbnail.                    | `string`  | `''`        |
| `video`       | `video`       | Marks the media as video and renders a decorative play indicator. | `boolean` | `false`     |


## Events

| Event       | Description                              | Type                                    |
| ----------- | ---------------------------------------- | --------------------------------------- |
| `qMaximize` | Emitted when the thumbnail is activated. | `CustomEvent<QThumbnailMaximizeDetail>` |


## Slots

| Slot | Description                                                |
| ---- | ---------------------------------------------------------- |
|      | Custom overlay content rendered above the thumbnail media. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
