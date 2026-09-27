# WebQuark theme setup and composition

Use the [generated theme-token reference](./theme-tokens.md) for current names and default values, and [Foundation](./foundation.md) for the rules that make related components fit together.

## Load the theme

In a bundled application's JavaScript entry file:

```javascript
import '@webquark/core/dist/webquark/webquark.css';
```

The package stylesheet path is unchanged. Its source entry is now [src/theme/theme.css](../src/theme/theme.css), with defaults generated from [tokens.ts](../src/theme/tokens.ts). The playground theme designer reads that same catalog.

## Choose a palette

Without an explicit setting, the stylesheet follows the system light/dark preference. Set `data-theme="light"` or `data-theme="dark"` on the root or a subtree to choose explicitly.

```html
<section data-theme="light">
  <q-panel surface="panel">Light workspace</q-panel>
</section>
```

Override shared public `--q-*` tokens at the scope that owns the theme. Put component-specific overrides on the component requiring them. Private `--_q-*` variables are implementation details.

## Compose related components

| Concern | Shared contract |
| :--- | :--- |
| Control sizing | `q-form` and `q-toolbar` publish size; participating controls default to inheritance with standalone medium fallback |
| Geometry | Shared minimum height, font, line height, padding, icon size and proportional control radius |
| Layout | `q-stack`, `q-inline` and `q-grid` use shared spacing names |
| Surfaces | Explicit canvas, panel, card, field, floating and transparent roles; nesting does not select a role automatically |
| Feedback | Shared labels/descriptions/errors; form-level reserved feedback space with per-control opt-out |

See [Foundation](./foundation.md) for dimensions, exceptions, overrides, and migration details. A component using `sm/md/lg` does not necessarily use control geometry: marker, avatar, chip, and progress sizes are separate contracts.

## Customize an instance

```html
<q-form size="sm">
  <q-input label="Name"></q-input>
  <q-button class="special-action">Save</q-button>
</q-form>
```

```css
q-button.special-action {
  --q-btn-radius: 10px;
}
```

The form supplies shared sizing; the button changes only its local corners. Explicit size-specific button radius hooks take precedence when an explicit button size is chosen. Consult each [component guide](./components/README.md) for its complete effective CSS-variable and Shadow-Part contract.

## Maintain theme definitions

Edit `src/theme/tokens.ts` and run `bun run theme:generate`. The build also runs this generator. Do not hand-edit generated `tokens.css`, `control.css`, or `docs/theme-tokens.md`.

Optional component overrides intentionally remain unset at the root where defaults would mask inherited geometry or scoped palette fallbacks. Shared tokens and local overrides have different responsibilities.

The earlier palette, spacing, and component-hook tables on this page have been replaced by the generated catalog and source-verified component references.
