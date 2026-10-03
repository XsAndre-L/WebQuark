# Plan 6: Component concepts and API gaps

Status: proposed implementation plan. No component changes have been implemented by this plan.

## Outcome and scope

Published component concepts have real behavior, and applications can use navigation, confirmation, panel associations, and map readiness without recreating missing infrastructure. New contracts are deliberately designed and documented, with domain-specific properties rather than one oversized universal API.

Owns F15 and concept/API portions of F30; recommendation IDs **23–24, 41, 43, 46** and the design checkpoint for **42** in the [plan index](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/README.md). Contract design starts early; implementation follows the relevant form, modal, layout, and media foundations. Each concept is a separate reviewable delivery slice.

## Implementation locations

- Banner, section, accordion, media implementations/types/styles and their authored guides. Sidepanel item types/renderer, tabs types/rendering, dialog actions, map loader/public types/methods/events.
- [Current contracts](D:/Dev/PurelyIT/WebQuark/docs/components/current-contracts.md), [public type exports](D:/Dev/PurelyIT/WebQuark/src/index.ts), playground manifest/specs, Stencil declarations and framework output through normal generation.
- Add component tests for scaffolds as they become functional; extend sidepanel, tabs, dialog, Google loading/map tests, and framework consumer fixtures.

## Decisions to record before implementation

These are proposed contracts. Record final names, types, defaults, slot ownership, controlled-state rules, event timing/cancellation, accessibility model, compatibility impact, and representative usage in each affected guide before declaring the slice ready to implement. Existing categories and naming decisions remain intact.

| Concept | Proposed direction and decision checkpoint |
| --- | --- |
| Banner | Implement existing height/alignment choices. Define auto/full/half/narrow against the intended container/viewport with responsive minimums; preserve media/content/actions slots and readable overflow. No inferred numeric meaning left undocumented. |
| Section | Implement full/split/sidebar/columns with responsive fitting. Define which slots form each region, what columns counts, and how reverse affects visual versus DOM reading order. Invalid columns normalize safely. |
| Accordion | Define an actual disclosure item structure, preferably a companion item primitive if composition requires it. Specify initial/controlled expansion, stable item IDs, single/multiple semantics, disabled behavior, heading/button relationships, and keyboard interaction. Account for an additive tag in inventory/docs/exports if chosen. |
| Media | Render image/video/file from src/kind/alt/loading. Define consumer slot override precedence, empty/loading/error/fallback exclusivity, accessible file behavior, and video loading semantics. Reuse Plan 5's separate poster/media sources. Do not treat projected content and fallback as simultaneously active by default. |
| Sidepanel modes | Give flat/grouped/tree distinct, documented common-use behavior. Keep item identities/selection stable; do not silently lose children in flat mode. Define expansion persistence and switching modes before changing the current no-op default behavior. |
| Sidepanel destinations | Add native leaf destinations and applicable target/rel/disabled capabilities, aligned with navbar/link contracts. Keep group expansion separate from destination activation. Add originalEvent to selection detail; define cancellation/routing interception and preserve modifier-click/new-tab/context-menu affordances. |
| Tabs association | Select one supported approach to associate tab controls and actual panels across shadow/slot boundaries; consider same-root rendering or a companion panel API. Prove the accessibility relationship in a browser prototype before committing public declarations. Preserve existing controlled selection and consumer-owned panel content. Plan 4 implements the final accessible relationship. |
| Dialog confirmation | Keep immediate close as the default for existing consumers, while honoring a canceled qConfirm event. Proposed additive controlled-close option lets apps retain built-in actions, set loading, and close on success. DOM event handlers cannot be automatically awaited; make the async pattern explicit. Define rejection/error/cancel behavior and avoid duplicate qClose events. |
| Map readiness | Bound both WebQuark-owned Google script loading and application-owned `google.maps.importLibrary` with actionable existing status/error behavior. Settle timeout default/configuration from existing readiness policies; no unnecessary new timeout prop. Preserve transactional replacement, active-provider fallback, and application-owned namespaces. |
| Map view integration | Validate the viewport persistence/query use case. If supported, add one settled view-change event and a getter with latitude/longitude/zoom/bounds types, reusing QMapBounds. Define user/programmatic changes, initial-ready timing, equality/coalescing, and disconnected behavior. Do not expose Leaflet instances as the default contract. If deferred, record rationale and leave the recommendation visibly deferred, not complete. |

## Implementation sequence

