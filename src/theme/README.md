# Theme

Start with **tokens.ts** for shared dimensions and grouped theme defaults.

| File | Purpose |
| --- | --- |
| `tokens.ts` | Spacing, control sizes, colors, typography, surfaces, shadows, and component defaults, including light/dark values |
| `tokens.css` | Generated defaults; do not edit directly |
| `control.css` | Generated explicit/inherited control sizing rules |
| `field.css` | Shared field styling |
| `theme.css` | Stylesheet entry point |

Run `bun run theme:generate` after editing the catalog. The build also runs it.
The generator updates CSS and `docs/theme-tokens.md`. The playground theme
designer reads the same catalog.

Optional component overrides remain defined at their point of use and unset at
the root, so inherited values keep working. Private `--_q-*` variables are not
consumer API. The field rendering helper lives in `components/shared/field.tsx`.

Consumers continue to import `@webquark/core/dist/webquark/webquark.css` and
override public `--q-*` variables in their app's CSS.
