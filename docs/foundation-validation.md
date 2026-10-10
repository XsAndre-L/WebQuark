# Foundation implementation validation

Validated on 25 September 2026. See [the migration guide](foundation.md) for the
public API and changed defaults.

## Library checks

- Core production build and generated declarations: passed.
- React wrapper build: passed.
- Angular wrapper build: passed, including strict consumer compilation for 41
  standalone declarations and Angular version alignment.
- Tooling: 27 tests passed.
- Unit: 389 tests passed.
- Chromium: 60 tests passed across 8 files, including 21 foundation composition
  tests against the built custom elements.
- Prop-order checker: passed for 37 components and 2 mixins. The semantic
  fingerprint before/after declaration reordering matched.
- Git whitespace checks: passed in both repositories.

Browser coverage includes inherited and explicit sizes, runtime scope changes,
radio icons, feedback reservation and explicit opt-out, container-fitting grids,
full-row items, local surfaces/padding, scoped palettes with and without global
CSS, dropdown validity/reset/disabled/noValidate, toolbar wrapping/custom padding,
dialog focus restoration, dynamic footer slots, and component error-color overrides.

Review regressions also cover textarea auto-growth after explicit/inherited size
changes, container resizing and reconnection; manual/fixed height preservation;
color-input geometry; icon-only and circular button padding overrides; and
textarea component/shared padding precedence with and without global CSS.

## Control-radius follow-up

On the `webappstack` branch, the core production build and all 23 foundation
browser tests passed after adding the shared control-radius scale. The two new
cases verify all three sizes across six controls, explicit and inherited sizing,
toolbar inheritance, scoped tokens, field/component overrides, and pill/circle
shapes, with and without global CSS. Consumer builds were not repeated for this
CSS/token follow-up.

## Theme organization follow-up

Shared styles and defaults now live in `src/browser/theme`; field rendering is in
`src/browser/components/shared/field.tsx`. Core, React, and Angular builds passed,
including strict Angular consumer compilation for 45 standalone declarations.
All 63 Chromium tests passed across 8 files, including explicit/system palette
selection and inherited control geometry. The published stylesheet remains
`@webquark/browser/dist/webquark/webquark.css`.

## Consumer pilots

Changes in WebAppStack:

| Pilot | Replaced with shared APIs |
| --- | --- |
| Subscription billing dialog | Dialog width preset, hidden form label, inherited size/feedback, grid/full-row markers, dropdown errors, inline actions |
| Client settings | Stacks, spacing tokens, explicit panel surface, standard button geometry |
| Page toolbar | Wrapping toolbar/inline layout, inherited small controls; retained navigation landmark and tab behavior |

Core and Angular were packed locally with `npm pack --offline --ignore-scripts`.
Archives were extracted into a temporary copy of the consumer workspace; other
installed dependencies were resolved through local package junctions. The shared
backend authentication contract was also copied because the frontend imports it.
No published versions, committed dependency pins, or lockfiles were changed.

The WebAppStack development build passed using the local archives. Lint passed
for all six modified TypeScript/template files. The full Client build remains
blocked by type errors in the unchanged
`libs/shared/cms-adapter/components/carousel/carousel.ts`: the `viewChild` call at
line 23 rejects its `read` option and downstream `nativeElement` accesses fail.

All three actual pilot components also compiled and ran together in an isolated
Angular preview with mock services. Before/after captures covered 360px and
1100px widths in light and dark themes. The completed previews had no page
runtime errors or horizontal document overflow. Billing validation messages,
toolbar arrow-key focus movement, and Enter activation were exercised. The
preview used mock services, so it did not verify authenticated backend workflows.

The consumer source changes require the updated core and Angular packages to be
installed together. The original consumer dependency pins remain unchanged
pending the release/version decision.

## Repeating the library checks

```sh
bun run pr:verify
bun run check:prop-order
bunx vitest run --project browser
git diff --check
```

The foundation browser tests import built custom elements. Run the build first
after changing their source. This also avoids the Stencil Vitest transform error
encountered when importing the mixin-based button source directly.
