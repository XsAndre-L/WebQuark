# Component guide: `q-thumbnail`

`q-thumbnail` is an interactive media preview designed for `q-reel` or standalone gallery use. It renders an image/poster, optional caption and play indicator, then emits media metadata when activated.

Canonical API: [generated Stencil reference](../../src/components/media/thumbnail/readme.md).

## Public contract

| Property | Attribute | Type | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `src` | `src` | `string` | `''` | Image or video-poster URL. |
| `video` | `video` | `boolean` | `false` | Adds a decorative video play indicator. |
| `label` | `label` | `string` | `undefined` | Visible caption and preferred accessible name. |
| `alt` | `alt` | `string` | `''` | Alternative text for the rendered image. |
| `highlighted` | `highlighted` | `boolean` | `false` | Applies the highlighted visual state. |

Event: `qMaximize` emits `{ src, label, video, alt, triggerEl }`. `q-reel` consumes this event to open its lightbox.

## Slots and structure

The default slot is an overlay region for badges or other non-conflicting custom content. The media, caption, and activation surface remain component-owned.

Avoid putting buttons or links into the default slot: the thumbnail itself has button semantics, so nested interactive controls create an ambiguous keyboard and accessibility model.

## UX and accessibility

- Pointer, Enter, and Space activate the thumbnail.
- The accessible name falls back from `label` to `alt` to `Media item`.
- Supply meaningful `alt` text even when `label` is visible. Use an empty `alt` only when the caption completely describes the image and duplicate announcement has been tested.
- `video` does not render a video element. `src` must remain a usable image/poster URL.
- There is no disabled state. Remove the listener or suppress the action at the consumer when activation is unavailable.

## Styling

Component tokens include `--q-thumb-aspect-ratio`, `--q-thumb-border`, `--q-thumb-border-color`, `--q-thumb-radius`, `--q-thumb-glow`, `--q-thumb-hover-transform`, and `--q-thumb-overlay-bg`. Global surface, primary, radius, shadow, font, and transition tokens provide fallbacks.

The default aspect ratio is controlled entirely with CSS, which keeps image layout stable before lazy-loaded media arrives.

## CEF/Unreal and performance

Images use native `loading="lazy"`. The component uses standard transforms and avoids backdrop filters. Keep thumbnails reasonably sized and serve dimensions appropriate to their displayed resolution to reduce decode memory in CEF/OSR environments.

## Example

```html
<q-thumbnail
  id="launch-preview"
  src="/media/launch-poster.webp"
  label="Product launch video"
  alt="Presenter standing beside the launch display"
  video
></q-thumbnail>
```

```js
const thumbnail = document.querySelector('#launch-preview');

thumbnail.addEventListener('qMaximize', (event) => {
  const { src, label, video, alt, triggerEl } = event.detail;
  openMediaViewer({ src, label, video, alt, returnFocusTo: triggerEl });
});
```

## Known limitations

- No native disabled/loading/error state or image-load events.
- Video mode is a poster affordance only.
- The activation event is named for maximize/lightbox usage even when consumers use it for other actions.
