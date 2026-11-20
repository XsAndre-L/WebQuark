# WebQuark playground implementation plan

The [Syntax Box views plan](./syntax-box-views.md) covers the shared tabbed output in Sandbox, Variants and Edge Cases.

## Implementation result

The shared renderer now serves 46 component pages with 450 property definitions. Sandbox and each gallery card open with Example HTML and Copy. The Events tab holds that example's log and Clear action. The reset button beside Properties restores every property of the active component to its sandbox default and preserves slot content.

The panel appends `*` to a property name when the generated Stencil API marks that property as required.

Chromium checks loaded every page, matched its rendered control count to its spec, and rendered 351 gallery cases. Focused interaction checks covered gallery event isolation, keyboard copying, dialog dismissal, Reel focus restoration to the opening thumbnail, responsive navigation and property editing. A separate consumer origin rendered both illustrations from the actual Image Comparison clipboard contents and emitted the expected numeric change on ArrowRight. See the [consumer setup guide](../playground-consumer.md).

Run `bun run check:playground` for the focused contract and TypeScript checks. Configured external map providers require their own network access and credentials. The sections below retain the original audit baseline and implementation criteria.

## Scope and baseline

| Checked in this checkout | Finding |
|---|---|
| Library and catalog | 45 public component tags, 36 manifest entries and 36 matching JSON specs. Nine tags lack their own page. |
| Properties, counted once per component that exposes them | 437 public properties including shared action mixins. There are 267 declared controls. Of the 170 gaps, 132 belong to existing pages and 38 to the nine new pages. The 170 include 18 deprecated aliases. Dropdown and Radio Group already use fixed options without an editor. |
| Interaction and composition | 78 custom-event declarations and 48 public-method declarations, counted per component. Check event detail, property-only data, direct children, named slots and copied markup as well as visible controls. |
| Playground-owned surfaces | Main shell, property/slot editors, stage, variants, edge cases, event log, code preview, theme designer, preset comparison, custom views and static tooling page. |

These are source findings. The checks below specify how to verify the implementation in a browser. A missing control is a coverage gap. A deliberate sample value can differ from the library default.

## Implementation order

### 1. Make selection, mounting and teardown reliable

- **Fix competing spec loads.** In [state.ts](../../src/playground/state.ts), merge completed requests into the latest registry. Coalesce simultaneous requests for the same tag. On fetch failure, clear the previous component's stage, panel and snippet, display the selected tag and allow retry. Bind editor writes to the component that created the control. A late input from the previous page must never edit the new page.
- **Unify mount paths.** In [sandbox-panel.tsx](../../src/playground/components/sandbox-viewport/sandbox-panel.tsx), separate creating the preview element from finalizing it. Apply resolved properties and slots, attach listeners once, and mount instance-specific helpers on every path. Retire the redundant Button/Input view fragments or migrate their intentional sample content into the specs. If retaining the loader, guard every asynchronous stage against selection, tab and disconnect changes. Preserve untouched optional booleans instead of seeding every absent attribute as false.
- **Release inactive instances.** Dispose of prior module, stylesheet, listeners, observers and pending work on selection, tab change and disconnect. Hidden sandbox and gallery DOM currently survives navigation. Scope overlay/scroll actions to their originating preview. Keep a single active Toast host and prevent hidden map, autoplay, overlay or external-scroll examples from affecting the active page.
- **Clean up reactive subscriptions.** The signal's subscriber sets retain disposed effect callbacks. Remove disposed subscriptions from their sources, restore the outer effect after nested runs, and avoid rebuilding cards or remounting the edited component on unrelated registry writes. Rebuild only for a demonstrated structural need. Preserve focus and selection during normal edits.

**Pass when** a delayed Button load cannot replace a later Dropdown selection, closing a variant drawer affects only that card, and a generic component event appears once after switching away and back.

### 2. Make the live element, controls and copied example agree

