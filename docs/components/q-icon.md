# 🧩 Component Specification: `q-icon`

> Contract note: see [Current public contracts](./current-contracts.md#q-icon) and the [generated API](../../src/components/media/icon/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

The `<q-icon>` is a versatile icon rendering utility. It supports dynamic inline SVG injection from major remote libraries (Lucide, FontAwesome), customizable CDN source URLs, local offline assets (SVG or binary formats), preset sizing aliases, and auto-fallback error handling.

Icon loading is intentionally non-blocking. The host hydrates at its configured
size immediately, then fills in fetched SVG content when it becomes available,
so icon network I/O cannot delay the hydration of a parent component.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `name` | `string` | `undefined` | The name of the icon (e.g., `'settings'`, `'heart'`) or a filename (e.g. `'logo.png'`). |
| `lib` | `lib` | `string` | `'lucide'` | The source library. Options: `'lucide'`, `'font-awesome'`, `'local'`, or a custom CDN URL template containing `{name}`. |
| `size` | `size` | `string` | `'md'` | Sizing alias (`'sm'`, `'md'`, `'lg'`), raw pixel numeric string (e.g. `'20'`), or any valid CSS length (e.g. `'2rem'`). |
| `color` | `color` | `string` | `'currentColor'` | Icon fill/stroke color mapping. Defaults to inheriting from host container color. |
| `localPath` | `local-path` | `string` | `'/assets/icons/'` | The default path mapping for local assets when `lib` is set to `'local'`. |

---

## 2. Slots

None.

---

## 3. Events

None.

---

## 4. Visual Variants

The component renders in different formats based on the resolved icon attributes:

### Variant A: Library Sources (`lib`)
*   **Lucide (`'lucide'`)**: Pulls inline SVGs dynamically from JSDelivr CDNs.
*   **FontAwesome (`'font-awesome'`)**: Pulls solid FontAwesome inline SVGs from JSDelivr CDNs.
*   **Local (`'local'`)**: Maps to local project folder directories matching `localPath`. Resolves inline SVGs or binary image tags.
*   **Custom URLs**: Passes custom CDNs (e.g. `https://mycdn.com/icons/{name}.svg`).

### Variant B: Preset Sizes (`size`)
*   **Small (`size="sm"`)**: Size is locked to `16px`.
*   **Medium (`size="md"`)**: Size is locked to `24px`.
*   **Large (`size="lg"`)**: Size is locked to `32px`.
*   *Numeric strings (e.g. `'48'`) are automatically converted to pixel heights (`48px`). Standard CSS strings (e.g. `'1.5rem'`) pass directly.*

### Variant C: Media Formats (SVG vs. Raster)
*   **SVG inline Injection**: Fetches the SVG text content and renders it inline inside the shadow container, allowing native CSS stroke and color mapping.
*   **Binary Images (`isBinary`)**: For `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.ico` names, it renders a native `<img>` with `object-fit: contain` bounds.

### Variant D: Fallback Error State (`hasError`)
*   If network calls fail or binary sources throw errors, the component swaps the content with a preset red error box (`.icon-fallback`) displaying an exclamation mark SVG layout.

---

## 5. Typography & Font Styles

*   The component is decorative and does not render text.
*   Size is constrained via host bounds (`width` / `height`).

---

## 6. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-color-danger` | `#f87171` | Outline color of the error fallback icon block. |

---

## 7. Implementation source

The implementation is intentionally not duplicated in this guide. Use the generated API linked at the top of the page for the canonical public contract and the component's TypeScript source for implementation details. This avoids stale source snapshots in authored documentation.

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **Network Request Whitelists**: In remote mode (`lib="lucide"`), icons are fetched at runtime via `fetch()`. Inside Unreal CEF/OSR plugins, verify that internet connections are whitelisted in game engine parameters, otherwise CDN requests will fail. If offline rendering is required, package icons into local game bundles and load them via `lib="local"`.
*   **Raster Formats**: Raster binary image formats (`.png`, `.webp`) resolve to standard `<img>` tags. This bypasses CORS and XML processing limits associated with complex SVG vector rendering on older webviews.
*   **No XML SMIL Animations**: Avoid using `<animate>` or `<animateTransform>` tags inside custom local SVGs. Older CEF versions cannot render XML-based vectors at solid frame rates. Use standard CSS animations on the shadow host instead.

---

## 9. Developer Guidelines & Examples

### Lucide Icon
```html
<q-icon name="settings" lib="lucide" size="md" color="#60a5fa"></q-icon>
```

### FontAwesome Icon
```html
<q-icon name="coffee" lib="font-awesome" size="lg"></q-icon>
```

### Custom Sizing
```html
<q-icon name="user" size="64" color="white"></q-icon>
<q-icon name="bell" size="2rem"></q-icon>
```

### Local Raster Assets (Offline Mode)
```html
<q-icon name="company-logo.png" lib="local" local-path="/assets/brand/" size="lg"></q-icon>
```
