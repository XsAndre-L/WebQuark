# Plan 1: Content safety and code preservation

> Path note, 14 October 2026: source files have moved. See the [current-path mapping](../source-path-migrations.md). Recorded commands, line numbers and validation results describe the original checkout and are retained as historical evidence.

Status: proposed implementation plan. No component changes have been implemented by this plan.

## Outcome and scope

An icon source can only produce supported inert icon content. A syntax box displays, edits, copies, and resets exactly the source supplied by the consumer unless the consumer explicitly requests formatting. An empty editable syntax box is a functioning field.

Owns audit findings F01–F02 and the icon URL portion of F30; recommendation IDs **1–4, 45** in the [plan index](README.md). This is the first implementation batch. It can proceed independently of the form redesign.

## Implementation locations

- [SVG sanitizer](../../../src/browser/components/media/icon/internals/sanitize-svg.ts), [definition registry](../../../src/browser/components/media/icon/internals/registry.ts), [URL handling](../../../src/browser/components/media/icon/internals/url.ts), and [icon renderer](../../../src/browser/components/media/icon/icon.tsx).
- [Syntax escaping/highlighting](../../../src/browser/components/data-display/syntax-box/internals/syntax.ts), [formatter](../../../src/browser/components/data-display/syntax-box/internals/formatter.ts), [value synchronization](../../../src/browser/components/data-display/syntax-box/internals/value-sync.ts), and [syntax box](../../../src/browser/components/data-display/syntax-box/syntax-box.tsx).
- Extend existing icon registry, icon, syntax-box, and formatter tests; add focused sanitizer/highlighting helper tests and browser regressions where DOM behavior is essential.

## Contract decisions

1. **SVG:** reject malformed input without a regex fallback. Share the registry's element/resource restrictions with fetched SVG without weakening either route. Normalize through a validated representation before serialization/insertion. Permit only supported namespaces, attributes, local fragment references, and inert presentation features. Enforce depth/node limits and a bounded fetched-content size. Preserve ordinary paths, groups, masks, gradients, and local symbol references that pass the contract. Failure uses the existing fallback/error behavior.
2. **Code:** incoming strings are always literal source. Entity-looking text remains literal text; its presence does not mean the whole input has been escaped. Generated highlight spans are constructed separately from escaped source segments. Keep the consumer's stored source unchanged until an actual edit or explicit Format. Native textarea editing normalizes line endings to LF; document that boundary rather than promising byte equality after a user edit. Browser presentation comparisons may canonicalize line endings while stored-source/copy/reset checks use exact equality for unedited input.
3. **Formatting:** initialization, property updates, editing, blur, and reset never run a lossy formatter. The existing Format action remains explicit. Select a parser-aware formatter only after measuring supported languages, browser/CEF support, loading cost, and the package/export impact. Parsing alone is insufficient: formatting must preserve literal values, comments, and member/array structure. In JSON, a JavaScript-value parse/stringify round-trip can round large numbers, lose negative zero, reorder members, and collapse duplicate members; use a token/concrete-syntax-preserving approach or leave unsupported input unchanged. If a language has no safe formatter, make Format unavailable with documented behavior; do not fall back to regex rewriting. A formatting error preserves the previous source and follows the existing feedback contract.
4. **Empty editor:** editable mode normalizes missing code to an empty string and creates its textarea. Read-only mode retains its documented slot/fallback behavior. Required validation must reject the empty editable value.

## Implementation sequence

1. Capture current positive registry/rendering behavior and the reported failure cases as regression expectations. Use inert rejection fixtures and DOM assertions; executable payloads or live script demonstrations are unnecessary.
2. Extract/reuse a small shared icon policy. Validate parsed XML, root, namespaces, element/attribute shapes, local URL references, and budgets. Remove malformed-input recovery. Guard browser-specific parsing so module import and server rendering do not require a browser DOM.
3. Classify image formats from a parsed URL pathname, preserving the complete URL for loading. Preserve existing name/base-path/extension resolution; append inferred extensions before query/fragment portions. Cover relative URLs, uppercase extensions, and query/hash variants. Define unsupported schemes through the current URL policy rather than guessing from a suffix.
4. Remove the whole-input escaping shortcut and verify highlighted output displays the original literal input for HTML, JavaScript, CSS, and JSON, allowing only native DOM newline normalization in presentation assertions. Fix highlighting replacements that insert/remove source whitespace; generated spans must wrap original source segments without rewriting them. Copy must use the source value, not serialized highlighted markup.
5. Remove automatic formatting from value synchronization; initialize the empty editor independently of read-only fallback projection. Keep source equality across externally controlled updates and reset.
6. Replace or constrain the explicit formatter after the formatter decision is recorded. Verify preserved numeric tokens, member occurrences/order, literal values, and comments as applicable; comparing parsed JavaScript values alone can conceal corruption. Keep formatting changes separate from the sanitizer patch so each is reviewable.
7. Update the icon and syntax-box guides, authored API descriptions, and playground examples. Show literal source, explicit formatting, supported SVG restrictions, and query-bearing image URLs.

## Acceptance checks

| Scenario | Required result |
| --- | --- |
| Valid representative registered/fetched icons | Expected paths, gradients, masks, and local references survive with matching rendering. |
| Malformed or disallowed SVG; invalid namespaces/resources; exceeded budgets | No unsafe DOM is inserted; deterministic fallback/error; no regex recovery. |
| PNG/JPEG/WebP URL with query/hash | Loaded as an image using the original full URL. |
| Source mixing raw markup and entity-looking text | Literal text is preserved; no source-originated elements appear in the rendered code. |
| Whitespace, strings, comments, Unicode, and CRLF source | Unedited initialization, updates, blur, copy, and reset retain exact stored source; actual textarea edits use the documented LF convention without formatter rewrites. |
| Rendered HTML, JavaScript, CSS, and JSON highlighting | `textContent` equals supplied source after only documented browser newline normalization, independently of stored-value checks. Include attribute spacing, JSON string values, CSS colon spacing, comments, Unicode, and entity-looking text. |
| Explicit supported-language Format | Literal values, comments, and member/array structure survive; invalid/unsupported input remains intact; no accidental formatting during other operations. |
| Explicit JSON Format with large numbers, negative zero, duplicate members, and ordered arrays/members | Numeric tokens and member occurrences/order are retained by a safe formatter, or the input is left unchanged. Token-aware checks supplement parsed-value comparisons. |
| Editable, required, initially unset code | Empty textarea exists, accepts input, and reports invalid until a valid value is supplied. |
| Read-only slotted syntax and SSR/import | Existing projection and non-browser import continue to work. |

Run relevant unit/component tests and built-component browser checks. Then run the shared verification gate in the index. Record any formatter dependency and measured bundle change.

## Dependencies, boundaries, and completion

Plan 2 owns effective disabling and form synchronization in syntax-box; it must retain this plan's exact-source/empty-editor behavior. Plan 3 owns its Angular accessor. Plan 4 owns action names and focus styling. Those patches should follow this syntax-box work or rebase onto it.

Do not rename component categories, existing orientation properties, or event names as incidental cleanup. Do not promise support for arbitrary SVG documents or every programming language.

Complete when each acceptance row has evidence, the source-preservation behavior is documented, formatter support is explicit, and the sanitizer has no permissive fallback. Passing existing tests alone is insufficient.
