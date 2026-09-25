# WebQuark component documentation

Authored guides explain use, behavior, accessibility, and customization. Source-adjacent generated API pages provide a generated reference. When they disagree, inspect the implementation, imported types/helpers, styles, and runtime before correcting prose; generated output alone does not prove effective behavior.

## Documentation standard

Every authored guide starts with its name, purpose, exact tag, existing-playground instructions, and an On this page list. Use exactly these five H2 sections:

1. Quick start
2. Examples
3. Behavior & accessibility
4. Styling
5. API reference

Quick start separates bundled application registration from HTML, states the result, explains bare-tag behavior, and includes an **At a glance** table with **Capability / Options / Default** columns.

Examples progress from common to advanced tasks. Each uses a task-based H3, one-sentence explanation, actual component screenshot with alt text, complete code, and essential notes. Explain actions needed to reach a captured state and when a still image represents motion.

Behavior uses applicable subsections in this order: **State and interaction**, **Keyboard and focus**, **Labels and announcements**, **Forms**, **Limitations and compatibility**. State ownership, labels, event effects, fallback inputs, and limitations must follow current implementation. Do not equate DOM/ARIA checks with screen-reader testing.

Styling uses applicable sibling headings **Variants**, **Sizes**, **Tones**, then other genuine visual categories and **Custom styling**. Explain [inherited geometry, surfaces, and composition](../foundation.md) where supported. Link shared [theme tokens](../theme-tokens.md); do not duplicate stale theme defaults. Local component hooks, inline styles, and conditional parts must be checked for effective precedence.

API reference always has these H3 sections in order: **Properties**, **Slots**, **Events**, **Methods**, **Styling hooks**. Retain unsupported headings with a direct “none” sentence.

| Reference | Columns |
| :--- | :--- |
| Properties | Name / Default / Description |
| Slots | Name / Description |
| Events | Name / When it fires / Payload |
| Methods | Signature / Purpose / Returns |
| CSS variables | Name / Default / Controls |
| Shadow Parts | Name / Targets |

Put property type, HTML attribute, accepted values and requiredness with each entry. Required properties come first, then optional; alphabetize within each group. Default slot precedes named slots; alphabetize other API entries. Use H4 for public data shapes, and **CSS variables** / **Shadow Parts** beneath Styling hooks. Include inherited public properties and functional aliases; exclude private `--_q-*` variables.

Keep explanations short, preserve meaningful constraints, and link related sections. Each guide must be checked against source, runnable examples, readable screenshots, local links, and independent review. A completed guide does not establish production readiness or platform certification.

## Component index

