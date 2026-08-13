# q-avatar

`q-avatar` displays a compact person, organization, or agent identity. It uses a
native image when `src` loads and falls back to initials or consumer-supplied
content without causing layout shift.

Remote images use a `no-referrer` policy so the embedding page URL is not
disclosed to the image host. Applications handling user-provided media should
still proxy and validate remote assets before production use.

The generated [API reference](../../src/components/media/avatar/readme.md) is
canonical for exact types and defaults.

## Usage

```html
<q-avatar name="Maya Dlamini" src="/profiles/maya.jpg"></q-avatar>
<q-avatar name="Theo Jacobs" size="lg"></q-avatar>
```

Use `name` as the normal accessible name and fallback source. Set `alt` when the
image needs a different accessible name. Set `alt=""` only when nearby text
already identifies the same subject and the avatar is decorative.

The `fallback` slot can replace generated initials. Fallback content is visual;
the avatar's accessible name still comes from `alt` or `name`.

```html
<q-avatar name="Support agent">
  <q-icon slot="fallback" name="sparkles" aria-hidden="true"></q-icon>
</q-avatar>
```

## Behavior

- `size` accepts `sm`, `md`, `lg`, a positive pixel number, or a CSS size.
- `shape` accepts `circle`, `rounded`, or `square`.
- `loading` maps to the native image loading policy.
- `qLoad` and `qError` report image completion or failure. An error immediately
  switches to the fallback while preserving the component dimensions.
- The component is not interactive and introduces no tab stop.

## Styling

Use `--q-avatar-size-sm`, `--q-avatar-size-md`, `--q-avatar-size-lg`,
`--q-avatar-bg`, `--q-avatar-fg`, `--q-avatar-border`, and
`--q-avatar-radius`. Shadow parts are `container`, `image`, and `fallback`.

The implementation uses ordinary images, CSS overflow, and 2D geometry, making
it safe for CEF/off-screen rendering.
