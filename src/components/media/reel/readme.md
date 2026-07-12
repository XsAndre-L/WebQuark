# q-reel



<!-- Auto Generated Below -->


## Overview

Gallery layout for q-thumbnail children with an optional modal lightbox.

## Properties

| Property   | Attribute  | Description                                                              | Type                   | Default  |
| ---------- | ---------- | ------------------------------------------------------------------------ | ---------------------- | -------- |
| `layout`   | `layout`   | Layout used for slotted q-thumbnail items.                               | `"carousel" \| "grid"` | `'grid'` |
| `lightbox` | `lightbox` | Enables the built-in fullscreen lightbox when thumbnails emit qMaximize. | `boolean`              | `true`   |


## Events

| Event            | Description                       | Type                |
| ---------------- | --------------------------------- | ------------------- |
| `qLightboxClose` | Emitted when the lightbox closes. | `CustomEvent<void>` |
| `qLightboxOpen`  | Emitted when the lightbox opens.  | `CustomEvent<void>` |


## Slots

| Slot | Description                       |
| ---- | --------------------------------- |
|      | One or more q-thumbnail elements. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
