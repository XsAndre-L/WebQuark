# Component guide: `q-map`

`q-map` is a framework-neutral, Leaflet-backed map surface for displaying selectable locations. It owns map setup, provider rendering, marker reconciliation, viewport sizing, keyboard marker activation, and cleanup while the consuming application owns location retrieval and all domain behavior.

Use it for store locations, team positions, visit evidence, or other point-based spatial views. Do not use the map as the only way to expose important information or actions.

Canonical API: [generated Stencil reference](../../src/components/data-display/map/readme.md).

## Public contract

| Property | Attribute | Type | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `provider` | `provider` | `'tiles' \| 'vector' \| 'google'` | `'tiles'` | Map imagery provider. |
| `tileUrl` | `tile-url` | `string` | `''` | Tile URL template used when `provider` is `tiles`, and as an optional fallback if vector or Google initialization fails. An empty value shows the tiles-provider empty state. |
| `tilePreloadBuffer` | `tile-preload-buffer` | `number` | `0` | Whole raster-tile rings preloaded beyond each viewport edge, rounded and clamped to `0`–`4`. Higher values use more network, decode memory, and rendering work. |
| `vectorStyleUrl` | `vector-style-url` | `string` | `''` | MapLibre Style Specification URL required by the vector provider. |
| `vectorPadding` | `vector-padding` | `number` | `0.2` | Relative offscreen vector-rendering padding clamped to `0`–`0.5`. |
| `googleApiKey` | `google-api-key` | `string` | `''` | Browser-restricted key used when WebQuark must load Google Maps. It may remain empty when the application already exposes `google.maps.Map` or `google.maps.importLibrary`. |
| `googleMapType` | `google-map-type` | `'roadmap' \| 'satellite' \| 'terrain' \| 'hybrid'` | `'roadmap'` | Google base-map style. |
| `attribution` | `attribution` | `string` | `''` | Visible attribution label for the tiles provider. |
| `attributionUrl` | `attribution-url` | `string` | `''` | Optional HTTP(S) link target for the attribution label. Unsupported URL schemes render as plain text. |
| `centerLatitude` | `center-latitude` | `number` | `0` | Initial and controlled viewport latitude. |
| `centerLongitude` | `center-longitude` | `number` | `0` | Initial and controlled viewport longitude. |
| `zoom` | `zoom` | `number` | `2` | Initial and controlled zoom level. |
| `minZoom` | `min-zoom` | `number` | `0` | Lowest permitted zoom level. |
| `maxZoom` | `max-zoom` | `number` | `19` | Highest permitted zoom level. |
| `maxBounds` | `max-bounds` | `QMapBounds \| string` | `undefined` | Optional geographic boundary that constrains user panning. Accepts a JavaScript object or JSON object string. |
| `maxBoundsViscosity` | `max-bounds-viscosity` | `number` | `1` | Boundary resistance clamped to `0`–`1`; `1` creates a hard drag boundary. |
| `markers` | `markers` | `QMapMarker[] \| string` | `[]` | Marker records supplied as a JavaScript array or JSON array string. Prefer property assignment. |
| `selectedMarkerId` | `selected-marker-id` | `string \| number` | `undefined` | ID of the marker rendered in the selected state. |
| `ariaLabel` | `aria-label` | `string` | `'Interactive map'` | Accessible name for the map region. |

`QMapMarker` contains a stable `id` (`string` or `number`), finite `latitude` and `longitude`, a human-readable `label`, and an optional `variant` of `default`, `success`, `warning`, `danger`, or `muted`. Unsupported variants normalize to `default`. ID identity is type-stable, so numeric `1` and string `'1'` are independent markers and selection values. When clustering is enabled, `clusterable: false` keeps that marker independently visible; omitted or invalid values default to `true`. Standalone markers never contribute to a cluster's count or `markerIds`.

`QMapBounds` contains `southLatitude`, `westLongitude`, `northLatitude`, and `eastLongitude`. Coordinates must be finite and in the normal latitude/longitude ranges, the south value must be below the north value, and the west value must be below the east value. `undefined` and an empty string intentionally clear the boundary. Invalid non-empty or antimeridian-crossing input emits `qError` and preserves the last valid runtime boundary.

Events:

