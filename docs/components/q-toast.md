# `q-toast`

`q-toast` provides global, short-lived mutation feedback while preserving the visual and theme contract of `q-alert`. Add one host near the application root and call the framework-neutral controller wherever a mutation completes or fails.

The [generated API reference](../../src/components/overlays/toast/readme.md) is canonical for exact properties, methods, types, defaults, and shadow parts.

## Minimal use

```html
<q-toast position="top-end" max-visible="3"></q-toast>
```

```ts
import { toast } from '@webquark/core';

toast.error(
  "Couldn't delete user",
  'System-protected accounts cannot be deleted.',
);
```

The controller also exposes `info`, `success`, `warning`, `danger`, `dismiss`, and `clear`. `error` is a convenience alias for the WebQuark `danger` variant. Each show method returns an opaque string ID synchronously.

## Durations and dismissal

- Info and success default to 5 seconds; warning defaults to 8 seconds.
- Danger/error is persistent by default. Set `duration: 0` to make any variant persistent.
- `dismissible` defaults to `true` and controls the visible close button.
- Hover, focus within a toast, and a hidden document pause auto-dismiss timers.

```ts
const id = toast.success('User saved', undefined, { duration: 3_000 });
toast.dismiss(id);
toast.clear();
```

The explicit component methods mirror the controller and return promises because Stencil custom-element methods are asynchronous.

## Accessibility

The host owns one polite, atomic live region for the queue. Individual `q-alert` visuals have announcements disabled so the same feedback is not spoken twice. Toasts never take focus. A focused or hovered toast pauses its timer so its dismiss control remains available.

Use concise titles and descriptions. Critical workflows that require acknowledgement belong in a dialog or inline alert, not a transient toast.

## Styling

Shadow parts:

- `stack`: visible toast stack.
- `item`: each toast wrapper.
- `announcement`: visually hidden shared live region.

Custom properties:

- `--q-toast-width`
- `--q-toast-inset`
- `--q-toast-gap`
- `--q-toast-shadow`
- `--q-toast-icon-size`

The component also consumes the existing alert, color, surface, shadow, transition, and `--q-z-index-toast` theme tokens. Toast visuals compose `q-alert`; use its public custom properties and parts for coordinated overrides.

## CEF, offline, and lifecycle

Built-in status icons are inline SVG, so error and success feedback does not depend on remote icon loading. The surface uses a solid theme background as its color-mix base. Add the host explicitly after the document is available; importing the controller is SSR-safe, but invoking it on the server throws a descriptive client-only error.

Only the first connected global host is active. A duplicate host reports a configuration error and remains inert. Disconnecting the active host clears its queue, timers, listeners, announcements, and pending animation cleanup.

## V1 limitations

V1 intentionally omits actions, updates, deduplication, custom icons, scoped hosts, and assertive/custom announcements. Calls made before the host connects buffer up to 50 items; exceeding either pre-host or pending capacity throws rather than silently dropping feedback.
