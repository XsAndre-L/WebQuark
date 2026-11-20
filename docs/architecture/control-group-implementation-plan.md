# QControlGroup implementation plan

Owner: WebQuark browser components
Status: implemented locally and focused checks passed; not published
Source checked: 2026-10-27, local WebQuark checkout

## Implementation result

Implemented the wrapper, direct-child edge tracking, opt-in surface styles,
playground preset, generated browser/React/Angular exports, consumer fixtures and
authored guide. Existing controls keep their values, events and form ownership.

The joined outline is composed from child borders, rather than one enclosing
border, so labels and feedback stay outside the control surfaces. Only the radius
override is public; existing child border, focus and validation tokens retain
precedence. Horizontal fields can shrink to fit; explicit width presets remain
fixed. Mixed labels/feedback and conflicting explicit sizes may interrupt a join;
see the guide's limitations.

Verification completed:

- Stencil browser package generation and React/Angular builds/consumer checks.
- Eight focused Chromium component tests: sizing, themes, widths, dynamic children,
  native and q-form behavior, events, disabled action, RTL, focus and popup layout.
- Component-only property-order check and whitespace check.
- Actual light/dark guide captures and keyboard supplier search/confirmation.
- Independent source/guide review; its explicit-width finding was fixed and tested.

No full suite, screen-reader certification, release publication or ITDashboard
adoption was performed. The plan below retains the design and verification scope.

## Goal and boundaries

Add `QControlGroup` / `<q-control-group>`: a layout wrapper that visually joins
existing controls in consumer-defined order. Reuse WebQuark themes and preserve
each child's behavior. Standalone controls must remain unchanged.

Examples: `[On/off] [5] [Minutes]` for a sync interval, and
`[Searchable supplier dropdown] [Use supplier]` for supplier selection.

This plan covers the library component, documentation and focused verification.
Publishing and ITDashboard adoption are separate actions. ITDashboard currently
uses published `1.1.0-dev.12`; changing this checkout does not update that package.
Seconds-based scheduling is separate ITDashboard backend work.

## Supported controls

| Child | Use | Preserve |
|---|---|---|
| `q-input` | Text and number | Input/change events, validation, spinners |
| `q-dropdown` | Standard and searchable selection | Search, selection, popup, loading |
| `q-toggle` | Switch and checkbox | Checked state, labels, keyboard behavior |
| `q-quantity-selector` | Quantity with increment/decrement | Numeric reconciliation and orientation |
| `q-button` | Action or submit | Variant, loading, disabled and form behavior |

Support direct children in any DOM order, including repeated types. Nested groups,
arbitrary wrappers and unrelated components are outside the initial joined-style
contract. Unsupported children must not be removed or rewritten.

## Public API

| API | Proposed contract |
|---|---|
| Default slot | Controls remain in consumer-defined DOM order |
| `size: QControlSize = 'inherit'` | Reuse `controlScope`; explicit child sizes retain precedence |
| `orientation: 'horizontal' \| 'vertical' = 'horizontal'` | Joined row or column; logical edges support RTL |
| `ariaLabel` / `aria-label` | Accessible group name, separate from child names |
| `part="group"` | Public shared-container styling hook |

No combined value, configuration schema, form participation, automatic toggle
coupling or group change event. Do not intercept events, clone/reparent children,
or assign their values, names, labels, validation or disabled state.

The application owns behavior: switching off a sync disables its other controls
only when the application explicitly requests that behavior.

## Theme and styling

Reuse current border, surface, foreground, radius, spacing, control-height, font
and focus tokens. Reuse `controlScope`, `QControlSize` and input width contracts;
do not create another size scale or hardcoded light/dark palette.

The group owns the shared outline and separators. Preserve child variant colors,
toggle tracks, quantity-button dividers, focus rings and validation indicators.
Remove only redundant field outlines and inner corner rounding. Dropdown menus
keep their own border, surface and placement behavior.

Apply grouped styling only to direct children through scoped custom properties.
A shadow-root stylesheet cannot arbitrarily style a slotted child's shadow tree;
do not assume `::slotted(...) ::part(...)` reaches its internals. Verify each
existing hook. Where missing, add an optional CSS hook with the exact current
appearance as its fallback, consumed only by the appropriate child surface.
Do not use broad global selectors or mutate public props for presentation.

Keep group overrides small: border, radius and divider hooks with existing theme
defaults. Do not hand-edit generated theme CSS. Change its owning generator/token
source only if a shared generated behavior is actually needed.

## Layout and accessibility

1. Preserve DOM reading/tab order and each child's keyboard model. Use a named
   `role="group"`; do not add a wrapper tab stop or toolbar arrow navigation.
2. For compact joined fields, place a visible group caption outside the outline
   and name each child. Consumers explicitly use existing hidden-label options;
   the group never hides labels itself. Keep individual help/error text visible
   and associated with its field; borders/dividers must not cross label/feedback text.
3. Respect existing child `width` props and consumer host widths. Use compact
   number/toggle/button fields and flexible search fields without forcing equal
   widths. Inherited sizes align; conflicting explicit sizes remain intentional
   overrides and are outside the equal-height guarantee.