- `qReady` fires after Leaflet setup and the initial provider attempt complete. It has no detail payload. A configured provider can still finish in `error`; use `qStatusChange` or `qError` for provider outcome.
- `qMarkerSelect` emits `{ marker, originalEvent }` when a marker is activated. Selection remains controlled by `selectedMarkerId`.
- `qStatusChange` emits `{ status, requestedProvider, activeProvider, usingFallback }` when provider state changes. `status` is `initializing`, `ready`, `empty`, or `error`; `activeProvider` is omitted when no imagery is active.
- `qError` emits a serializable `{ code, message, requestedProvider, recoverable }` detail for bounds, Leaflet, requested-provider, and fallback failures. Codes are `invalid-max-bounds`, `leaflet-initialization-failed`, `provider-initialization-failed`, and `fallback-initialization-failed`.

Slot:

- `empty` replaces the default `Map provider is not configured.` content shown when the requested provider lacks its required URL or key. It is not a no-markers state.
- `error` replaces the visible provider-error message shown when initialization fails without a usable fallback. If an attempted provider swap fails, the last working imagery remains mounted behind this message.

Shadow parts:

- `surface`: outer map surface.
- `canvas`: Leaflet-owned map canvas.
- `marker`: every component-owned marker control.
- `attribution`: visible provider attribution.
- `empty`: missing-configuration state.
- `error`: failed-provider state.

## Provider status and failures

Provider changes are transactional. `q-map` keeps the current layer mounted while a replacement loads, attaches the replacement before removing the old layer, and discards stale asynchronous results when configuration changes again. A missing required URL or key is an intentional `empty` state and removes the active layer.

If vector or Google initialization fails and `tileUrl` is configured, the component emits `qError` for the requested-provider failure and then reports `ready` with `activeProvider: 'tiles'` and `usingFallback: true`. If no fallback succeeds, the component reports `error`, exposes a visible alert, and preserves the last working layer when one exists. Applications should log or surface `qError` as appropriate and use `qStatusChange` to drive surrounding loading/status UI.

```js
map.addEventListener('qStatusChange', event => {
  const { status, activeProvider, usingFallback } = event.detail;
  updateMapStatus({ status, activeProvider, usingFallback });
});

map.addEventListener('qError', event => {
  reportMapFailure(event.detail);
});
```

## Accessibility

- Give `ariaLabel` a view-specific name such as `Current team locations` rather than relying on the generic default.
- Every marker uses its `label` as its accessible name and supports pointer and keyboard activation.
- Provide the same locations and important actions in a list, table, or detail panel. A spatial canvas cannot replace structured content for keyboard and screen-reader users.
- Do not encode status only through marker colour. Include status in the marker label or adjacent structured content.
- Attribution remains visible and should accurately identify the configured tile provider. The Google provider uses the legal controls supplied by Google Maps and does not render the component's custom attribution.
- `aria-busy` is applied to the map region while provider setup is in progress, the empty state uses `role="status"`, and the provider-error state uses `role="alert"`. There is no disabled property; applications should compose disabled interaction around the component when required.

## Styling

Component tokens include `--q-map-height`, `--q-map-min-height`, `--q-map-bg`, `--q-map-border`, `--q-map-radius`, `--q-map-marker-size`, `--q-map-marker-color`, `--q-map-marker-success`, `--q-map-marker-warning`, `--q-map-marker-danger`, `--q-map-marker-muted`, `--q-map-marker-selected-color`, `--q-map-attribution-bg`, `--q-map-attribution-color`, and `--q-map-tile-filter`. The tile filter is applied once to Leaflet's raster tile pane.

The `surface`, `canvas`, `marker`, `attribution`, `empty`, and `error` shadow parts support focused overrides that cannot be expressed through tokens. Prefer tokens for theme-level changes and parts for one-off composition.

The host must have usable dimensions. The defaults provide a minimum height, while a full-page map should place `q-map` inside a parent with an explicit height and set `--q-map-height: 100%`.

## CEF/Unreal and performance

`q-map` lazy-loads Leaflet when connected, disables inertia, and uses smooth fade, marker-zoom, and zoom animations unless the user prefers reduced motion. It uses ordinary DOM markers and solid theme surfaces without `backdrop-filter`. Map providers still rely on network access and image decoding, so validate delivery in the target CEF build and use the tiles provider with an appropriate source when offline support is required.

The component reconciles markers by stable ID and observes container resizing rather than rebuilding the map for every application update. Keep marker IDs stable and assign a new marker array when its content changes. Enable `clusterMarkers` for large point collections, and use `clusterable: false` only for markers that must remain independent.

Avoid rapid whole-array replacement when positions have not changed. Tile images and large marker collections can increase decode memory and compositing cost in off-screen rendering environments. Keep `tilePreloadBuffer` at `0` on constrained clients unless the smoother edge coverage is worth the additional tile work.

## Basic example

