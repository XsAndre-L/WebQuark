# Component Roadmap Review

## Summary Recommendation

Keep all four proposed components (`q-link`, `q-panel`, `q-navbar`, `q-form`) — all four already exist as full implementations (not stubs), and on inspection none of them duplicate an existing component without a clear, distinct responsibility. The redundancy concerns in the brief don't hold up against the actual source:

- `q-link` owns "inline text link" semantics (`mailto`/`tel` shorthand, auto `rel`, external-link affordance) that `q-button`'s `href` mode doesn't attempt.
- `q-panel` is a flat structural region (scroll/sticky, three slot regions); `q-card` is a decorative elevated surface (elevation/lift/glass, two slot regions). Different axis entirely.
- `q-navbar` is a horizontal top bar with built-in responsive collapse; `q-sidepanel` is a vertical, tree-capable rail. Most apps end up wanting both, not one-or-the-other.
- `q-form` wraps a real `<form>` and relies on native flattened-tree form-owner resolution — architecturally correct, and confirmed working for plain native submit controls today.

The actual risk in this codebase isn't naming overlap, it's **consistency debt**: `q-form`'s core promise (submit via a slotted `q-button`) is currently broken, `q-syntax-box`'s form participation is incomplete and unconditional, and five components each hand-roll their own form-association boilerplate independently with no shared helper. Those are the things worth fixing before anything ships as "done."

## Component Decisions

### q-link

- **Decision:** Keep. Distinct from `q-button href`.
- **Why:** `q-button`'s `href` mode (`src/components/actions/button/button.tsx:99-114`) renders a bare `<a>` — no `rel` handling, no `mailto`/`tel` resolution, no external-link affordance, and it's visually a button, not a text link. `q-link` (`src/components/actions/link/link.tsx`) owns a genuinely different responsibility: `mailto`/`tel` shorthand resolution (`resolvedHref`, lines 26-32), automatic `rel="noopener noreferrer"` when `target="_blank"` (`resolvedRel`, lines 34-38), an external-link icon affordance, and text-link visual variants (`variant`, `underline`) that a button component shouldn't carry. These are non-overlapping concerns — collapsing them into `q-button` would either bloat the button API or force text links to look like buttons.
- **Smallest API:** `href | url | mailto | tel`, `target`, `rel`, `download`, `label`, `variant`, `underline`, `external`, `disabled`; events `qClick`, `qFocus`, `qBlur`. Already close to minimal.
- **Changes:** `href` and `url` are redundant aliases — `resolvedHref` checks `href` first, then falls back to `url`, and both do exactly the same thing (lines 26-32). Drop `url`; it adds API surface with zero behavioral difference. Low priority.

### q-panel

- **Decision:** Keep. Clearly distinct from `q-card`.
- **Why:** `q-card` (`src/components/layout/card/card.tsx`) is a decorative elevation primitive: `elevation`/`lift`/`glass`, two regions (`header`, default body), no scroll or sticky behavior. `q-panel` (`src/components/layout/panel/panel.tsx`) is a flat structural region: `variant: 'plain' | 'surface' | 'bordered'` (no elevation concept at all), three regions (`header`, body, `footer`), `scrollable`, `fullHeight`, `stickyHeader`, `stickyFooter`. One answers "how should this surface look," the other answers "how should this region of the layout behave." Genuinely non-overlapping.
- **Smallest API:** `variant`, `padding`, `scrollable`, `fullHeight`, `stickyHeader`, `stickyFooter`, `ariaLabel`; slots `header` / default / `footer`. Already minimal — no changes needed to the surface itself.
- **Changes:** None required. Worth calling out as the **reference implementation** for empty-slot collapsing: `panel.tsx:20-33` uses `@State() hasHeader/hasFooter` + `getSlottedElements()` (`src/utils/dom.ts`) + `onSlotchange` to toggle an `is-hidden` class — this is the correct pattern. (See Current Mistakes/Risks — `q-sidepanel` fakes the same behavior with a `:empty` CSS selector that can never match, and should be backported to this pattern.)

### q-navbar

