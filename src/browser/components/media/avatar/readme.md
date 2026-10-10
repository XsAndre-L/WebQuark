# q-avatar



<!-- Auto Generated Below -->


## Overview

Compact identity image with an initials or consumer-supplied fallback.

## Properties

| Property   | Attribute  | Description                                                                               | Type                                            | Default     |
| ---------- | ---------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------- |
| `alt`      | `alt`      | Accessible image text. Set an explicit empty string when the avatar is decorative.        | `string`                                        | `undefined` |
| `initials` | `initials` | Explicit fallback text. Values are normalized to at most two visible characters.          | `string`                                        | `undefined` |
| `loading`  | `loading`  | Native image loading policy.                                                              | `"eager" \| "lazy"`                             | `'lazy'`    |
| `name`     | `name`     | Name used to derive fallback initials and, unless `alt` is supplied, the accessible name. | `string`                                        | `undefined` |
| `shape`    | `shape`    |                                                                                           | `"circle" \| "rounded" \| "square"`             | `'circle'`  |
| `size`     | `size`     | Preset, pixel number, or CSS size.                                                        | `"lg" \| "md" \| "sm" \| number \| string & {}` | `'md'`      |
| `src`      | `src`      | Image source. An empty value renders the fallback immediately.                            | `string`                                        | `undefined` |


## Events

| Event    | Description | Type                |
| -------- | ----------- | ------------------- |
| `qError` |             | `CustomEvent<void>` |
| `qLoad`  |             | `CustomEvent<void>` |


## Slots

| Slot         | Description                                              |
| ------------ | -------------------------------------------------------- |
| `"fallback"` | Custom fallback content used when no image is available. |


## Shadow Parts

| Part          | Description                                    |
| ------------- | ---------------------------------------------- |
| `"container"` | Avatar surface and accessible image container. |
| `"fallback"`  | Initials or custom fallback content.           |
| `"image"`     | Native image element.                          |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