4. Do not wrap a joined row into broken fragments. Provide vertical orientation
   for narrow layouts. Do not use overflow clipping to hide square corners: focus
   indicators and dropdown popups must stay visible.
5. Recompute visible edges after direct-child insertion, removal, reorder or
   `hidden` changes. Use bounded slot/child observation with disconnect cleanup.
   Remove only group-owned metadata on detach; preserve consumer styles/attributes.

The quantity selector currently has a narrower public accessibility/disabled
contract than `q-input`. Do not invent missing capabilities in the group. Prefer
`q-input type="number"` for the Scheduler example and document child limitations.

## Implementation steps

### 1. Map existing hooks and prototype

Inspect render/CSS contracts for all five children. Record available border,
radius, sizing, focus and feedback hooks before changing them. Prototype the
scheduler and supplier-picker combinations first. Put scratch work under
`build/.tmp/control-group/` and verify it is ignored.

| Existing owner | Reuse |
|---|---|
| `src/browser/theme/tokens.ts` | `controlScope`, size and spacing contracts |
| `src/browser/theme/behaviors/control-sizing.css` | Generated sizing behavior; not a handwritten edit target |
| `src/browser/components/layout/toolbar/` | Size inheritance and accessible grouping precedent |
| `src/browser/components/layout/inline/` | Consumer-owned layout precedent |
| `docs/input-widths.md` | Existing width precedence |

### 2. Implement the wrapper and necessary hooks

Create `src/browser/components/layout/control-group/control-group.tsx` and
`control-group.css`; add a types/helper file only if complexity warrants it.
Keep edge tracking with this owner, without a general configuration framework.
Follow the relevant repository `organize-stencil-props` skill when introducing
or organizing `@Prop()` declarations.

Add child CSS hooks only where step 1 proves them necessary, preserving standalone
computed styles and behavior. Do not make the group form-associated. Preserve
native form ownership and `q-form` discovery/reset through the new slot boundary.
Failures here block release rather than justify a new combined-value API.

### 3. Integrate package exports and examples

Use the existing Stencil output targets in
`packages/browser/components/stencil.config.ts` to generate custom-element,
React and Angular exports. Do not hand-maintain alternative wrappers or treat
generated output as the source of truth. Check `QControlGroup` exports and
children/event handling in the existing framework consumer fixtures.

Register a playground example through the existing manifest/spec structure.
Add `docs/components/q-control-group.md` and entries in both `docs/components.md`
and the canonical index in `docs/components/README.md` when implemented.
Follow the [component documentation standard](../components/README.md): the required
opening, five H2 sections, API subsections and reference-table formats. Document
direct-child support, labels, sizing, widths and limits.
Show the two application examples, reordered/repeated controls, light/dark themes
and vertical layout. Do not describe untested combinations as supported.

Before marking the guide complete, verify runnable examples, capture readable
screenshots of the actual component with alt text, check local links and both
index entries, and obtain an independent guide review. Compare the prose against
source and runtime behavior, not generated declarations alone.

### 4. Verify only the affected behavior

Place unit/browser tests under the component's `test/` directory, following
current Stencil/Vitest discovery. Extend affected child/theme/consumer tests only.
Use a representative matrix rather than all permutations.

| Focus | Required evidence |
|---|---|
| Isolation | Standalone geometry, colors and behavior unchanged; removing a control restores its standalone styling |
| Layout/theme | Light/dark, compact/comfortable presets, nested preset boundaries, local palette overrides, runtime scope changes, inherited sizes, explicit override, RTL, narrow/vertical, empty/single/reordered/repeated/hidden children |
| Interaction | Typing, numeric adjustment, toggle, button actions and dropdown search/selection retain their events and values |
| Accessibility | Named children, normal keyboard access, visible focus/errors and unclipped popups |
| Forms/frameworks | Native and `q-form` submission/reset/validation; supported disabled/loading states; React/Angular child/event wiring |

Add one focused theme-composition fixture with grouped and adjacent standalone
controls in equivalent scopes. Change compact/comfortable presets, inherited size
and local palette at runtime, including a nested preset boundary. Verify that
both presentations update without remounting, preserve explicit overrides and do
not leak styles into neighboring scopes. Reuse existing preset/foundation test
patterns; do not multiply every control/order/theme combination into a full matrix.

Compare the five supported children inside and outside the group. Avoid a
whole-library screenshot refresh, exhaustive suites or full release builds.
If generating wrappers requires a broad package build, explain that requirement
and obtain approval before expanding beyond focused validation.

### 5. Record readiness and separate adoption

Record implementation status, exact checks and remaining limitations. Publishing
a new dev version needs separate authorization; never overwrite `1.1.0-dev.12`
or assume a next release number. ITDashboard can then pin the approved release
and adopt the group in a separate change.

## Risks and completion criteria

Shadow DOM styling, multiline feedback, popup clipping and form discovery are
the main risks. Resolve them with scoped presentation hooks and focused checks,
not child behavior rewrites. If a child cannot meet the contract without changing
standalone behavior, stop that portion and document the decision.

Complete means the five supported controls compose in any direct-child order,
themes remain coherent, individual semantics are preserved, documentation matches
tested behavior and existing standalone usages need no migration.