- **Decision:** Keep. Distinct from `q-sidepanel`.
- **Why:** Different UI axis, not a redundant alternative. `q-navbar` (`src/components/layout/navbar/navbar.tsx`) is a horizontal top bar: brand/logo, a flat single-level `NavbarItem[]` (no `children`, no accordion/tree — `navbar.tsx:4-11`), and a built-in responsive collapse to a hamburger menu with dedicated `mobile-nav`/`mobile-actions` slots (lines 172-180). `q-sidepanel` in `nav` mode is a vertical rail with recursive `children`, `mode: flat|grouped|tree`, and `accordion` grouping, but **no built-in responsive collapse at all**. A real app shell commonly needs both simultaneously (top bar + side rail), so this isn't an either/or redundancy.
- **Smallest API:** `brand`, `logoSrc`, `logoAlt`, `brandHref`, `items`, `activeValue`, `mobileLabel`, `sticky`, `compact`, `transparent`, `bordered`; slots `brand`/`nav`/`actions`/`mobile-nav`/`mobile-actions`; events `qSelect`, `qMenuToggle`. Reasonable as-is.
- **Changes:** No structural changes required. Worth noting: `q-navbar`'s active-item matching (`renderNavItem`, line 91) and `q-sidepanel`'s active-leaf matching are independently hand-rolled with similar-but-not-identical logic and item shapes (`NavbarItem` vs `SidepanelItem`). Not urgent, but a shared minimal `NavItem` type + "is this item active" helper in `src/utils/` would stop the two from drifting further apart as both evolve.

### q-form

- **Decision:** Keep, but it needs one concrete fix before it can be considered correct.
- **Why:** The core architecture is right and matches "prefer native browser behavior": `form.tsx` renders a real `<form>` inside its own shadow root, with the body and actions `<slot>`s placed **inside** that `<form>` (`form.tsx:256-275`). This is the correct shape for shadow-DOM form composition — the HTML spec's form-owner resolution walks the *flattened* (post-slot-assignment) tree specifically to support this pattern, and it already works today for zero extra code: a plain native `<button type="submit">` or `<input type="submit">` slotted directly as a light-DOM child of `<q-form>` will correctly trigger `formEl`'s submit natively, no JS required.
- **The gap:** it does **not** work for `<q-button type="submit" slot="actions">`, which is exactly the pattern the library's own docs would tell people to use. `q-button`'s native `<button>` lives inside `q-button`'s **own separate shadow root** — that's a second, unbridged shadow boundary. Since `q-button` is not form-associated (confirmed — no `formAssociated: true`, no `AttachInternals`), there is no mechanism connecting a click on that inner button back to `q-form`'s inner `<form>`. I read `form.tsx` in full: there is currently **no click-delegation code at all** — the only submission path is a native `submit` event on `formEl` (line 265). Clicking a slotted `q-button type="submit"` today does nothing.
- **Best architecture:** Don't make `q-button` form-associated just to fix this — that adds unrelated complexity to a component that has no "value." Instead, add one small `@Listen('click')` handler on `q-form` itself that reads `event.composedPath()` (composed `click` events already cross shadow boundaries natively, so this needs no cooperation from `q-button`), finds the nearest element whose resolved `type` is `submit` or `reset`, and calls `this.formEl.requestSubmit()` / `.reset()` directly. This is the minimal-code fix, it's fully generic (handles `q-button`, native buttons, and anything else with a `type` attribute uniformly), and it keeps the fix contained entirely inside `q-form` rather than spreading form-awareness into components that shouldn't need it.
- **Smallest API:** `label`, `action`, `method`, `autocomplete`, `enctype`, `target`, `noValidate`, `preventDefault`; events `qSubmit`, `qReset`; methods `getValues`, `setValues`, `resetForm`, `submitForm`. Appropriately small. One simplification worth considering later: `collectValues`/`getNamedControls`/`readControlValue` (`form.tsx:118-213`) manually re-walks all `[name]` elements as a parallel path alongside native `FormData` construction — this exists to cover `q-toggle` (whose boolean value needs special handling) and any non-form-associated `q-*` control, but once every `q-*` control reliably participates via `setFormValue`, most of that manual path becomes redundant with what `new FormData(formEl)` already collects. Not urgent.
- **Changes:** Add the `composedPath()`-based click delegation for submit/reset (required — this is the component's core promise and it currently doesn't work). Everything else about the current design should stay as-is.

## Existing Component Changes

### q-input

- **Recommendation:** No changes required.
- **Changes:** None. Its `formResetCallback` (lines 63-68: restore `initialValue`, call `setFormValue`) is the reference-correct pattern the other form controls should be judged against.

### q-textarea

- **Recommendation:** No changes required.
- **Changes:** None. Matches `q-input`'s pattern consistently, including `formResetCallback`.

### q-dropdown

- **Recommendation:** No changes required.
- **Changes:** None. Matches the same pattern (`formResetCallback` at lines 77-82).

### q-toggle

- **Recommendation:** No changes required — flagged as an "inconsistency" by a first pass, but on inspection it's correct.
- **Changes:** None. `setFormValue(newValue ? 'true' : null)` is the only form control in the library using a `'true' | null` encoding instead of a plain string, but this is intentional and correct: passing `null` to `setFormValue` removes the entry from `FormData` entirely, which is exactly how native `<input type="checkbox">` behaves when unchecked (it contributes nothing, not an empty string). Don't "fix" this to match the others — the others are the odd ones out here, not `q-toggle`.

