# Shared input widths implementation plan

Status: library and consumer integration implemented and independently reviewed.
The local snapshot is activated and both frontend production builds passed.
Authenticated Tasks visual acceptance remains a manual check.
GPT-6.1 Sol xhigh approved the runtime.
Date: 2026-10-17.

Latest scale revision: XS80, SM120, MD180, LG240, XL290 and XXL360. The XXL extension and revised scale are implemented; consumer snapshot activation is pending validation. Earlier activation notes below describe the original five-width rollout.

## Outcome and public contract

Add a shared horizontal width scale, independent of the existing control `size`
property. `size` continues to govern height, typography, padding and density.
For example, `<q-dropdown size="sm" width="lg" />` is compact and 240px wide at
the default root font size.

| Public token | Default at 16px root | Generated value |
| --- | --- | --- |
| `--q-input-width-xs` | 80px | 5rem |
| `--q-input-width-sm` | 120px | 7.5rem |
| `--q-input-width-md` | 180px | 11.25rem |
| `--q-input-width-lg` | 240px | 15rem |
| `--q-input-width-xl` | 290px | 18.125rem |
| `--q-input-width-xxl` | 360px | 22.5rem |

Follow WebQuark's existing rem-based dimension generation; pixel values describe
the standard 16px baseline. InStoreFocus may explicitly use the requested pixel
values in its overrides. Width tokens do not change between light/dark or density
presets. They remain overridable globally and within a local container.

Add a reflected optional `width?: QInputWidth` property with the public union
`'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full'`. Omitted or unsupported runtime values
use existing component sizing. Do not add `auto`, arbitrary CSS strings, numeric
pixel properties, or width inheritance from `q-form` in this change. Explicit CSS
on the host remains the escape hatch for custom widths.

## Component scope

Implement on `q-input`, `q-dropdown` and `q-textarea`: these are the existing
full-width field controls. All q-input types use the same host width contract.
Do not add it indiscriminately to every file in the inputs category:

- `q-form` owns layout/context, not one field's width.
- `q-toggle` and `q-radio-group` include choice/label layouts.
- `q-quantity-selector` has content-driven and vertical-specific geometry.

These excluded controls retain existing behavior; extending them requires a
separate explicit layout contract. The tokens themselves are available to any
component or consumer CSS immediately.

## Layout and compatibility

Use one shared opt-in CSS behavior for the three hosts. Named values map to the
canonical tokens with generated fallbacks; `full` maps to 100% of the containing
block. No sizing attributes/classes/styles are applied for omitted width.

Selected widths size the complete field host, including label and validation
content. Cap it to available container width (`max-width: 100%`), use border-box
sizing and allow shrinking (`min-width: 0`). Do not impose flex growth, flex-basis
or parent grid tracks: parent layout remains authoritative and may further
constrain the preferred width. No `!important` or inline width assignment.
Use physical width consistently with current controls; this change does not
introduce vertical-writing-mode geometry.

`q-dropdown` keeps its existing menu measurement/positioning behavior: its menu
tracks the final rendered trigger width, including resizing and scoped token
overrides. Do not force a menu width from the enum. Textarea automatic height,
resize mode, labels, validation, focus and events remain unchanged.

Consumer host CSS takes precedence through the normal cascade. During migration,
remove old explicit width/max-width rules that would mask the new property.
Document flex/grid constraints and long-label truncation rather than promising
an exact fixed width under every parent layout.

## Ownership and project overrides

Canonical widths and the exported type belong in `src/browser/theme/tokens.ts`.
Extend `scripts/generate-theme.ts` to generate the public declarations and the
shared width behavior (for example `theme/behaviors/input-width.css`). Do not
hand-edit generated theme styles or duplicate token maps in three components.
Ensure the public browser and core forwarding surfaces export the type.

All consumers loading the updated WebQuark theme receive defaults. A project
override stylesheet loaded after WebQuark can redeclare these tokens. Existing
projects' private files are not automatically rewritten by installation or
`wq-switch`; the inspected switcher configures package connections, not theme
file synchronization. Document an override block for all six widths.

For the initial InStoreFocus integration, add the six requested pixel-valued
declarations to `frontend/libs/shared/ui-foundation/styles/webquark-theme.css`
under the common root block, shared by both applications. Do not duplicate them
in light/dark branches. Preserve all existing customizations.

## Ordered implementation

1. **Theme and API foundation — WebQuark.** Add canonical widths, type, generated
   tokens/docs and shared opt-in CSS. Existing no-width components and density
   defaults must retain their current output. Check generated artifacts using
   the normal theme generator and existing theme-baseline tests. The existing
   `presets.unit.test.ts` compares the entire catalog against the historical
   180-token `compact-baseline.json`; preserve that fixture unchanged. Adjust the
   assertion to prove all original 180 values remain identical, and separately
   verify exactly the six newly introduced width tokens and their defaults.
   Do not regenerate the historical fixture to accept a changed baseline.
