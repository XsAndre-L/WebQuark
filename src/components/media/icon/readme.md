# q-icon

`q-icon` resolves trusted compile-time definitions before any URL-based source.
Applications can register exactly the icons they use and turn off every network
fallback before WebQuark components are defined:

```ts
import { Bell, CircleAlert } from '@lucide/icons';
import { configureQIcons, registerQIcons } from '@webquark/core';
import { defineCustomElements } from '@webquark/core/loader';

registerQIcons({
  bell: Bell,
  'circle-alert': CircleAlert,
});
configureQIcons({ strict: true });
defineCustomElements();
```

`registerQIcons()` validates the complete map and atomically replaces the
previous registry. Use one app-owned manifest per application. Registered icons
and the `definition` property render synchronously as SVG nodes. They never use
`fetch()`, `innerHTML`, DOM parsing, or sanitization.

With `strict: true`, an unknown name renders the built-in fallback and cannot
resolve a Lucide CDN, Font Awesome CDN, local path, or custom URL. Configure
strict mode before defining or bootstrapping components. The default remains
`strict: false` for backwards compatibility with existing consumers.



<!-- Auto Generated Below -->


## Overview

Synchronous registered icon renderer with optional backwards-compatible URL loading.

## Properties

| Property       | Attribute       | Description                                                                             | Type                                                                    | Default            |
| -------------- | --------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------ |
| `color`        | `color`         |                                                                                         | `"currentColor" \| string & {}`                                         | `'currentColor'`   |
| `definition`   | --              | Trusted compile-time icon data. Takes precedence over `name` and never performs I/O.    | `QIconDefinition`                                                       | `undefined`        |
| `fetchTimeout` | `fetch-timeout` | SVG fetch timeout in milliseconds.                                                      | `number`                                                                | `8000`             |
| `label`        | `label`         | Meaningful icons require a label; unlabeled icons are hidden from assistive technology. | `string`                                                                | `undefined`        |
| `lib`          | `lib`           | Supports built-in libraries, local assets, and custom URL templates.                    | `"font-awesome" \| "fontawesome" \| "local" \| "lucide" \| string & {}` | `'lucide'`         |
| `libVersion`   | `lib-version`   | Overrides the version of built-in remote libraries.                                     | `string`                                                                | `undefined`        |
| `localPath`    | `local-path`    | Base path used when `lib="local"`.                                                      | `string`                                                                | `'/assets/icons/'` |
| `name`         | `name`          | Icon name or local asset filename.                                                      | `string`                                                                | `undefined`        |
| `size`         | `size`          | Accepts a preset, pixel number, or CSS size.                                            | `"lg" \| "md" \| "sm" \| number \| string & {}`                         | `'md'`             |


## Shadow Parts

| Part         | Description                                               |
| ------------ | --------------------------------------------------------- |
| `"fallback"` | Error fallback shown when an icon cannot load.            |
| `"image"`    | Native image used for binary icon assets.                 |
| `"svg"`      | Container for registered or sanitized inline SVG content. |


## Dependencies

### Used by

 - [q-button](../../actions/button)
 - [q-data-table](../../data-display/data-table)
 - [q-map](../../data-display/map)
 - [q-navbar](../../layout/navbar)
 - [q-radio-group](../../inputs/radio-group)
 - [q-sidepanel](../../layout/sidepanel)
 - [q-syntax-box](../../data-display/syntax-box)
 - [q-tabs](../../layout/tabs)

### Graph
```mermaid
graph TD;
  q-button --> q-icon
  q-data-table --> q-icon
  q-map --> q-icon
  q-navbar --> q-icon
  q-radio-group --> q-icon
  q-sidepanel --> q-icon
  q-syntax-box --> q-icon
  q-tabs --> q-icon
  style q-icon fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
