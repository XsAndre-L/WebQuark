# Plan 5: Layout, media, and styling

Status: proposed implementation plan. No component changes have been implemented by this plan.

## Outcome and scope

Runtime prop changes, late content, small viewports, and reattachment produce correct geometry. Supported panels remain reopenable. Video can use a separate poster, and shared defaults provide consistent contrast, sizing, RTL placement, and reduced-motion behavior.

Owns F16–F17, F20–F21, F23–F24, F27–F29 and visual portions of F28; recommendation IDs **25–26, 29–30, 33–34, 37–38, 47** in the [plan index](D:/Dev/PurelyIT/WebQuark/docs/architecture/component-quality-plans/README.md). Layout fixes, sidepanel geometry, and reel/thumbnail source changes can begin independently. Their final modal integration uses Plan 4's shared lifecycle through the coordinated handoff below.

## Implementation locations

- Carousel component/geometry/transitions, sidepanel component/styles, scrollable internals/styles, panel styles, pagination, thumbnail/reel types and renderers, avatar, toast, step styles, and authored [theme token definitions](D:/Dev/PurelyIT/WebQuark/src/theme/tokens.ts). Regenerate [theme CSS](D:/Dev/PurelyIT/WebQuark/src/theme/tokens.css) and reference output through the normal theme/build workflow rather than editing generated defaults independently.
- [Carousel guide](D:/Dev/PurelyIT/WebQuark/docs/components/q-carousel.md), [navbar guide](D:/Dev/PurelyIT/WebQuark/docs/components/q-navbar.md), other touched guides, playground specifications, and documentation tooling.
- Existing carousel multi-browser, pagination, toast, theme, and component suites; add built-component geometry/reconnect/media tests as needed.

## Contract decisions

1. **Geometry:** public layout props take effect at runtime without requiring detach/attach or an unrelated resize. Observe the actual content affecting measurements, batch recalculation, and release resources on removal. Do not introduce permanent polling.
2. **Panel ownership:** each panel mode has one intended scroll container. Preserve sticky regions and apply keyboard focus/scroll behavior to that container.
3. **Video:** proposed additive `poster` source, with `src` retaining the playable media source. Image thumbnail behavior remains unchanged. Carry both sources through maximize events and reel content, with independent loading/failure fallback and no assumption that a video URL is an image. Align new q-media behavior in Plan 6 with this contract.
4. **Motion/themes:** share accessible on-accent text/background pairings and one reduced-motion policy. Suppress unnecessary movement while still completing transitions, events, focus, and cleanup. Preserve consumer token overrides and current compact-baseline intent.
5. **Guide coverage:** compare public prop/slot metadata with explicit authored coverage or a documented intentional omission. Keep explanatory guides authored; do not replace them with generated tables. New/changed API coverage belongs in every batch; this batch owns the checker and existing carousel/navbar drift.

## Implementation sequence

1. Add carousel watchers for itemWidth and snapAlignment, synchronizing host variables before metrics. Observe slotted slide geometry and late image/content changes, including newly added/replaced slides. Recalculate offsets, arrows, snapping, and active state without unwanted navigation or duplicate events.
2. Model sidepanel variant/open/collapsed transitions explicitly. Persistent hidden collapse controls remain reachable; drawer entry/exit synchronizes visibility, focus, inertness, and scroll registration with the shared modal utility. Define what happens to open/collapsed state on every variant transition. Fix transitions to contain one valid duration/easing pair and preserve theme overrides. Implement geometry first, then coordinate one Plan 4 lifecycle integration patch.
3. Fix scrollable visibility selectors and persistent autoHide=false state. Hover, scrolling, and focus expose usable controls; a focused thumb cannot remain invisible. Reinitialize observers, listeners, target styles, and metrics on reconnect without duplicate listeners. Cap minimum thumb size to the track; handle zero/small dimensions and long content with valid drag/keyboard ranges.
4. Resolve panel CSS specificity to one scroller per mode. Verify header/footer sticky combinations, bounded and unbounded sizes, nested panels, keyboard scrolling, and integration with q-scrollable.
5. Normalize pagination counts/page/pageSize to finite valid effective integers, clamping after flooring. Use the same values for summaries, ranges, disabled actions, and emitted payloads. Define zero-total behavior and correct out-of-range page normalization without event loops.
6. Add the poster/media contract and propagate it through thumbnail/reel types, events, rendering, guide examples, and generated wrappers. Carry both sources through previous/next navigation as well as initial maximize, since reel navigation rebuilds media state separately. Test video poster errors and playback errors separately; preserve image and explicit consumer-supplied gallery use.
7. Fix centered toast positioning in both directions while keeping start/end positions logical. Share numeric/CSS size normalization with avatar and existing icon/progress behavior. Resolve thumbnail state border colors locally while preserving explicit border overrides.
8. Fix default accent contrast for outgoing bubbles and primary actions using shared theme pairs. Check supported presets/states and measure representative normal-text contrast of at least 4.5:1 and relevant nontext/large-text contrast of at least 3:1. Consumer custom themes remain consumer-controlled.
9. Apply the motion policy to dialog/reel/steps and audit touched transitions for reduced motion. Keep existing carousel/toast/map/progress policies coherent; do not add map-specific behavior outside Plan 6. Test completion with zero-duration/reduced transitions.
10. Refresh carousel transition/transitionDuration/controls-extra and navbar navAlign/navCenterWithin/collision guidance against current source. Add the metadata/guide coverage check to the normal tooling workflow, with explicit handling of scaffold/reserved APIs until Plan 6 matures them. Update screenshots only for changed examples and preserve established guide structure.

## Acceptance checks

- Carousel: runtime style changes, variable slide widths, late image load, slot replacement, resize, RTL, disconnect/reconnect, transition modes, controls-extra, and reduced motion. Run the existing carousel Chrome/Firefox/WebKit project when available.
- Sidepanel: all variants and sides; hidden/rail collapse with header/footer/edge controls; reopenability; every variant transition while open/closed; valid computed transitions; modal utility cleanup.
- Scrollable/panel: autoHide both values, focus/hover/scroll, short/zero tracks, drag/keyboard ranges, reconnect, target replacement, sticky combinations, exactly one intended scroller.
- Pagination: zero, negative, fractional, nonfinite, very large, and out-of-range inputs; finite summaries and payloads; no zero page size or division by zero.
- Media: distinct valid poster/video URLs, errors in either resource, image parity, maximize payload, loading and accessible fallback. Navigate previous/next through mixed image/video galleries and verify media/poster identity survives every transition and reopening. Preserve the current first/last-item boundaries; do not add wrapping as incidental cleanup.
- Themes: contrast measurements, numeric/CSS sizes, highlighted border and explicit overrides, RTL toast center/start/end, reduced-motion completion and focus cleanup.
- Documentation checker: a missing public prop/slot coverage entry fails; intentional exclusions are explicit; authored guide sections and existing links survive.

Use built elements with production CSS for layout assertions and targeted screenshots only where visual verification is material. Helper-only tests cannot prove selector/geometry fixes. Run the shared gate and record browser/CEF limitations accurately.

## Dependencies and completion

Plan 4 owns shared modal focus, names, steps semantics, and table behavior. Plan 6 owns sidepanel navigation modes/destinations and scaffold media rendering. Maintain a single source owner during each sidepanel/reel patch. Plan 3 owns navbar collection parsing; this plan updates navbar guidance after Plan 4's mobile behavior lands.

Complete when every acceptance area has evidence, runtime behavior matches generated/authored APIs, visual defaults and motion are verified, and reconnect leaves no leaked observers/listeners/styles. This plan does not rebuild the design system or recategorize components.