| Component | Category | Authored guide | Generated API |
| :--- | :--- | :--- | :--- |
| `q-accordion` | data-display | [Guide](./q-accordion.md) | [API](../../src/components/data-display/accordion/readme.md) |
| `q-alert` | data-display | [Guide](./q-alert.md) | [API](../../src/components/data-display/alert/readme.md) |
| `q-avatar` | media | [Guide](./q-avatar.md) | [API](../../src/components/media/avatar/readme.md) |
| `q-banner` | content | [Guide](./q-banner.md) | [API](../../src/components/content/banner/readme.md) |
| `q-button` | actions | [Guide](./q-button.md) | [API](../../src/components/actions/button/readme.md) |
| `q-card` | layout | [Guide](./q-card.md) | [API](../../src/components/layout/card/readme.md) |
| `q-carousel` | layout | [Guide](./q-carousel.md) | [API](../../src/components/layout/carousel/readme.md) |
| `q-chip` | actions | [Guide](./q-chip.md) | [API](../../src/components/actions/chip/readme.md) |
| `q-conversation-bubble` | data-display | [Guide](./q-conversation-bubble.md) | [API](../../src/components/data-display/conversation-bubble/readme.md) |
| `q-data-table` | data-display | [Guide](./q-data-table.md) | [API](../../src/components/data-display/data-table/readme.md) |
| `q-dialog` | overlays | [Guide](./q-dialog.md) | [API](../../src/components/overlays/dialog/readme.md) |
| `q-dropdown` | inputs | [Guide](./q-dropdown.md) | [API](../../src/components/inputs/dropdown/readme.md) |
| `q-form` | layout | [Guide](./q-form.md) | [API](../../src/components/layout/form/readme.md) |
| `q-grid` | layout | [Guide](./q-grid.md) | [API](../../src/components/layout/grid/readme.md) |
| `q-icon` | media | [Guide](./q-icon.md) | [API](../../src/components/media/icon/readme.md) |
| `q-inline` | layout | [Guide](./q-inline.md) | [API](../../src/components/layout/inline/readme.md) |
| `q-input` | inputs | [Guide](./q-input.md) | [API](../../src/components/inputs/input/readme.md) |
| `q-link` | actions | [Guide](./q-link.md) | [API](../../src/components/actions/link/readme.md) |
| `q-map` | data-display | [Guide](./q-map.md) | [API](../../src/components/data-display/map/readme.md) |
| `q-media` | media | [Guide](./q-media.md) | [API](../../src/components/media/media/readme.md) |
| `q-navbar` | layout | [Guide](./q-navbar.md) | [API](../../src/components/layout/navbar/readme.md) |
| `q-pagination` | data-display | [Guide](./q-pagination.md) | [API](../../src/components/data-display/pagination/readme.md) |
| `q-panel` | layout | [Guide](./q-panel.md) | [API](../../src/components/layout/panel/readme.md) |
| `q-progress` | indicators | [Guide](./q-progress.md) | [API](../../src/components/indicators/progress/readme.md) |
| `q-quantity-selector` | inputs | [Guide](./q-quantity-selector.md) | [API](../../src/components/inputs/quantity-selector/readme.md) |
| `q-radio-group` | inputs | [Guide](./q-radio-group.md) | [API](../../src/components/inputs/radio-group/readme.md) |
| `q-reel` | media | [Guide](./q-reel.md) | [API](../../src/components/media/reel/readme.md) |
| `q-scrollable` | layout | [Guide](./q-scrollable.md) | [API](../../src/components/layout/scrollable/readme.md) |
| `q-section` | layout | [Guide](./q-section.md) | [API](../../src/components/layout/section/readme.md) |
| `q-sidepanel` | layout | [Guide](./q-sidepanel.md) | [API](../../src/components/layout/sidepanel/readme.md) |
| `q-stack` | layout | [Guide](./q-stack.md) | [API](../../src/components/layout/stack/readme.md) |
| `q-step-diagram` | indicators | [Guide](./q-step-diagram.md) | [API](../../src/components/indicators/step-diagram/readme.md) |
| `q-step-diagram-item` | indicators | [Guide](./q-step-diagram-item.md) | [API](../../src/components/indicators/step-diagram-item/readme.md) |
| `q-syntax-box` | data-display | [Guide](./q-syntax-box.md) | [API](../../src/components/data-display/syntax-box/readme.md) |
| `q-tabs` | layout | [Guide](./q-tabs.md) | [API](../../src/components/layout/tabs/readme.md) |
| `q-textarea` | inputs | [Guide](./q-textarea.md) | [API](../../src/components/inputs/textarea/readme.md) |
| `q-thumbnail` | media | [Guide](./q-thumbnail.md) | [API](../../src/components/media/thumbnail/readme.md) |
| `q-toast` | overlays | [Guide](./q-toast.md) | [API](../../src/components/overlays/toast/readme.md) |
| `q-toggle` | inputs | [Guide](./q-toggle.md) | [API](../../src/components/inputs/toggle/readme.md) |
| `q-toolbar` | layout | [Guide](./q-toolbar.md) | [API](../../src/components/layout/toolbar/readme.md) |
| `q-tooltip` | overlays | [Guide](./q-tooltip.md) | [API](../../src/components/overlays/tooltip/readme.md) |

See [implementation status](../components.md), [compact contracts](./current-contracts.md), and [theme setup](../theme_variables.md).