- **Define the example contract.** Type prop and slot editors, optional values, options, ranges, example overrides, host attributes and demo actions in [state.ts](../../src/playground/state.ts). Resolve `slot` and `slots.default` to one unnamed slot. Define each variant's shared fixtures and explicit overrides, preserving deliberately empty examples. Handle native `style` and `dir` as host attributes. Distinguish actual API defaults, inherited values, demo seeds and current edits. Surface provided spec descriptions.
- **Use each property's real binding.** In [dom.ts](../../src/playground/utils/dom.ts), replace the dual property/attribute write and the value-based boolean guess with the declared binding. Text values `"true"` and `"false"` must stay strings in text fields. Define how to clear a previously edited value and return to native defaults. Preserve the difference between omitted, empty string and explicit false. Apply arrays, objects and callbacks in their supported forms. Avoid assigning properties before the custom element can consume them during upgrade.
- **Generate valid standalone examples.** Use Stencil's published property-to-attribute mapping, including `formaction`, `aria-valuetext` and ordinary dashed names. Escape HTML attribute values and literal text, and encode data safely in any emitted script. Use scoped JS setup for property-only data, callbacks and actions. Include Radio Group options as well as Dropdown options. Show the wrapper, trigger or fixture needed to operate a sample. Redact user-entered Map keys from copy output.
- **Preserve projected DOM.** Use the same resolved children in the stage, [variant card](../../src/playground/components/sandbox-viewport/variant-card.tsx) and snippet. Keep default children direct, retain slotted elements and any attributes/handlers they need, and avoid duplicate named-slot wrappers. Apply named overrides to the intended slots; preserve or explicitly clear other fixtures. Treat text as text, source-code examples as literal code and deliberately editable HTML as a distinct editor mode.
- **Wire editors and events.** Use the [playground UI checklist](playground-ui.md) for descriptions, multiline/JSON/range handling, accessible names, empty states, event formatting and mobile controls. Bind each host's declared events from the [API inventory](api-coverage.md). Handle child events and action buttons separately. Synchronize actual state changes with the right property and payload field, including scalar versus array selections and in-progress versus committed input.

**Pass when** independent copied examples reproduce a numeric edit, a quoted JSON attribute, a JS-only array, an explicit false value, a named slot and multiple direct children. Confirm that literal markup typed into an input appears as text in the event log.

### 3. Repair the existing 36 component previews

1. Implement the 17 [Avatar through Input entries](components-a-i.md) and the 19 [Link through Tooltip entries](components-l-z.md). Each row gives the affected API, fixture, event or interaction and an observable result.
2. Track every missing property by name in the [45-component coverage table](api-coverage.md). Give canonical properties a working control, fixture or scoped API action appropriate to the type. Put deprecated aliases in clearly labelled compatibility examples with their canonical counterpart unset.
3. Apply the [slot, select-option and default-value checklist](fixtures.md). Preserve useful sample data while providing a way to restore omission. Distinguish ordinary host styling and dynamic slot names from unsupported component props.
4. Prioritize examples that currently give a false result. Repair Image Comparison images, Data Table rows and dynamic slots, Carousel and Step Diagram child projection, Radio Group copied options, Syntax Box slotted content, Tooltip trigger ownership and the Reel video sample before adding cosmetic variants.

**Pass when** every existing component row has an implemented disposition, each documented scenario can be reached, and the scenario's card and copied example demonstrate the same behavior.

### 4. Complete the catalog and update the surrounding UI

1. Add manifest entries and specs for **Alert, Pagination, Tabs, Step Diagram Item and Thumbnail**. Give controlled components a working consumer that responds to their events. Demonstrate Step Diagram Item in the context of its parent as well as on its own page.
2. Add **Accordion, Banner, Media and Section** as scaffold examples. Show their actual properties and projected content. Label deferred library behavior explicitly so the page accurately describes what can be tried today. The [new component checklist](components-l-z.md) covers all nine APIs.
3. Apply the [shell and embedded usage fixes](playground-ui.md) to navigation, editor sheets, theme, presets, buttons, and nested components. Keep the static tooling page's verified examples separate from component repairs. When a component guide points readers to another component's demo or a placeholder, update its playground directions to the new working page.

**Pass when** the sidebar exposes all 45 tags, names and categories resolve to the correct spec, new pages load on first selection, and keyboard users can reach and dismiss the relevant shell and preview controls.

### 5. Verify changed behavior and prevent drift

1. Add a focused playground contract check reusing the repository's component metadata. Compare manifest tags, spec filenames and tags, public property/attribute names, finite select values, slot declarations, event/method names and schema keys. Account explicitly for mixins, deprecated aliases, dynamic slots, native attributes and property-only bindings. A new library prop should produce an actionable component-specific coverage difference.
2. Add focused cases for the shared failure modes above. Exercise specimen resolution and snippet round trips, late fetch ordering, listener disposal, fresh/remounted custom elements, clears and optional booleans. Verify that invalid JSON leaves the previous valid fixture usable.
3. In the served playground, run the acceptance scenario for each changed component. For shared UI changes, use one desktop and one narrow viewport. Check keyboard focus, events and snippet behavior in a fresh host. Verify local assets without relying on remote providers; check configured provider behavior separately.
4. Verify the served files match the changes. The Stencil configuration ignores playground source changes in watch mode, while the Bun watcher builds the TypeScript entry. Confirm a saved change to a copied spec, manifest, HTML, CSS or asset reaches the served output. If it stays stale, fix the relevant copy/watch path or document the required restart. Record the checks actually run.

**Completion criterion:** all 45 component rows, the shell checklist and the shared acceptance checks have a recorded outcome. Any remaining external-provider or runtime limitation is identified by component and scenario.
