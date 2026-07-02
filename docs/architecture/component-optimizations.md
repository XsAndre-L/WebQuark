# Component Optimizations

## Methodology (v2 — comprehensive, all 24 components)

The first pass of this document only audited the 12 largest components by line count and made a real mistake on `q-dialog` (claimed `backdrop-filter` was unconditional when a `backdropEffect` prop already existed — caught and corrected). This version is a full re-audit of **all 24 components**, done in two stages: (1) full-file reads with a mandatory prop/method/event inventory *before* any finding is written, specifically to catch existing escape-hatches that a shallow pass would miss, then (2) an independent adversarial verification pass that re-read every file itself and tried to refute every finding. That process caught its own errors too — see "Corrections caught by verification" below. Every finding here has survived independent re-reading against the actual source; findings that didn't survive are recorded as refuted/revised rather than silently dropped.

Every recommendation preserves all current props, events, slots, and accessibility behavior, and has been screened against [`docs/unreal_compatibility.md`](../unreal_compatibility.md).

## Critical/High-Severity Findings (fix these first — correctness and safety, not just size)

1. **`q-dialog`: `backdropEffect` defaults to `'blur'`.** Already corrected earlier in this document's history — flip `dialog.tsx:23`'s default from `'blur'` to `'solid'`. The safe CSS path already exists and works; only the default is wrong. Also update `dialog.spec.ts:20-27` and `readme.md:12` to match.