2. **Three field controls — WebQuark.** Add reflected optional props and shared
   behavior, following `.agents/skills/organize-stencil-props/SKILL.md` and the
   prop-order configuration. Update component docs, public declarations and
   Angular/React wrappers through normal generation, not handwritten wrappers.
3. **Examples and focused proof — WebQuark.** Add playground examples separating
   size from width, showing all widths, full, omitted, scoped overrides, a narrow
   container and normal flex/grid layouts. Test the geometry and compatibility
   matrix below using existing component/browser runners.
4. **Consumer integration — InStoreFocus.** Refresh the frontend local snapshot
   with the official switcher after stopping frontend dev tasks. Preserve package
   versions/lockfile and use `status`/`check` to verify one consistent local set.
   Add project override tokens; change Tasks Assign picker to `width="xl"` and
   remove its page-owned 320px width rule (retain unrelated styles). No bulk
   migration of other fields. Build both frontend applications and run lint.
5. **Review and handoff.** Independently review final code and generated API,
   record exact checks and remaining limits, and restart/refresh for visual
   acceptance. Publishing is a separate user-owned step, not part of this plan.

## Validation and acceptance

- Unit/type checks: optional/reflected property, supported values, invalid/empty
  runtime value falls back safely; public types compile in generated wrappers.
- Browser geometry: each named width and full across all three controls;
  no-width baseline; narrow containers; representative flex/grid parents;
  border-box and long labels; dynamic attribute change/removal; global and scoped
  token override; changed root font size; compact/comfortable and RTL smoke.
- Browser cascade: explicit consumer host width CSS overrides a named width;
  removing that rule restores the named width, while container limits still
  apply. This proves the promised CSS escape hatch rather than assuming it.
- Dropdown: opened menu follows rendered trigger on width changes and resize.
- Textarea: automatic height and resize behavior continue to work at new widths.
- Generator: repeated generation produces no further diff; changing a scoped
  width token affects the selected size without resetting unrelated controls.
- Use `bun run check:prop-order`, `bun run packages:build` and focused existing
  theme/component browser test selections in WebQuark. Verify actual runner names
  and discovery before running. Report browser infrastructure blockers explicitly.
- InStoreFocus: local package status/check, both frontend builds and lint; inspect
  Tasks Assign picker at 360px with its status chip, divider and action buttons,
  plus narrow-screen behavior. No backend/database work or authenticated data
  mutation is required.

## Out of scope

No default-width change, size-prop rename, popup change, arbitrary new width
presets, automatic edits to every consuming project, dependency upgrades,
publishing, or unrelated input/layout refactoring.

## Recorded implementation checks

- Final `bun run packages:build` passed, including React consumer compilation
  and 47 Angular standalone declarations/strict consumer compilation. Browser
  declarations and all three Angular width inputs/setters were generated.
- Re-running `bun run theme:generate` produced identical output in all six
  generated theme/behavior/reference files. `git diff --check` passed.

- `bun run check:prop-order`: passed 43 components and 2 mixins. Semantic
  fingerprints show only the three intended width additions; every existing
  declaration is unchanged.
- `bunx vitest run --project tooling src/browser/theme/test/presets.unit.test.ts`:
  4/4 passed, preserving the historical 180-token fixture and verifying exactly
  five additions plus usable Theme Designer labels/ranges.
- `bunx vitest run --project unit src/browser/components/inputs/input/test src/browser/components/inputs/dropdown/test src/browser/components/inputs/textarea/test`:
  38/38 passed across 4 files.
- `bunx vitest run --project browser src/browser/theme/test/input-width.cmp.test.ts src/browser/theme/test/presets.cmp.test.ts src/browser/components/inputs/dropdown/test/dropdown.cmp.test.ts src/browser/components/inputs/dropdown/test/search-mode.cmp.test.ts`:
  38/38 passed across 4 files in Chromium, including 16 new width cases.
  Existing dropdown CSS emitted a non-blocking import-order warning.
- Focused tests ran outside the sandbox after its Vite cache rename restriction;
  the required Playwright Chromium revision was installed. No test-config changes
  were retained.
- InStoreFocus full frontend lint, both frontend production builds, and local
  snapshot status/check passed. Builds retain existing bundle-budget/CommonJS
  warnings. The user selected extra-large (360px) for the task picker after the
  original large-width plan; compiled output contains `width="xl"`.
- Shared usage and a copyable project override block are in
  [Input widths](../input-widths.md). No package versions or lockfiles changed;
  nothing was published.