### q-syntax-box

- **Recommendation:** Keep `formAssociated: true` and the `name` prop, but scope form participation to when it's actually meaningful, and close the reset gap.
- **Why this shape:** `q-syntax-box` serves two real use cases today — passive code display/preview (the common case: docs, examples, read-only output) and an editable code-input field (`editable: true`). Only the second one has any business contributing a value to a wrapping form. Right now it unconditionally calls `setFormValue` on every code change regardless of `editable` (`syntax-box.tsx:32-89`), which means dropping a purely-decorative code sample into a `<q-form>` (e.g., to show example output next to real inputs) silently adds an unwanted field to `qSubmit`'s `values`/`FormData`. That's a real footgun, not a hypothetical one.
- **Changes:**
  1. Gate `setFormValue` calls behind `this.editable` — call `setFormValue(null)` (or skip entirely) when not editable, so display-only usage never participates in a form.
  2. Add the missing `formResetCallback()` — every other form-associated component in the library implements this (restore initial value, re-call `setFormValue`); `q-syntax-box` is the only one that doesn't, so a `form.reset()` currently leaves stale edited code on screen.
  3. Minor: `code` and `value` are bidirectionally-synced aliases for the same thing (same smell as `q-link`'s `href`/`url`). Consider picking one canonical prop and keeping the other only as a deprecated pass-through, to keep the API surface honest.

## Current Mistakes / Risks

1. **`q-form` submit is currently broken for its own button component.** Slotting `<q-button type="submit">` into `q-form`'s `actions` slot does nothing — confirmed by reading `form.tsx` in full, there is no click-delegation logic bridging `q-button`'s internal (separately shadow-rooted) native button back to `q-form`'s internal `<form>`. This is the component's core promise and it doesn't work yet. **Highest priority fix.**
2. **`q-syntax-box` is `formAssociated` but has no `formResetCallback`**, and participates in forms unconditionally even when purely used as a display/preview widget (`editable: false`). Both are real functional gaps, not style nits.
3. **`q-button`'s `href` mode never sets `rel`**, even when `target="_blank"` (`button.tsx:99-114` — no `rel` attribute at all). `q-link` handles this correctly (`resolvedRel`, auto `noopener noreferrer`). This is a small reverse-tabnabbing security gap that's a two-line fix by copying `q-link`'s pattern.
4. **`q-sidepanel`'s header/footer empty-slot collapsing is broken.** It uses `.nav-header:empty { display: none }` / `.nav-footer:empty { display: none }`, but the wrapper `<div>` always contains a literal `<slot>` child element, so `:empty` can never match regardless of whether content is projected — the footer in particular will show a stray border + padding even when unused. `q-panel` already solved this exact problem correctly in the same codebase (`getSlottedElements()` + `onSlotchange` + `@State`, `panel.tsx:20-33`) — backport that pattern rather than inventing a new one. (Outside this review's four components, but directly relevant and cheap to fix using an already-proven local pattern.)
5. **No shared form-association helper exists.** `q-input`, `q-textarea`, `q-dropdown`, `q-toggle`, and `q-syntax-box` each hand-roll their own `@AttachInternals()` + `@Watch` + `componentWillLoad` + `formResetCallback` boilerplate independently (confirmed near-identical ~15-20 line blocks in each). This is exactly the duplication the library's own "least possible code" principle warns against, and it's already visibly drifting — `q-syntax-box` (the 5th copy) is missing a method the first four have. Worth factoring into one small shared helper now, before a 6th or 7th form control copies the same boilerplate.
6. **Two components have redundant dual-prop aliases** that do the same thing: `q-link`'s `href`/`url`, `q-syntax-box`'s `code`/`value`. Minor, but each is unnecessary API surface for zero behavioral gain.
7. **Nav-item shape and active-matching logic are duplicated** between `q-navbar` (`NavbarItem`/`activeValue`) and `q-sidepanel` (`SidepanelItem`/`value`) with no shared type or helper. Not urgent, but will drift further as both components evolve independently.

## Prioritized Implementation Plan

1. **Fix `q-form` submit delegation** — add the `composedPath()`-based `@Listen('click')` handler for `type="submit"`/`type="reset"`. Blocks correctness of the newest component; do this first.
2. **Fix `q-syntax-box`** — gate `setFormValue` behind `editable`, add `formResetCallback`.
3. **Fix `q-button`'s missing `rel`** on `target="_blank"` — copy `q-link`'s `resolvedRel` getter. Trivial, do it alongside #1 or #2.
4. **Extract a shared form-association helper** and migrate `q-input`, `q-textarea`, `q-dropdown`, `q-toggle`, `q-syntax-box` onto it. Do this once the above fixes land, so the helper is written to cover the just-fixed `q-syntax-box` behavior correctly from the start.
5. **Trim redundant aliases** — drop `q-link`'s `url` and `q-syntax-box`'s `value` (or formally deprecate them). Low priority, do opportunistically.
6. **Nice-to-have, not blocking:** backport `q-panel`'s `getSlottedElements`/`onSlotchange` pattern to `q-sidepanel`'s header/footer; extract a shared `NavItem` type + active-matcher for `q-navbar`/`q-sidepanel`.