1. Deliver the tabs association, dialog controlled-confirmation, and sidepanel mode/destination design checkpoints early so Plans 4–5 can integrate without guessing. Consume/co-review Plan 5's media source checkpoint; this plan owns q-media's state/slot contract rather than a competing source API. Prototype uncertain shadow accessibility before freezing signatures. Review additive versus behavior-breaking changes and write release notes for intentional corrections.
2. Implement banner and section behavior with responsive CSS and deterministic property normalization. Preserve slot ownership and document visual/reading order. Add usable playground examples rather than screenshots of consumer-built substitutes.
3. Implement the chosen accordion primitive/controller. Coordinate single-mode state without a feedback loop or silent loss of controlled expansion. Handle dynamically added/removed/disabled items and accessible heading/button/panel names. Update the public inventory only if a new tag is actually introduced.
4. Implement q-media resource state and exclusive projection/fallback using Plan 5's source contract. Define lazy/eager behavior per native media kind rather than forwarding an unsupported loading attribute to video/file. Clean up event handlers/resources on src/kind/slot changes and reconnect.
5. Implement sidepanel mode normalization and destination rendering after its lifecycle fixes. Prefer native anchors for navigable leaves; preserve qSelect observations and intentional application routing. No custom click-only substitute for links. Test modifier keys, disabled destinations, expansion, selected state, and mode changes.
6. Implement dialog deferred/controlled confirmation on top of Plan 4's shared modal lifecycle. Keep default immediate behavior, cancellation, loading guard, retry after failure, and explicit close methods coherent. Coordinate the actual slot ARIA work with Plan 4; do not duplicate it here.
7. Implement bounded Google provider readiness for both owned script loading and application-owned `importLibrary`; timing out only script insertion leaves the second route unbounded. Cover shared concurrent loads, callback/script/import errors, timeout cleanup, retry policy, provider changes during loading, and disconnect. Guard shared promise/cache cleanup by attempt/generation so late success or rejection from an expired attempt cannot clear or replace newer state. One consumer leaving must not break another's shared loader. Remove only owned resources; do not remove/restore application-owned namespaces or importers. Ignore stale completion after cancellation and retain the last working provider where appropriate.
8. Implement the map view event/getter only after the use-case checkpoint. Use settled/coalesced state, finite values, and stable serializable types. Demonstrate persistence/query usage without an event/property feedback loop; preserve marker/provider interactions.
9. Complete the chosen tabs API with Plan 4's accessible DOM integration, tests, guide, and generated wrapper types. No separate second panel-selection store.
10. Replace scaffold/reserved wording only when each concept is implemented and verified. Update guides, current-contracts, generated API descriptions, public type exports, framework consumer fixtures, playground discovery, and the coverage check from Plan 5.

## Acceptance checks

- Each existing scaffold property has observable documented behavior or an explicit unresolved/deferred disposition. Do not remove stable declarations silently to satisfy coverage.
- Banner/section: every enum, dynamic prop change, responsive size, overflow, empty/custom slots, reverse reading order, and invalid columns.
- Accordion: single/multiple, initial/controlled/dynamic/disabled items, keyboard, stable relationships, and no redundant app controller for the normal case.
- Media: image/video/file; valid/missing/error sources; lazy/eager semantics; poster independence; consumer override; exclusive fallback; src/kind changes and reconnect.
- Sidepanel: all modes with nested items, stable selection, native links, modifier-click, canceled interception, originalEvent, disabled leaves, and separate group actions.
- Dialog: synchronous default confirmation, canceled confirmation, async success/failure/retry, loading guard, one close event, custom slots, and modal focus cleanup.
- Map: no Google readiness hang in either owned-script or application-owned importer routes; deterministic fake-clock/script/import mocks without production credentials. For both routes test timeout, late resolution/rejection after timeout/retry, concurrency, provider switch, disconnect, and application namespace preservation. The accepted viewport contract is demonstrated without loops.
- Tabs: supported panel examples resolve browser accessibility relationships and preserve controlled selection; types compile in plain HTML/React/Angular usage.

Run focused tests for each slice and the shared verification gate. API decisions need usage examples and generated consumer compilation; observable interaction still requires browser evidence.

## Dependencies and completion

Plan 4 owns modal accessibility, actual tabs association integration, and dialog slot relationships. Plan 5 owns sidepanel collapse/variant transitions and thumbnail/reel poster contracts. This plan owns new concept/API definitions and their implementation except those explicit handoffs. Plan 3 owns field/framework accessors. No new local CLI storage migration or backward-compatibility reader is in scope.

Complete per slice only after final contracts, implemented behavior, tests, examples, and public metadata agree. Track any intentionally deferred API separately with a reason; a design proposal or passing build is not a completed capability.
