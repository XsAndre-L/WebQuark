# Design presets

Use `data-wq-preset="comfortable"` for readable website content, larger controls and roomier spacing. Omit it for the existing compact defaults, or explicitly select `compact`.

```html
<html data-wq-preset="comfortable" data-theme="dark">
```

## Scope and switching

```html
<main data-wq-preset="comfortable">
  <q-card>Roomier content</q-card>
  <aside data-wq-preset="compact"><q-button>Compact action</q-button></aside>
</main>
```

The nearest preset is inherited, including through WebQuark shadow roots and slots. Change or remove the attribute to switch at runtime. Attributes on custom-element hosts work too. Missing/unknown values inherit the enclosing preset; the document defaults to compact.

Presets change text sizes, control height/padding/icons, spacing, content padding and relevant component dimensions. Colours, font family/weights, corner radii, borders, motion and structural layout choices remain independent. Use `data-theme` for light/dark. Explicit component size still selects sm/md/lg within the preset. Forms and toolbars carry their size choice into nested preset sections.

The 65 existing density tokens retain their exact values in compact. Component settings use their established public names in both presets. Size-specific tab defaults use private implementation variables so generic and size-specific overrides retain their priority. Local/runtime values (such as avatar resolved size and control context) are not preset defaults. Dialogs, dropdown popovers, tooltips and reel lightboxes inherit from their existing DOM location. Toasts inherit from the mounted toast host, not the JavaScript caller.

## Native website text

The main stylesheet supplies variables and WebQuark component styles. Native HTML typography is opt-in:

```css
@import '@webquark/core/dist/webquark/webquark.css';
@import '@webquark/core/native-content.css';
```

```html
<main class="q-prose" data-wq-preset="comfortable">
  <section class="q-content-section">
    <h1 class="q-display">A larger story</h1>
    <p>Body text is 18px at a 16px root, with a 1.6 line height.</p>
  </section>
  <section class="q-content-section"><h2>Next section</h2></section>
</main>
```

`.q-prose` maps native headings, paragraphs, lists and small text to semantic tokens. `.q-display` selects the responsive hero size. `.q-content-section` applies content padding and spacing between adjacent sections. No body margin, background or global heading reset is applied. You can instead consume semantic tokens in your application's base stylesheet. New native compact headings use the existing 1rem large-text default; importing these opt-in styles is an intentional native-text styling decision.

## Customization

Load application overrides after WebQuark:

```css
[data-wq-preset='comfortable'] {
  --q-heading-display-size: clamp(2.5rem, 2rem + 3vw, 4.5rem);
}
q-button.special-action { --q-btn-height: 3.5rem; }
```

Preset selectors have zero specificity. An explicit nested preset resets its complete default set, so apply custom overrides to each preset scope that needs them. Semantic aliases resolve where declared: override the semantic token directly for local native typography; do not expect an inherited alias to re-resolve an arbitrary descendant legacy token. Existing components continue consuming legacy tokens locally.

Angular uses `<main [attr.data-wq-preset]="preset">`; React uses `<main data-wq-preset={preset}>`. No wrapper input or provider is needed. `QPreset` is exported as a type from Core.

## Source and validation

Edit `src/theme/tokens.ts`, then run `bun run theme:generate`. Generated files must not be hand-edited. [The complete value matrix](design-presets-tokens.md) lists compact/comfortable values, including new semantic and component fallback defaults. [The original allocation](design-presets-plan.md) records all 180 historical shared values and component-owned hooks.

The playground's **Design presets** link opens `/presets.html` for side-by-side, nested, runtime, RTL and light/dark examples.

Validation: `bun run packages:build`, tooling preset manifest tests, browser preset/foundation/navbar tests and affected component unit tests. Package builds include strict Angular and React consumer checks. No package publication or downstream opt-in is implied by building.