## Minimal Target API Summary

```typescript
// q-link — inline text link with mailto/tel sugar and safe target=_blank rel handling
interface QLink {
  href?: string;              // url alias dropped (see Changes)
  mailto?: string;
  tel?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;                // auto-computed to 'noopener noreferrer' when target=_blank and unset
  download?: string;
  label?: string;
  variant: 'default' | 'muted' | 'accent' | 'danger';   // default: 'default'
  underline: 'hover' | 'always' | 'none';                // default: 'hover'
  external: boolean;                                     // default: false
  disabled: boolean;                                     // default: false

  qClick: EventEmitter<MouseEvent>;
  qFocus: EventEmitter<FocusEvent>;
  qBlur: EventEmitter<FocusEvent>;
  // slots: icon-left, default (label), icon-right
}

// q-panel — flat structural layout region (no elevation)
interface QPanel {
  variant: 'plain' | 'surface' | 'bordered';   // default: 'surface'
  padding: 'none' | 'sm' | 'md' | 'lg';         // default: 'md'
  scrollable: boolean;                          // default: false
  fullHeight: boolean;                          // default: false
  stickyHeader: boolean;                        // default: false
  stickyFooter: boolean;                        // default: false
  ariaLabel?: string;
  // slots: header, default (body), footer — header/footer auto-collapse when empty
}

// q-navbar — responsive horizontal top bar
interface NavbarItem {
  label: string;
  value?: string;
  href?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  disabled?: boolean;
  active?: boolean;
}

interface QNavbar {
  brand?: string;
  logoSrc?: string;
  logoAlt: string;             // default: ''
  brandHref: string;           // default: '/'
  items: NavbarItem[];
  activeValue: string;         // default: ''
  mobileLabel: string;         // default: 'Menu'
  sticky: boolean;             // default: false
  compact: boolean;            // default: false
  transparent: boolean;        // default: false
  bordered: boolean;           // default: true

  qSelect: EventEmitter<{ value: string; label: string; item: NavbarItem; originalEvent: MouseEvent }>;
  qMenuToggle: EventEmitter<boolean>;
  // slots: brand, nav, actions, mobile-nav, mobile-actions
}

// q-form — thin wrapper around a real <form>, native FormData/values on submit
type QFormFieldValue = string | File | boolean | number | null;
type QFormValues = Record<string, QFormFieldValue | QFormFieldValue[]>;

interface QForm {
  label?: string;
  action?: string;
  method: 'get' | 'post' | 'dialog';                                   // default: 'post'
  autocomplete: 'on' | 'off';                                          // default: 'on'
  enctype: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
  target?: '_self' | '_blank' | '_parent' | '_top';
  noValidate: boolean;                                                 // default: false
  preventDefault: boolean;                                             // default: true

  qSubmit: EventEmitter<{ values: QFormValues; formData: FormData; form: HTMLFormElement; originalEvent: SubmitEvent }>;
  qReset: EventEmitter<{ form: HTMLFormElement; originalEvent: Event }>;

  getValues(): Promise<QFormValues>;
  setValues(values: QFormValues): Promise<void>;
  resetForm(): Promise<void>;
  submitForm(): Promise<void>;
  // slots: header, default (body), actions — all three live inside the internal <form>
  // REQUIRED FIX: composedPath()-based click delegation for slotted type="submit"/"reset" controls
}
```

## Final Recommendation

Keep all four. The brief's framing ("is this worth keeping separate," "does it add enough value") suggested these might be redundant additions, but none of them are — each occupies a distinct, non-overlapping slot in the library, and the existing implementations (not stubs — all four are real, working code) demonstrate that with concrete API differences, not just naming differences.

**Do not remove or merge anything.** The one component that needs a rewrite-level fix, not polish, is `q-form`: its submit path silently fails for the library's own button component, which means today it doesn't actually do the one thing it promises to do for the majority of real usage. Fix that first — a single `composedPath()` click listener, a few lines of code, no API changes. Everything else on this list (`q-syntax-box`'s form gating, `q-button`'s missing `rel`, the shared form-association helper, the redundant prop aliases) is real but non-blocking cleanup that can land incrementally. Ship `q-form`'s fix before calling any of this "done."