2. **`q-sidepanel`: Escape and backdrop-click don't actually close the drawer.** `handleClose()` (`sidepanel.tsx:136-138`) only does `this.qClose.emit()` — it never sets `this.open = false`. Compare to `q-dialog`'s `handleCancel`/`handleConfirm`, which both set `open = false` *and* emit. This means a consumer who only listens for `qClose` (the documented pattern) sees the drawer visually stay open. This isn't theoretical — `syntax-box.tsx`'s own `SYNCBACK_MAP` (used by this repo's playground harness) has to manually force `cfg.props.open.currentValue = false` on `qClose` to work around this exact bug, meaning the codebase has already had to patch around its own defect once. Fix: add `this.open = false;` inside `handleClose()`. Only affects drawer mode (Escape/backdrop paths are gated on `variant === 'drawer'`); `nav` mode is untouched.

3. **`q-data-table`: `getItemKey()` crashes on primitive array items.** `item[this.keyField] in item` style checks use the `in` operator (`data-table.tsx:52-57`), which throws `TypeError` if `item` is a string or number rather than an object — confirmed directly (`'id' in 5` throws). `items` is typed `any[] | string`, so a consumer passing `[1, 2, 3]` or similar crashes the entire render, not just that row. Called from both `render()` and `toggleAllSelection()` (line 104) — two independent crash sites. Fix: guard with `typeof item === 'object' &&` before the `in` check.

4. **`q-quantity-selector`: `step` is completely unguarded.** `next = current + this.step` / `current - this.step` (lines 73, 87) have no validation anywhere in the file. `step="0"` makes the +/- buttons visually clickable but permanently inert (value never changes, so `isMinDisabled`/`isMaxDisabled` never reflect it either). A negative `step` silently inverts which button increases vs. decreases the value. Fix: clamp to `Math.abs(this.step) || 1` at the read site.

5. **`q-icon`: default `lib='lucide'` triggers an unpinned `@latest` CDN fetch — real bug, but the "obvious" fix is wrong.** `lib` defaults to `'lucide'` (`icon.tsx:19`), fetching from an unversioned CDN URL unless a consumer explicitly opts into `lib='local'`. A first-draft fix proposed flipping the default to `'local'` — **that fix is wrong and was caught in verification**: the bundled local set (`src/assets/icons/`) only has 16 SVGs, and real usage in this repo already depends on icons outside that set (`playground-header.tsx:31` uses `name="sun"`, not in the local 16 — flipping the default would 404 and silently render the broken-icon fallback for every such usage). **Correct fix: pin the CDN version** (e.g. `lucide-static@0.x.y` instead of `@latest`) rather than changing the default. Don't touch the default value.

6. **`q-icon`: no fetch timeout.** `const response = await fetch(finalUrl)` (`icon.tsx:146`) has no `AbortController`/timeout. A hung request (dead CDN, flaky network) leaves the icon in an indefinite loading state with no error path ever firing. Fix: wrap with `AbortSignal.timeout(...)`.

7. **`q-toggle`: `hasCheckedIcon`/`hasUncheckedIcon` state is dead code — the opposite of an earlier claim.** A first-draft pass asserted these two `@State()` fields (`toggle.tsx`, set in `checkSlots()`) are "live-used, driving the `is-hidden` class toggles" — **that's false, caught in verification.** Only `hasDefaultSlot` is actually read anywhere (`toggle.tsx:136,190`); `hasCheckedIcon`/`hasUncheckedIcon` are written on every slotchange and never read again — grepped, zero other references. The `is-hidden` classes at lines 171/179 are driven by `this.checked`, not these fields. Low runtime harm (wasted DOM queries on slot change, no visible bug), but worth removing or wiring up, and worth remembering as the cautionary example for why every "confirmed correct" claim in this document was independently re-checked, not just trusted.

## Findings by Category

### Actions — `button`, `link`

Both: **no findings.** Independently re-verified — `getResolvedRel()` (button.tsx:74-77) and `resolvedRel` (link.tsx:34-38) both correctly default to `noopener noreferrer` on `target="_blank"`; disabled-state handling strips all interactive attributes on both; no duplication, no unsafe defaults, no banned CSS. These are clean, and the verification pass explicitly resisted inventing findings just to have something to report — worth noting as a positive signal about the rest of this document's findings.

### Forms & Inputs — `input`, `textarea`, `dropdown`, `toggle`, `quantity-selector`, `form`

**`q-input`**
- Duplicated min/max/step clamping across `handleIncrement`/`handleDecrement`/`handleBlur` (~lines 106-183) — `utils/math.ts` already exports `clamp()`, unused here. Consolidate.
- ~14 occurrences of `!== undefined && !== null` on `min`/`max`/`step` — simplify to `!= null` (loose equality intentionally, so external JS consumers assigning `null` directly aren't broken — a TS-only `!== undefined` simplification would be a real, if narrow, regression for that case).

**`q-textarea`**
- `adjustHeightInternal()` fires twice per keystroke — once via the `@Watch('value')` (rAF-deferred) and once via a direct synchronous call in `handleInput` (line 88). Remove the direct call. Note: this shifts one height recompute from synchronous to rAF-deferred — no observable difference under normal paint timing, but it's a timing change, not a pure no-op.

**`q-dropdown`**
- Active-index-lookup logic (`focusedIndex` fallback resolution) is triplicated across 3 call sites — extract a helper.
- The close/reset sequence (`isOpen`/`focusedIndex`/`searchTerm`/`visibleCount`/`clearScrollLoading()`) is duplicated across 5 call sites, and **3 of those 5 omit the `visibleCount` reset** (`handleSelect`, `Escape`, `Tab` — not just 2 as a first pass claimed; `Escape` was miscategorized as one of the "correct" paths). Real, reproducible bug: scroll to grow `visibleCount`, close via any of those 3 paths, reopen — stale page size persists. Extract to one `closeMenu()` method used by all 5 sites; this fixes all three gaps uniformly regardless of the earlier miscount.

**`q-toggle`**
- `handleClick`/`handleKeyDown` duplicate the flip+emit pair (lines ~104-105, ~119-120) — the separate `@Method() toggle()` is intentionally different (documented no-emit-loop rationale) and should NOT be folded in. Extract only the click/keydown pair into `commitToggle()`.
- Dead state fields `hasCheckedIcon`/`hasUncheckedIcon` — see Critical Findings above.

**`q-quantity-selector`**
- No `disabled` prop exists at all — real, reachable gap (confirmed absent from both source and readme).
- `step` unguarded — see Critical Findings above.
- The min/max "is set" check (`!== undefined && !== null`) is repeated 12 times — extract `hasMin()`/`hasMax()` helpers.
- Clamp logic is triplicated across `increment`/`decrement`/`reconcileValue` with reversed operation order (safe for well-formed `min <= max` ranges; if a consumer misconfigures `min > max`, behavior was already ambiguous pre-fix, so this isn't a regression introduced by consolidating).

**`q-form`** — no findings. The `WeakSet` dedup logic (guards against `q-button`'s independent `qClick` emission plus native composed `click` bubbling) was checked and is real, necessary defensive code, not bloat.

### Navigation — `navbar`

- `parsedItems` (a `safeParseJson` call) is re-invoked 3 times per render (lines 132, 150, 174) — real repeated JSON-parse work when `items` is passed as a string. Same pattern exists in `dropdown.tsx`/`data-table.tsx` (not this component's problem to fix, just noted as a recurring shape). Memoize/cache once per render.
- `target="_blank"` → `rel` handling already correct, matches `q-button`'s pattern exactly.

### Layout & Structure — `card`, `panel`, `scrollable`, `sidepanel`

**`q-card`** — no findings.

**`q-panel`**
- `checkSlots()`'s slot-detection logic duplicates `q-card`'s `checkHeaderSlot()` pattern nearly verbatim — extract a shared `hasSlotContent()` helper into `utils/dom.ts` (which already hosts `getSlottedElements()`, so this is consistent with existing structure).
- Missing `aria-labelledby` auto-wiring: when a `header` slot has content but no `ariaLabel` prop is set, there's no accessible name link between the section and its header. Fix: give the header container a stable `id` and bind `aria-labelledby` to it when `hasHeader` is true. Minor caveat: this changes the shadow DOM output for any panel with a header (new attribute appears) — not a regression, but will affect DOM-snapshot tests if any exist.
- **Newly found in verification, not the original pass:** `stickyHeader`/`stickyFooter` silently do nothing if `scrollable` isn't also set, because `position: sticky` needs a scrolling ancestor and `.panel-body` only gets `overflow: auto` when `is-scrollable` is applied. Not a crash, just a silent no-op combination worth either documenting or auto-enabling scroll behavior when sticky is requested.

**`q-scrollable`**
- `target` prop is passed directly into `document.querySelector(this.target)` with no validation — an invalid CSS selector string throws an uncaught `SyntaxError`. Wrap in try/catch, falling back to the existing "not found" no-op path.
- `setViewportRef`/`setContentRef` duplicate ResizeObserver setup/teardown almost verbatim — extract a shared `observeResize()` helper.
- `setupCustomScroll` is a *third* near-identical ResizeObserver creation block — same extraction target as above.
- `handlePointerMove` is missing the `maxScrollTop <= 0` guard that its sibling `updateThumbPosition` already has (`updateThumbPosition` guards at lines 268-271; `handlePointerMove` doesn't). Traced this as genuinely reachable: start a drag while content is taller than the viewport, then have content shrink mid-drag (a `ResizeObserver` callback can fire between pointer-move events) — `maxScrollTop` hits 0 while the drag is still active, producing a `NaN` division that the browser silently no-ops on `scrollTop = NaN`, so it's a stuck/frozen thumb rather than a crash, but it's a real, traceable inconsistency with an existing, precedent-matching fix (copy the same guard).

**`q-sidepanel`**
- Escape/backdrop-click doesn't close — see Critical Findings above.
- `mode: 'flat' | 'grouped' | 'tree'` prop is completely dead — grepped the whole file, the only hit is the declaration itself; `renderNavItems()` branches only on `item.children` presence, never on `this.mode`. This is real public API doing nothing. Either wire it up or flag it to whoever owns the roadmap for removal — don't silently delete public API without a decision.
- Shares the exact `isVisible`/`isAnimatedOpen`/`setTimeout(...,50)`/`waitForTransitionEnd` animation-sequencing pattern with `q-dialog` almost verbatim — flagged as a duplication target, but (as established earlier in this document) don't "simplify" it with `@starting-style` — the `setTimeout` dance is the CEF-safe approach given Unreal's CEF version lag, keep it, just consider sharing the *implementation* between the two components.
- Minor: no `closeOnEsc`/`closeOnOverlayClick` opt-out props exist for the drawer, unlike `q-dialog`'s equivalent props — worth adding for API parity once the close-bug above is fixed, not urgent on its own.

### Overlays — `dialog`, `tooltip`

**`q-dialog`** — see Critical Findings for the `backdropEffect` default. Additionally shares the animation-state duplication with `q-sidepanel` noted above.

**`q-tooltip`**
- Renders a visible, empty bubble (padding/border/shadow still apply) when both `content` and the default slot are empty — `{this.content || <slot></slot>}` (line ~211) has no guard on `show()` for the fully-empty case. Guard `show()` on `this.content` being set or the slot having assigned content; the only current internal consumer (`q-syntax-box`) always passes `content`, so this doesn't affect anything already working.
- **Real, previously-uncaught cross-component robustness bug:** `q-tooltip` tracks its own `showTimer` and clears it correctly on `disconnectedCallback`/`show`/`hide`. `q-dialog` and `q-sidepanel` do not — both fire `setTimeout(() => {...}, 50)` inside `handleOpenChange` without storing the timer id anywhere, so nothing can cancel it. Traced a concrete repro: toggling `open` true→false→true within that 50ms window leaves two pending timeout callbacks both trying to run `waitForTransitionEnd` + `focusFirstElement`, which can produce a focus fight against the close path's own `safeFocus(previousActiveElement)`. Rare (requires rapid double-toggling), but real and reproducible — store and clear the timer id the same way `q-tooltip` already does correctly.

### Data Display — `data-table`, `syntax-box`

**`q-data-table`**
- `getItemKey()` crashes on primitive items — see Critical Findings.
- Re-parses `items`/`columns` via `safeParseJson` 3-4 times per render (`render()` calls `getParsedColumns()`, `getParsedItems()`, and `getSelectionState()` which internally re-parses items again). Thread the already-parsed values through as parameters instead of re-deriving them.

**`q-syntax-box`**
- The `code`/`value` bidirectional-sync watcher logic is duplicated near-verbatim across two `@Watch` handlers (lines ~35-74) — extract a shared sync helper.
- Unhandled clipboard-write rejection: the copy-to-clipboard `.then()` (lines ~120-129) has no `.catch()`. Clipboard writes can be rejected (permissions, insecure context, or unsupported in an embedded/CEF context) and currently fail silently with an unhandled promise rejection. Add `.catch()`.
- (Already covered in the roadmap review, still valid, not re-litigated here in detail: the duplicated syntax-highlighting functions that exist verbatim in `utils/syntax.ts` — import instead of reimplementing.)

### Feedback & Status — `circular-progress`, `step-diagram`, `step-diagram-item`

**`q-circular-progress`**
- `displayLabel` (the visible SVG text) treats an explicit empty-string `label` as intentional (`this.label !== undefined ? this.label : ...`), but `aria-label` falls back to the generic `"Circular Progress"` in that same case (`this.label || 'Circular Progress'` — falsy-string check, not `undefined` check). A consumer who intentionally sets `label=""` to visually suppress the caption gets a visible/accessible-name mismatch. Make `aria-label` use the same `!== undefined` check as the visible label. Low severity, safe, zero regression.

**`q-step-diagram`**
- `propagateLayout()` (which does a real DOM scan via `syncPropertyToSlottedChildren`) fires twice on every layout change: once from `@Watch('layout')`, once again from `componentDidUpdate()` immediately after, since `layout` is the component's only reactive input. Remove the `componentDidUpdate()` call; `componentDidLoad()` (initial mount) and the slotchange handler (new children) still cover the other cases.

**`q-step-diagram-item`**
- `status` defaults to `'completed'` rather than `'pending'`. **This is a legitimate design/DX observation, not a safety bug** — an earlier pass framed it as the same class of issue as `backdropEffect`'s unsafe default, and that framing doesn't hold up: every value in the `status` enum is fully and correctly implemented in CSS (verified all six `.status-*` blocks render correctly), so there's no broken or unsafe path being defaulted into, just an arguably-less-intuitive one. If this gets changed, treat it as a **breaking change** (existing markup with no explicit `status` currently renders as "completed"/green; changing the default would silently flip it to "pending"/gray) — semver-major, not a safe patch. Recommend documenting this as a known ergonomics note rather than queuing it as an actionable fix.
- The parent (`q-step-diagram`) pushes `layout` down via `syncPropertyToSlottedChildren`, while the child independently pulls it via `this.el.closest('q-step-diagram')` in `componentWillLoad()`. This is duplicate plumbing, but intentionally so — the pull handles correct initial value before the parent's lifecycle fires, the push handles runtime changes to already-mounted children. Informational only, not a bug, don't "fix" by removing either path.

### Media — `carousel`, `reel`, `thumbnail`, `icon`

**`q-carousel`**
- `isFirst`/`isLast` boundary logic is duplicated across 3 call sites — extract as getters.
- The scroll-boundary calculation (`scrollLeft`/`startOffset`/`nextAtStart`/`nextAtEnd`) is duplicated across `calculateLimits()` and `handleScroll()` — extract one method (this was also flagged in the original pass; still valid).
- The `qSlideChange.emit(...)` block is duplicated across 2 call sites — extract `emitSlideChange()`.
- `itemWidth`/`snapAlignment` have no `@Watch` decorators, so a consumer setting these props programmatically *after* mount never triggers the CSS custom-property update that applies them — only initial mount and slot-change re-derive them. Add `@Watch` handlers for both.

**`q-reel`**
- `currentIdx` lookup (`thumbnails.indexOf(...)`) is triplicated across `handleKeyDown`'s two branches and `render()` — extract a helper.
- The lightbox `<video>` element has `autoplay` with no `muted`, and `loop` with no per-item opt-out. Two separate issues bundled here: (1) `autoplay` without `muted` is inert under near-universal browser autoplay policy today regardless of the Unreal question — add `muted`. (2) More importantly, this is a `<video>` element in a component explicitly meant to run inside Unreal's CEF OSR target, and `unreal_compatibility.md` explicitly names DRM/H.264 video as broken there ("renders as a solid green, blue, or black block with audio only"). This deserves an explicit, standalone docs note (WebM/VP8 or unencrypted sources only) rather than being folded into a general "reliability" footnote — there's no code-level fix possible since the video source is consumer-supplied, so this is a documentation-compliance item, not a code change.
- Minor: `navigateMedia()` reads a thumbnail's media descriptor (`src`/`label`/`video`/`alt`) directly off the slotted element, duplicating logic that `q-thumbnail`'s own `handleTrigger` already implements to emit the same four fields. Cross-file duplication a per-file audit pass wouldn't catch on its own.

**`q-thumbnail`** — no findings.

**`q-icon`** — see Critical Findings for both the CDN-pinning fix and the fetch-timeout gap.

## Cross-Component Shared Utilities (from the original 12-component pass — restored)

These were verified in the first version of this document and remain valid; they were dropped when this document was rewritten to add the other 12 components (an overwrite, not a merge — caught and fixed here rather than left silently missing):

- **`observeResize()` helper** — `q-scrollable` triplicates ResizeObserver setup/teardown internally (`setViewportRef`/`setContentRef`/`setupCustomScroll`, already listed above), and **`q-carousel` independently reimplements the identical ResizeObserver setup pattern** (`carousel.tsx`, single observer tied to `scheduleCalculateLimits()`). Two independent audits corroborated this same duplication across the two files. One shared `observeResize(element, callback)` helper in `dom.ts` covers both, not just `q-scrollable`'s internal triplication.
- **Debounce/delayed-action helper** — `q-dropdown` (scroll-loading debounce), `q-tooltip` (show delay), `q-scrollable` (auto-hide-scrollbar timer), and `q-carousel` (programmatic-scroll-end fallback timer) each hand-roll their own `clearTimeout`+`setTimeout` bookkeeping with a stored timer handle. A small shared `DebouncedAction`-style helper (`.invoke(fn, delay)` / `.clear()`) collapses this into one utility used four times. (Note: this is a separate concern from the untracked-timer *bug* found in `q-dialog`/`q-sidepanel` in this pass's Overlays section — those two don't store the timer at all; this finding is about `q-dropdown`/`q-tooltip`/`q-scrollable`/`q-carousel`, which do store and clear it correctly, just redundantly.)
- **`getContainingBlock()` promotion** — `q-tooltip`'s ~50-line stacking-context-detection utility (`tooltip.tsx`) is a genuinely reusable positioning helper that's currently tooltip-local. Move it to `dom.ts` so any future floating/positioned component doesn't reimplement it.
- **`safeFocusAfterPaint()`** — `q-reel` calls `setTimeout(() => safeFocus(el), 50)` three times (lightbox open, close, navigate) with identical shape. Collapse to one helper in `dom.ts`.
- **Actually use the existing `clamp()`** — `src/utils/math.ts` exports `clamp(value, min, max)`, but `q-scrollable` and `q-carousel` both write inline `Math.max(a, Math.min(b, c))` in several places instead of calling it (in addition to `q-input`/`q-quantity-selector`'s own unguarded clamping, listed separately above, which is a correctness issue rather than just an unused-utility one).

## Corrections caught by verification (kept here for transparency, not deleted)

The adversarial pass wasn't just confirming the first pass — it found and corrected three real errors in it:

1. **`q-toggle`**: a claim that `hasCheckedIcon`/`hasUncheckedIcon` state is "live-used" was backwards — they're dead code. Corrected above.
2. **`q-icon`**: the proposed fix for the unsafe CDN default (flip default to `'local'`) would have broken existing usage (`playground-header.tsx`'s `name="sun"` isn't in the 16-icon local set) — the verification pass caught this by actually checking asset coverage before approving the fix, not just re-confirming the bug existed. Corrected fix is version-pinning instead.
3. **`q-step-diagram-item`**: a claim that the `status` default was "the same class of bug as `backdropEffect`" over-stated it — it's a design-ergonomics note, not a safety defect, and the proposed fix would have been a silent breaking change. Reframed above.

## Considered and Rejected (from the original pass — restored, still applies)

Recorded so these don't get re-proposed later by someone who only skims the findings list:

- **Merging `q-dropdown`'s outside-click detection with `q-dialog`/`q-sidepanel`'s backdrop-click-to-close into one shared utility.** `q-dropdown` has no backdrop element (a lightweight floating listbox, not a modal) and needs a global `window`-level `composedPath()` check — there's no other way to detect "click happened outside me." `q-dialog`/`q-sidepanel` render an actual full-viewport backdrop whose job is bigger than click detection — dimming, blocking interaction, establishing stacking context. Forcing these into one utility for a ~10-15 line saving isn't worth bending either component to fit.
- **Flattening `class={{...}}` binding objects to template strings.** Ubiquitous across the library, but each component's conditions are component-specific; a generic `classMap()` helper would relocate the duplication, not reduce it, and the object syntax is more readable and less error-prone than concatenated conditional strings.
- **Rewriting `q-scrollable`'s custom scrollbar (~165 lines of pointer-drag + thumb-position math) around a "native" API.** There isn't a cross-browser native API for a fully custom-styled scrollbar thumb/track — that's the entire reason this hand-rolled implementation exists. The safe subset (deriving thumb position from `scrollTop` on demand instead of mirroring it through extra state) is worth doing, a wholesale "replace with native behavior" rewrite isn't a real option.
- **Migrating `q-tooltip`'s manual `getBoundingClientRect()` positioning to the CSS Anchor Positioning API.** Rejected on maturity grounds — Unreal's bundled CEF lags several versions behind mainline Chrome (per `unreal_compatibility.md`'s own reasoning for banning `@container` queries), and Anchor Positioning is in the same "too new" risk bracket. Promoting `getContainingBlock()` into `dom.ts` (above) gets the maintainability benefit today without betting on either compatibility question.
- **Migrating `q-dialog` to the native `<dialog>` element, and replacing its `setTimeout`-based animation state with `@starting-style`.** Both explicitly wrong for this codebase's Unreal/CEF target — native `<dialog>`'s `::backdrop` renders as a solid black block under CEF OSR per `docs/unreal_compatibility.md`, and `@starting-style` carries the same CEF-version-lag risk as `@container` queries. See the Critical Findings section for the actual correct fix (flip `backdropEffect`'s default).

## Prioritized Implementation Plan

1. **`q-dialog` `backdropEffect` default** and **`q-sidepanel` Escape/backdrop-click not closing** — both are one-or-two-line fixes for real, user-visible breakage (one confirmed by an actual workaround already living elsewhere in this codebase). Do these first, together, since both touch the overlay/animation pattern.
2. **`q-data-table` primitive-item crash** and **`q-quantity-selector` unguarded `step`** — both are crash/dead-control bugs, not style issues. Small, isolated fixes.
3. **`q-icon`: pin the CDN version** (not a default flip) and **add a fetch timeout**. Do these together since they're the same file and same root cause (unbounded external dependency).
4. **`q-tooltip`-style timer tracking, backported to `q-dialog`/`q-sidepanel`** — store and clear the `setTimeout(...,50)` id the way `q-tooltip` already does correctly, to close the rapid-toggle focus-fight window.
5. **`q-toggle` dead state removal**, **`q-syntax-box` clipboard `.catch()`**, **`q-tooltip` empty-bubble guard** — small, independent, low-risk fixes, bundle together.
6. **Mechanical dedup batch** — carousel's triple duplication (boundary calc, isFirst/isLast, emitSlideChange), reel's triplicated `currentIdx`, dropdown's `closeMenu()` extraction (which also fixes the 3-of-5 `visibleCount` bug), toggle's `commitToggle()`, quantity-selector's `hasMin()`/`hasMax()` + clamp consolidation, input's clamp consolidation + null-check cleanup, textarea's double-call fix, panel/card's shared slot-detection helper, scrollable's triple ResizeObserver dedup + `target` try/catch + `handlePointerMove` guard, step-diagram's duplicate-call removal, navbar's memoized `parsedItems`, data-table's redundant-parse threading.
7. **`q-reel` video docs note** — no code change, just document the WebM/VP8-only guidance explicitly rather than as a footnote.
8. **`q-step-diagram-item` `status` default** — document as a known ergonomics note; only change the default as a deliberate, separately-planned breaking change if the team decides it's worth it, not as part of this cleanup pass.
9. **`q-panel` `aria-labelledby` wiring** and **`stickyHeader`/`stickyFooter` + `scrollable` interaction** — bundle together since both are in the same file.
10. Everything already covered in the original pass and not superseded here (`q-syntax-box`'s highlight-function dedup from `utils/syntax.ts`, the shared form-association helper across `input`/`textarea`/`dropdown`/`toggle`/`syntax-box`, `q-button`'s already-confirmed-correct `rel` handling — no longer a finding, drop from any future to-do) still stands as documented earlier in this file's history.

## Estimated Impact

This pass found meaningfully more than the line-count exercise the first version of this document was built around — several of the highest-priority items here (sidepanel's close bug, data-table's crash, quantity-selector's dead controls, icon's unbounded CDN dependency, the tooltip/dialog/sidepanel timer race) are correctness and safety fixes with near-zero line-count impact, not size reductions. The original ~350-450 line estimate for the 12-largest-component pass still roughly holds for the pure-size items; layer on top of that a comprehensive correctness pass across the other 12 components that wasn't measured in lines at all, because line count was never the right metric for most of what turned up here.
