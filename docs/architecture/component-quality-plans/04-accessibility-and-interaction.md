# Plan 4: Accessibility and interaction

Status: proposed implementation plan. No component changes have been implemented by this plan.

## Outcome and scope

Keyboard and pointer users can operate the same features. Built-in actions retain names and visible focus, overlays coordinate focus correctly, and structural ARIA describes implemented behavior. Supported slots do not require duplicated content or dangling ID references.

Owns F14, F18–F19, F22, F25–F26 and accessibility portions of F30; recommendation IDs **21–22, 27–28, 31–32, 35–36, 42, 44** plus the dialog-slot portion of **43** in the [plan index](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/README.md).

## Implementation locations

- [DOM/focus utilities](D:/Dev/PurelyIT/WebQuark/src/utils/dom.ts), dialog, reel, sidepanel drawer, navbar, tooltip, button, syntax-box actions, and field auxiliary controls.
- [Table model](D:/Dev/PurelyIT/WebQuark/src/components/data-display/data-table/internals/table-model.ts), [table](D:/Dev/PurelyIT/WebQuark/src/components/data-display/data-table/data-table.tsx), step-diagram/item, tabs, and chip.
- Existing component/browser tests; add focused modal lifecycle and keyboard/ARIA regressions using built custom elements and their real styles.

## Contract decisions

1. **Modal lifecycle:** one shared registration model for dialog, reel, and drawer. Only the topmost modal handles Escape/Tab. Capture the real active element across shadow roots; resolve initial targets after rendering; provide a programmatically focusable fallback for empty surfaces. Restore a connected, usable opener or a defined fallback. Background inertness and scroll locks are reference-counted and restore pre-existing application state.
2. **Table:** keep native table semantics unless implementing a full grid keyboard model is explicitly justified. Establish fallback identity before sorting/filtering/pagination, so event payloads match displayed records. Match pointer and keyboard row activation/selection; nested links, buttons, and selection controls retain their own behavior. Define replacement-data identity limits and duplicate-ID handling explicitly rather than pretending index keys remain stable across arbitrary replacement.
3. **Steps:** pending status alone must not announce disabled while remaining actionable. Proposed contract: explicit disabled behavior, with a documented pending policy matching the selected semantics. The parent owns list structure and final connector calculation as items are added/reordered/removed. Preserve orientation and existing controlled selection.
4. **Tabs:** Plan 6 first supplies the supported panel-association design. Implement relationships that resolve in the actual accessibility tree across the chosen slot/shadow structure; string IDs alone are insufficient. Preserve existing controlled tab selection and keyboard activation policy.
5. **Dialog slots/chips:** derive relationships/names from actual rendered content, preserving explicit accessible overrides. Observe slot/text updates without requiring duplicated text. Do not point ARIA at fallback nodes that disappear.

## Implementation sequence

1. Fix button loading names while retaining the loading indicator and disabled interaction contract. Explicitly label editor Format/Copy and field auxiliary actions. Restore visible focus for input actions and quantity editing/stepping without overriding theme focus tokens.
2. Implement/test the shared modal utility before integrating individual overlays. Account for nested shadow roots, inaccessible ancestors, inert siblings outside the active branch, empty content, nested overlays, asynchronous rendering, removed openers, disconnect/reconnect, and canceled animations. Avoid inerting the modal through an ancestor. No native dialog dependency without an appropriate CEF fallback.
3. Integrate dialog, reel, and drawer sequentially. Reel first-open focus resolves after render and restores its actual thumbnail trigger. Coordinate keyboard listeners, close animations, and scroll/inert cleanup. Plan 5 owns drawer variant/collapse geometry; agree on a single lifecycle integration patch after that contract is available.
4. Fix navbar closing focus for both small-screen and collision modes. Reuse desktop slot content at mobile sizes when no mobile override exists, maintaining one live instance and focus order. Omit empty branding anchors. Cover resize/collision changes while the menu is focused and custom navigation/actions are projected.
5. Fix table source identity and selection parity. Use the existing collection-identity approach where appropriate. Remove unsupported grid claims or implement the complete chosen model; retain sorting announcements, selection controls, pagination, and event payload correctness. Keep row-level interaction separate from descendant actions.
6. Implement coherent step activation and list semantics. Define supported item discovery through slots/wrappers and exclude unrelated nested diagrams. Compute final connectors dynamically without a consumer `last` workaround.
7. Make tooltip dismissal and positioning predictable: Escape dismisses without also closing an unrelated modal; trigger/content hover and focus persist appropriately; tooltip remains noninteractive. Add collision handling and updates on placement, visible geometry, scrolling, resizing, and content changes. Clean up listeners/observers on hide and disconnect.
8. Implement tabs/panel relationships after Plan 6's design checkpoint. Resolve dialog slot associations and chip removal names from actual content, with stable IDs, text-change handling, and explicit overrides.
9. Update interaction guides and playground examples, including keyboard behavior, modal focus, supported tab panels, pending/disabled steps, and slotted accessible names.

## Acceptance checks

| Area | Required evidence |
| --- | --- |
| Actions/focus | Loading button still named; icon actions named; focus remains visible in supported states/themes. |
| Modals | First open, empty surface, nested surfaces, repeated open/close, reconnect, removed opener, animation interruption; only topmost handles keys; focus stays inside; application inert/scroll state restored. |
| Navbar | Small viewport and collision closure return usable focus; slot fallbacks avoid duplication; no empty brand tab stop. |
| Table | Sorting/filtering/paging with and without IDs yields correct selected record; pointer/keyboard parity; nested controls unaffected; actual semantics match keyboard support. |
| Steps | Disabled activation blocked or pending remains correctly announced actionable; list/listitem structure; final connector updates with dynamic slots. |
| Tooltip | Escape, pointer transfer, focus transitions, viewport edges, live placement/content, scroll/resize, and disconnect. |
| Tabs/dialog/chip | Relationships resolve for documented slot/panel structures; labels update; explicit overrides work; controlled selection remains intact. |

Use browser accessibility/name assertions and real keyboard navigation; static attribute assertions alone are insufficient for shadow relationships. Record a manual assistive-technology smoke check for modal/tab/table announcements and focus restoration, and distinguish it from full certification. Run the shared verification gate.

## Dependencies and completion

Action/editor work follows Plans 1–3's touched-field edits. Navbar/tabs helper changes belong to Plan 3. Plan 5 owns contrast, general motion/sizing, and drawer collapse/variant styling; Plan 6 owns sidepanel destinations, deferred confirmation, and the tabs association API decision. This plan owns their accessible DOM/focus integration. The index defines handoffs to avoid concurrent edits to the same component.

Complete when supported pointer/keyboard paths agree, names and relationships resolve in the actual browser tree, modal cleanup is balanced, and every acceptance area has evidence. No wholesale category/API renaming is included.