```html
<q-map
  aria-label="Johannesburg stores"
  tile-url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution="© OpenStreetMap contributors"
  attribution-url="https://www.openstreetmap.org/copyright"
  center-latitude="-26.2041"
  center-longitude="28.0473"
  zoom="12"
></q-map>
```

Applications must configure a tile provider, preserve its required attribution, and comply with its usage policy. The OpenStreetMap configuration above is an example rather than a component default.

## Constrained movement

Use `maxBounds` to keep user panning inside an application-owned geographic area. Prefer assigning a JavaScript object; the JSON attribute form is available for static HTML and sandbox use.

```html
<q-map
  tile-url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
  center-latitude="-26.2041"
  center-longitude="28.0473"
  zoom="11"
  min-zoom="9"
  max-bounds='{ "southLatitude": -26.65, "westLongitude": 27.54, "northLatitude": -25.75, "eastLongitude": 28.55 }'
  max-bounds-viscosity="1"
></q-map>
```

Bounds constrain panning but do not automatically raise `minZoom`. Consumers that must prevent the viewport from showing outside the permitted area should also choose a `minZoom` appropriate to the component's rendered dimensions. Valid updates and intentional clears take effect without rebuilding the map. Malformed non-empty updates emit `qError` and retain the prior constraint so invalid application data cannot silently disable a safety boundary.

## Google Maps provider

The optional Google provider loads the official Maps JavaScript API and uses GoogleMutant to present Google's map imagery as a Leaflet grid layer. It is not a visual imitation or a recoloured third-party tile set.

```html
<q-map
  provider="google"
  google-api-key="YOUR_BROWSER_RESTRICTED_KEY"
  google-map-type="roadmap"
  center-latitude="-26.2041"
  center-longitude="28.0473"
  zoom="11"
></q-map>
```

Google Maps Platform must be enabled for the key and may require billing. The key is necessarily visible to the browser, so keep it out of source control and restrict it by API, allowed origin, and quota. Do not cache Google imagery or obscure, restyle, or remove Google's logo and legal attribution controls. GoogleMutant moves those controls into the component's shadow root; confirm that they remain visible and legible in every supported runtime before production use.

Google's scripts require a compatible Content Security Policy. Follow Google's current [Maps JavaScript API CSP guidance](https://developers.google.com/maps/documentation/javascript/content-security-policy) rather than copying a fixed domain list indefinitely. An application-owned `google.maps.importLibrary` is reused. WebQuark-owned failed script attempts are cleaned up so a corrected API key can be retried; after Google Maps has loaded, its page-global configuration is reused rather than replaced. If Google initialization fails and `tileUrl` is configured, `q-map` uses that tile source and its attribution as a safe fallback. Otherwise, changing `tileUrl`, `attribution`, or `attributionUrl` has no effect while Google is active.

## Stateful marker selection

```html
<q-map id="store-map" aria-label="Available stores"></q-map>

<script type="module">
  const map = document.querySelector('#store-map');

  map.tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  map.attribution = '© OpenStreetMap contributors';
  map.attributionUrl = 'https://www.openstreetmap.org/copyright';
  map.markers = [
    { id: 'rosebank', latitude: -26.1459, longitude: 28.0416, label: 'Rosebank store, active', variant: 'success' },
    { id: 'sandton', latitude: -26.1076, longitude: 28.0567, label: 'Sandton store, attention required', variant: 'warning' },
  ];

  map.addEventListener('qMarkerSelect', event => {
    map.selectedMarkerId = event.detail.marker.id;
    openStoreDetails(event.detail.marker.id);
  });
</script>
```

Angular, React, Vue, and other consumers should retrieve their own data, map it to `QMapMarker` records, and assign the resulting array through the generated wrapper or element property. `q-map` never calls an application API.

## Known limitations

- `q-map` renders tile layers and point markers only; it does not provide paths, polygons, heatmaps, geocoding, directions, or route optimization.
- It does not collect GPS positions, store history, determine online status, enforce permissions, or provide polling/WebSocket transport.
- Provider availability, licensing, attribution, rate limits, caching, and offline behavior belong to the consuming application and provider. Google Maps imagery must not be cached for offline use.
- `ready` means the provider layer was created and attached; later per-tile HTTP or image failures are handled by Leaflet and do not transition `qStatusChange`. Applications that need service-level availability should monitor their imagery provider separately.
- GoogleMutant depends on Google Maps internals and can show short-lived alignment artifacts while zooming or panning; validate it against the supported browser and CEF versions.
- The current contract does not emit viewport-change events or expose imperative pan, zoom, or fit-to-markers methods.
- Marker content is intentionally fixed and text-only; arbitrary popup HTML is not accepted.
