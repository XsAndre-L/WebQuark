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

## Categories

Choose a component's primary category by the situation in which developers usually use it. Optional interaction and rendering technique do not determine its category. Each public component has one primary category; the playground lists the subset with permanent presets.

| Category | Main use |
| :--- | :--- |
| Actions | Triggering an action or following a destination. |
| Communication | Receiving a message from the application or another participant: inline alerts, conversation messages, and toast notifications. |
| Content | Presenting a piece or browsable collection of content, such as a banner, card, or carousel. |
| Data display | Reading records, values, categories, or compact summaries. Chips can display information with optional selection, removal, or link behavior. |
| Forms & inputs | Entering, collecting, validating, and submitting information. The category key and source directory remain `inputs`. |
| Indicators | Understanding progress or position in a process. |
| Layout | Organizing workspace regions, controls, and related views. |
| Media | Presenting images, icons, identities, and media galleries. |
| Overlays | Showing a temporary dialog or contextual description. |

## Component index

| Component | Category | Authored guide | Generated API |
| :--- | :--- | :--- | :--- |
| `q-accordion` | Data display | [Guide](./q-accordion.md) | [API](../../src/browser/components/data-display/accordion/readme.md) |
| `q-alert` | Communication | [Guide](./q-alert.md) | [API](../../src/browser/components/communication/alert/readme.md) |
| `q-avatar` | Media | [Guide](./q-avatar.md) | [API](../../src/browser/components/media/avatar/readme.md) |
| `q-banner` | Content | [Guide](./q-banner.md) | [API](../../src/browser/components/content/banner/readme.md) |
| `q-button` | Actions | [Guide](./q-button.md) | [API](../../src/browser/components/actions/button/readme.md) |
| `q-card` | Content | [Guide](./q-card.md) | [API](../../src/browser/components/content/card/readme.md) |
| `q-carousel` | Content | [Guide](./q-carousel.md) | [API](../../src/browser/components/content/carousel/readme.md) |
| `q-chip` | Data display | [Guide](./q-chip.md) | [API](../../src/browser/components/data-display/chip/readme.md) |
| `q-conversation-bubble` | Communication | [Guide](./q-conversation-bubble.md) | [API](../../src/browser/components/communication/conversation-bubble/readme.md) |
| `q-data-table` | Data display | [Guide](./q-data-table.md) | [API](../../src/browser/components/data-display/data-table/readme.md) |
| `q-dialog` | Overlays | [Guide](./q-dialog.md) | [API](../../src/browser/components/overlays/dialog/readme.md) |
| `q-dropdown` | Forms & inputs | [Guide](./q-dropdown.md) | [API](../../src/browser/components/inputs/dropdown/readme.md) |
| `q-form` | Forms & inputs | [Guide](./q-form.md) | [API](../../src/browser/components/inputs/form/readme.md) |
| `q-grid` | Layout | [Guide](./q-grid.md) | [API](../../src/browser/components/layout/grid/readme.md) |
| `q-icon` | Media | [Guide](./q-icon.md) | [API](../../src/browser/components/media/icon/readme.md) |
| `q-image-comparison` | Media | [Guide](./q-image-comparison.md) | [API](../../src/browser/components/media/image-comparison/readme.md) |
| `q-inline` | Layout | [Guide](./q-inline.md) | [API](../../src/browser/components/layout/inline/readme.md) |
| `q-input` | Forms & inputs | [Guide](./q-input.md) | [API](../../src/browser/components/inputs/input/readme.md) |
| `q-link` | Actions | [Guide](./q-link.md) | [API](../../src/browser/components/actions/link/readme.md) |
| `q-map` | Data display | [Guide](./q-map.md) | [API](../../src/browser/components/data-display/map/readme.md) |
| `q-media` | Media | [Guide](./q-media.md) | [API](../../src/browser/components/media/media/readme.md) |
| `q-navbar` | Layout | [Guide](./q-navbar.md) | [API](../../src/browser/components/layout/navbar/readme.md) |
| `q-pagination` | Data display | [Guide](./q-pagination.md) | [API](../../src/browser/components/data-display/pagination/readme.md) |
| `q-panel` | Layout | [Guide](./q-panel.md) | [API](../../src/browser/components/layout/panel/readme.md) |
| `q-progress` | Indicators | [Guide](./q-progress.md) | [API](../../src/browser/components/indicators/progress/readme.md) |
| `q-quantity-selector` | Forms & inputs | [Guide](./q-quantity-selector.md) | [API](../../src/browser/components/inputs/quantity-selector/readme.md) |
| `q-radio-group` | Forms & inputs | [Guide](./q-radio-group.md) | [API](../../src/browser/components/inputs/radio-group/readme.md) |
| `q-reel` | Media | [Guide](./q-reel.md) | [API](../../src/browser/components/media/reel/readme.md) |
| `q-scrollable` | Layout | [Guide](./q-scrollable.md) | [API](../../src/browser/components/layout/scrollable/readme.md) |
| `q-section` | Layout | [Guide](./q-section.md) | [API](../../src/browser/components/layout/section/readme.md) |
| `q-sidepanel` | Layout | [Guide](./q-sidepanel.md) | [API](../../src/browser/components/layout/sidepanel/readme.md) |
| `q-stack` | Layout | [Guide](./q-stack.md) | [API](../../src/browser/components/layout/stack/readme.md) |
| `q-step-diagram` | Indicators | [Guide](./q-step-diagram.md) | [API](../../src/browser/components/indicators/step-diagram/readme.md) |
| `q-step-diagram-item` | Indicators | [Guide](./q-step-diagram-item.md) | [API](../../src/browser/components/indicators/step-diagram-item/readme.md) |
| `q-syntax-box` | Data display | [Guide](./q-syntax-box.md) | [API](../../src/browser/components/data-display/syntax-box/readme.md) |
| `q-tabs` | Layout | [Guide](./q-tabs.md) | [API](../../src/browser/components/layout/tabs/readme.md) |
| `q-textarea` | Forms & inputs | [Guide](./q-textarea.md) | [API](../../src/browser/components/inputs/textarea/readme.md) |
| `q-thumbnail` | Media | [Guide](./q-thumbnail.md) | [API](../../src/browser/components/media/thumbnail/readme.md) |
| `q-toast` | Communication | [Guide](./q-toast.md) | [API](../../src/browser/components/communication/toast/readme.md) |
| `q-toggle` | Forms & inputs | [Guide](./q-toggle.md) | [API](../../src/browser/components/inputs/toggle/readme.md) |
| `q-toolbar` | Layout | [Guide](./q-toolbar.md) | [API](../../src/browser/components/layout/toolbar/readme.md) |
| `q-tooltip` | Overlays | [Guide](./q-tooltip.md) | [API](../../src/browser/components/overlays/tooltip/readme.md) |

See [implementation status](../components.md), [compact contracts](./current-contracts.md), and [theme setup](../theme_variables.md).
