# q-conversation-bubble

`q-conversation-bubble` is a framework-neutral semantic message surface for
assistant, support, messaging, and collaboration interfaces. It owns message
alignment and presentation but deliberately does not own conversation state,
delivery, editing, or streaming behavior.

The generated
[API reference](../../src/components/data-display/conversation-bubble/readme.md)
is canonical for exact types and defaults.

## Usage

```html
<q-conversation-bubble sender="Assistant" timestamp="Just now">
  What matters most when you feel understood by someone?
</q-conversation-bubble>

<q-conversation-bubble variant="outgoing" sender="You" timestamp="Just now">
  Curiosity and being able to disagree kindly.
</q-conversation-bubble>
```

Optional `avatar`, `meta`, and `actions` slots compose consumer-owned identity,
status, and controls. Keep actions as ordinary accessible controls.

```html
<q-conversation-bubble sender="Maya" timestamp="09:42">
  <q-avatar slot="avatar" name="Maya" src="/maya.jpg"></q-avatar>
  Are you still free Saturday?
  <span slot="meta">Delivered</span>
  <q-button slot="actions" variant="text" size="sm">Copy</q-button>
</q-conversation-bubble>
```

## Accessibility and behavior

- Every message is a named group. Its default name uses `sender` and
  `timestamp`; `ariaLabel` overrides it when more context is needed.
- `incoming`, `outgoing`, and `system` affect alignment and appearance only.
- The component does not create a live region. Consumers should announce only
  genuinely new messages through a separately managed, restrained live region.
- Message text remains selectable, wraps long content, and preserves line
  breaks. The component adds no keyboard interaction.
- `compact` reduces spacing without changing semantics.

## Styling and responsive behavior

Use the `--q-conversation-*` custom properties for width, surfaces, type, and
spacing. Shadow parts are `container`, `avatar`, `content`, `header`, `sender`,
`bubble`, `body`, `footer`, `timestamp`, `meta`, and `actions`.

The bubble narrows its maximum width on small screens and uses no backdrop
filters, 3D transforms, or platform overlays, so it is CEF-safe.

