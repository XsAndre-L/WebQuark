# q-media



<!-- Auto Generated Below -->


## Overview

Generic media API scaffold. Native media rendering is deferred; consumers should continue using their existing media renderer.

## Properties

| Property  | Attribute | Description | Type                           | Default   |
| --------- | --------- | ----------- | ------------------------------ | --------- |
| `alt`     | `alt`     |             | `string`                       | `''`      |
| `kind`    | `kind`    |             | `"file" \| "image" \| "video"` | `'image'` |
| `loading` | `loading` |             | `"eager" \| "lazy"`            | `'lazy'`  |
| `src`     | `src`     |             | `string`                       | `''`      |


## Slots

| Slot         | Description             |
| ------------ | ----------------------- |
|              | Consumer-owned content. |
| `"fallback"` | Placeholder content.    |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
