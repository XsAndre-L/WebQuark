# q-divider implementation plan

Status: implemented by the sole implementing Sol agent after independent review and user approval of all four inputs. Library/wrappers build, prop-order/tooling checks, focused unit and Chromium geometry tests, forced-colors probe, consumer snapshot check, focused Angular tests, frontend builds and lint passed. The accepted sizing contract below remains authoritative.

Latest user amendment: spacing now defaults to lg (16px per side at the standard theme baseline), superseding earlier none/sm defaults throughout this historical plan. Parent gap adds independently; consumers avoid stacking their gap at divider boundaries. Thickness and endpoint inset are unchanged.

## Purpose and category

Add a WebQuark Layout primitive at `src/browser/components/layout/divider/` for consistent horizontal and vertical separators. Match InStoreFocus: solid 1px theme border color, no decoration, container-relative length with a theme-based inset at both endpoints. Static separator only; no dragging, focus, resizing, slots, or events.

## Proposed public inputs (subject to user agreement)

### Layout

- `orientation`: `horizontal | vertical`, default `horizontal`.
- `length`: CSS length/percentage or `auto`, default `auto`. HARD REQUIREMENT: auto fills the available container extent along the line axis minus a theme-based inset at each endpoint, in both orientations. Never use a fixed 24px default or fallback. Explicit length sets only the line axis and is capped to the available extent minus both endpoint insets. Resolve layout from the container, including auto-sized toolbar flex/grid layouts, without introducing a sizing feedback loop. If available extent cannot be resolved, expose and document a required host/container layout contract rather than silently using a fixed length.
- `spacing`: existing `QSpace` tokens, default `none`. Apply symmetric external logical spacing perpendicular to the line: block spacing for horizontal, inline spacing for vertical. `none` allows parent gap to own spacing.

### Accessibility

- `decorative`: boolean, default false. False exposes a static separator with explicit orientation; true hides it from assistive technology. Never keyboard focusable. Verify current WAI-ARIA separator requirements before implementation; no accessible-name input unless actually required/permitted for a static separator.

### Theme customization (CSS, not extra inputs)

- `--q-divider-color`: falls back to existing theme border color token.
- `--q-divider-thickness`: default 1px.
- Use existing QSpace resolution and logical CSS. Do not introduce color enums, arbitrary spacing props, density-specific variants, or duplicate length configuration.

## Implementation sequence

1. Reviewer checks API, defaults, layout semantics, repository contracts and accessibility; coordinator resolves findings.
2. Show the user grouped inputs in plain language and obtain approval before source implementation.
3. One Sol implementation agent adds Stencil TSX/CSS/types, source-adjacent API docs, Layout catalog entry, playground manifest/spec examples and generated wrappers/declarations using normal build workflow. Follow `.agents/skills/organize-stencil-props/SKILL.md`; deliberately classify new props in prop-order configuration as needed.
4. Add meaningful unit tests for defaults, orientation changes and decorative semantics. Browser geometry checks for horizontal/vertical length, symmetric spacing, explicit lengths, light/dark, RTL and flex/grid behavior. Verify resizing follows the container, both endpoint insets remain visible, oversized explicit lengths stay within bounds, and auto-sized toolbars do not collapse or enter sizing feedback loops. Verify forced-colors visibility using border/currentColor fallback as appropriate.
5. Build library and React/Angular wrappers; run prop-order checks, focused component tests and diff checks. Report browser test limitations if required Chromium remains missing, never claim them passed.
6. Initial consumer integration, after user approval: replace equivalent native toolbar action separators in InStoreFocus and place separator between Assignment Workspace status and action buttons. Preserve visual spacing: parent gap plus divider spacing must not double. Avoid replacing arbitrary structural borders. Follow InStoreFocus routing/Angular guidance, test affected shared components and frontend build.
7. Refresh the app's local WebQuark snapshot through its official wq-switch workflow and verify the app consumes the new component; no publishing or unrelated dependency changes.

## Acceptance criteria

- User-approved inputs match generated declarations and docs.
- Library owns reusable line styling; app owns placement and group spacing.
- Light/dark theme border appearance matches surrounding InStoreFocus controls.
- Horizontal/vertical behavior and decorative semantics are verified; no duplicate separator semantics.
- Existing unrelated WebQuark work (including webquark-serve.js and dropdown fix) is preserved.
- No source implementation before input approval; one implementing subagent only.

## Open review questions

- Is `sm` the best spacing default, with `none` documented for gap-based toolbars?
- Does percentage length need explicit parent-size caveats or a future stretch mode?
- Are CSS custom property names and border fallback consistent with the actual theme tokens?
- Is static role=separator without naming correct under current WAI-ARIA?

## Accepted review refinements

- Spacing defaults to none because toolbar parent gaps already supply spacing; standalone consumers may choose sm.
- Orientation describes physical horizontal/vertical geometry; initial supported writing mode is horizontal-tb with LTR/RTL coverage.
- Superseded fixed-length recommendation: auto now adapts to the container with endpoint insets as a user-mandated requirement. Explicit lengths remain bounded; test constrained flex/grid and parent resizing.
- Add docs/components/q-divider.md as well as generated source README. Run bun run packages:build for library and both wrappers.
- Keep one semantic element, no accessible name or focus behavior for the static separator.


## Mandatory adaptive sizing and theme contract

- Endpoint inset uses a theme spacing token (proposed sm) and remains distinct from spacing, which controls perpendicular surrounding gaps. Expose a CSS custom property for endpoint inset rather than adding an unapproved input.
- Color resolution: consumer --q-divider-color override, then inherited --q-border-color, then repository-compatible fallback. CSS inheritance and theme overrides resolve this automatically; no JavaScript color inference. Existing toolbar and theme sources confirm #374151 as the fallback.
- Reviewer must resolve adaptive sizing mechanics before the sole implementation agent starts. This supersedes all earlier fixed-size proposals.



## Accepted final sizing review: implementation contract

- Available extent means the host's allocated layout box from its immediate flex line, grid area, or explicitly sized wrapper, not an arbitrary ancestor.
- Host is positioned relative, reserves thickness perpendicular to the line, has zero long-axis intrinsic contribution and minimum size, and stretches on its long axis. An absolutely positioned line prevents requested length from inflating the parent.
- Vertical direct children of row flex containers use align-self: stretch; sibling controls establish height. Mirror for horizontal dividers in column flex. Grid area must derive its size from content, tracks or container constraints.
- In normal block flow horizontal fills available width; vertical requires height allocated by flex/grid or an explicit wrapper. A horizontal divider on row-flex main axis requires an allocated width/flex slot. Document these constraints prominently.
- For allocated extent A and inset I, usable U=max(0px,A-2I). Auto length is U; explicit length L is max(0px,min(L,U)), centered. Percent lengths resolve against A then cap to U. Too-small hosts draw zero length, with no overflow.
- Endpoint hook: --q-divider-inset defaults to var(--q-space-sm, .5rem). Keep separate from perpendicular spacing. Do not use percentage padding to compute inset.
- Verify actual direct-child toolbar integration; nested consumer wrappers own their own layout. Wrapped dividers stretch within their own flex line; keep intended control group together.
- Browser coverage includes sibling-sized flex/grid, nested wrappers, wrapping, percent and oversized lengths, dynamic parent/sibling resize, and containers smaller than both insets. No fixed24px fallback or ResizeObserver required.
