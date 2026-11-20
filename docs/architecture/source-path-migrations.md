# Source-path migrations

Current locations after the 14 October 2026 folder cleanup. Older review reports
retain the commands and results actually recorded at the time; their old paths
and line numbers are historical, not instructions for the current checkout.

| Previous location | Current location |
| --- | --- |
| `scripts/wq-switch/` | [Switcher source](../../src/tooling/wq-switch/) |
| `scripts/webquark-serve.ts` | [Sandbox server](../../src/tooling/sandbox/webquark-serve.ts) |
| `scripts/browser/form-submit-commands.mts` | [Form test commands](../../src/browser/components/inputs/form/test/form-submit-commands.mts) |
| `scripts/changelog.unit.test.ts`, `scripts/changelog-init.unit.test.ts` | [Changelog tests](../../src/tooling/changelog/test/) |
| `scripts/presets.unit.test.ts` | [Theme preset tests](../../src/browser/theme/test/presets.unit.test.ts) |
| `scripts/angular-drift.unit.test.ts` | [Angular drift tests](../../packages/browser/angular/scripts/angular-drift.unit.test.ts) |
| `scripts/icon-imports.unit.test.ts` | [Browser dependency tests](../../packages/browser/components/test/icon-imports.unit.test.ts) |
| `src/utils/syntax.ts`, `src/browser/utils/syntax.ts`, and their unit tests | [Syntax-box internals](../../src/browser/components/data-display/syntax-box/internals/) |
| `src/utils/formatter.ts`, `src/browser/utils/formatter.ts`, and their unit tests | [Syntax Box formatters](../../src/browser/components/data-display/syntax-box/internals/formatters/) |
| `src/browser/components/actions/button/button.utils.unit.test.ts` | [Button utility tests](../../src/browser/components/actions/button/test/button.utils.unit.test.ts) |
| `src/playground/views/tooling/adoption/` | [Standalone changelog example](../../examples/changelog-adoption/) |
| `src/playground/playground.bundled.js` | `.stencil/dist/playground/playground.js` (generated) |

Older references to `src/components/`, `src/theme/`, and other shared browser
utilities predate the browser/tooling split. Their owners now live under
`src/browser/`, except for the syntax-box helpers listed above.

## Package paths that remain valid

Core still exposes `scripts/wq-switch/dist/index.js`,
`scripts/wq-switch/dist/setup.js`, and `scripts/webquark-serve.js` inside its
published package. These are generated forwarding launchers, not old source
locations. Tooling owns the implementation; core owns its playground assets.

Ignored `.tmp/` evidence links in historical reports may no longer be available.
They are not current source links or a claim that the evidence was recreated.
