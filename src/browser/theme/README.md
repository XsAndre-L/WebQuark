# Theme

Start with **tokens.ts** for shared dimensions and grouped theme defaults.

| File | Purpose |
| --- | --- |
| `tokens.ts` | Spacing, control sizes, colors, typography, surfaces, shadows, and component defaults, including light/dark values |
| `tokens.css` | Generated defaults; do not edit directly |
| `token-presets.css` | Generated compact/comfortable preset values |
| `behaviors/control-sizing.css` | Generated explicit/inherited control sizing rules |
| `behaviors/field-feedback.css` | Shared labels, help text, errors and reserved feedback space |
| `behaviors/native-content.css` | Optional native typography and content spacing |
| `theme.css` | Stylesheet entry point |

`behaviors/` contains reusable CSS functionality that components or native
content opt into. Component imports include sizing and field feedback in their
shadow roots; applications can import `@webquark/browser/native-content.css` for
native content. The public package import stays independent of the source layout.

Run `bun run theme:generate` after editing the catalog. The build also runs it.
The generator updates CSS and `docs/theme-tokens.md`. The playground theme
designer reads the same catalog.

Component settings supplied by presets are listed in `docs/design-presets-tokens.md`.
Other optional overrides remain unset at the root. Private `--_q-*` variables are not
consumer API. The field rendering helper lives in `components/shared/field.tsx`.

Consumers continue to import `@webquark/browser/dist/webquark/webquark.css` and
override public `--q-*` variables in their app's CSS.
