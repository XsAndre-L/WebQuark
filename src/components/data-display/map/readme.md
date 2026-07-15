# q-map



<!-- Auto Generated Below -->


## Overview

Framework-neutral interactive map powered by Leaflet.

## Properties

| Property           | Attribute            | Description                                                                          | Type                                                | Default             |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------- |
| `ariaLabel`        | `aria-label`         | Accessible name for the interactive map region.                                      | `string`                                            | `'Interactive map'` |
| `attribution`      | `attribution`        | Plain-text tile-provider attribution.                                                | `string`                                            | `''`                |
| `attributionUrl`   | `attribution-url`    | Optional HTTP(S) destination for the attribution text.                               | `string`                                            | `''`                |
| `centerLatitude`   | `center-latitude`    | Initial and controlled center latitude.                                              | `number`                                            | `0`                 |
| `centerLongitude`  | `center-longitude`   | Initial and controlled center longitude.                                             | `number`                                            | `0`                 |
| `googleApiKey`     | `google-api-key`     | Browser-restricted Google Maps JavaScript API key used by the Google provider.       | `string`                                            | `''`                |
| `googleMapType`    | `google-map-type`    | Google base-map style used by the Google provider.                                   | `"hybrid" \| "roadmap" \| "satellite" \| "terrain"` | `'roadmap'`         |
| `markers`          | `markers`            | Marker records, or a JSON string containing marker records.                          | `QMapMarker[] \| string`                            | `[]`                |
| `maxZoom`          | `max-zoom`           | Highest permitted zoom level.                                                        | `number`                                            | `19`                |
| `minZoom`          | `min-zoom`           | Lowest permitted zoom level.                                                         | `number`                                            | `0`                 |
| `provider`         | `provider`           | Map imagery provider.                                                                | `"google" \| "tiles"`                               | `'tiles'`           |
| `selectedMarkerId` | `selected-marker-id` | Identifier of the marker rendered in the selected state.                             | `number \| string`                                  | `undefined`         |
| `tileUrl`          | `tile-url`           | URL template used by the tiles provider and as an optional Google-provider fallback. | `string`                                            | `''`                |
| `zoom`             | `zoom`               | Initial and controlled zoom level.                                                   | `number`                                            | `2`                 |


## Events

| Event           | Description                                                          | Type                                  |
| --------------- | -------------------------------------------------------------------- | ------------------------------------- |
| `qMarkerSelect` | Emitted when a marker is activated with a pointer or keyboard.       | `CustomEvent<QMapMarkerSelectDetail>` |
| `qReady`        | Emitted after Leaflet and the initial provider setup have completed. | `CustomEvent<void>`                   |


## Slots

| Slot      | Description                                                     |
| --------- | --------------------------------------------------------------- |
| `"empty"` | Content shown when the selected map provider is not configured. |


## Shadow Parts

| Part            | Description                        |
| --------------- | ---------------------------------- |
| `"attribution"` | Provider attribution text or link. |
| `"canvas"`      | Leaflet map canvas.                |
| `"empty"`       | Missing-configuration overlay.     |
| `"marker"`      | Each interactive map marker.       |
| `"surface"`     | Outer clipped map surface.         |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
