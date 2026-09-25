# WebQuark component status

This dashboard tracks all public custom elements in the current source tree. The inventory is validated against `@Component({ tag: 'q-*' })` declarations; the canonical API is generated beside each implementation.

See the [component documentation standard and index](./components/README.md), [current public contracts](./components/current-contracts.md), [theme variables](./theme_variables.md), and [Unreal/CEF compatibility guide](./unreal_compatibility.md).

## Status matrix

| Component | Category | Status | Authored guide | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `q-button` | Action | Implemented | [Guide](./components/q-button.md) | Native button/anchor rendering, loading and icon layouts. |
| `q-chip` | Action / data display | Implemented | [Guide](./components/q-chip.md) | Link, button, selected, and removable contracts. |
| `q-link` | Action | Implemented | [Guide](./components/q-link.md) | URL, mail, telephone, external, and disabled links. |
| `q-conversation-bubble` | Data display | Implemented | [Guide](./components/q-conversation-bubble.md) | Semantic incoming, outgoing, and system conversation messages. |
| `q-card` | Layout | Implemented | [Guide](./components/q-card.md) | Surface, elevation, glass, lift, and optional interaction. |
| `q-carousel` | Layout | Implemented | [Guide](./components/q-carousel.md) | Scroll snap, arrows, indicators, repeat, and methods. |
| `q-form` | Layout / forms | Implemented | [Guide](./components/q-form.md) | Native form bridge, typed values, reset, and Enter policy. |
| `q-navbar` | Navigation | Implemented | [Guide](./components/q-navbar.md) | Edge layouts, item icons, and mobile menu/inline modes. |
| `q-panel` | Layout | Implemented | [Guide](./components/q-panel.md) | Header/body/footer region with scrolling and sticky regions. |
| `q-scrollable` | Layout | Implemented | [Guide](./components/q-scrollable.md) | Custom vertical or styled native scrollbars. |
| `q-sidepanel` | Navigation / overlay | Implemented with known limitation | [Guide](./components/q-sidepanel.md) | Drawer, panel, and nav variants; `mode` currently has no effect. |
| `q-toolbar` | Layout | Implemented | [Guide](./components/q-toolbar.md) | Consumer-owned edge toolbar regions. |
| `q-input` | Form control | Implemented | [Guide](./components/q-input.md) | Form-associated text, password, color, search, and number field. |
| `q-textarea` | Form control | Implemented | [Guide](./components/q-textarea.md) | Form-associated auto, manual, and fixed resize modes. |
| `q-dropdown` | Form control | Implemented | [Guide](./components/q-dropdown.md) | Searchable listbox with incremental option rendering. |
| `q-quantity-selector` | Form control | Implemented with known limitation | [Guide](./components/q-quantity-selector.md) | Bounded stepper; not yet form-associated. |
| `q-radio-group` | Form control | Implemented | [Guide](./components/q-radio-group.md) | Form-associated single selection with connected segmented options. |
| `q-toggle` | Form control | Implemented | [Guide](./components/q-toggle.md) | Form-associated switch/checkbox presentations. |
| `q-data-table` | Data display | Implemented | [Guide](./components/q-data-table.md) | Search events, selection, sorting, and row actions. |
| `q-map` | Data display | Implemented | [Guide](./components/q-map.md) | Leaflet-backed tile or Google imagery, typed markers, selection, and resize handling. |
| `q-syntax-box` | Data display / input | Implemented with security follow-up | [Guide](./components/q-syntax-box.md) | Highlighting, editing, formatting, copying, and form participation. |
| `q-progress` | Indicator | Implemented | [Guide](./components/q-progress.md) | Linear and circular, determinate and indeterminate progress. |
| `q-step-diagram` | Indicator | Implemented | [Guide](./components/q-step-diagram.md) | Vertical/horizontal step sequence parent. |
| `q-step-diagram-item` | Indicator | Implemented with known limitation | [Guide](./components/q-step-diagram-item.md) | Pending items still emit activation events. |
| `q-avatar` | Media | Implemented | [Guide](./components/q-avatar.md) | Identity image with initials or slotted fallback. |
| `q-icon` | Media | Implemented | [Guide](./components/q-icon.md) | Remote/local SVG and binary icon rendering. |
| `q-reel` | Media | Implemented | [Guide](./components/q-reel.md) | Thumbnail gallery with optional lightbox. |
| `q-thumbnail` | Media | Implemented | [Guide](./components/q-thumbnail.md) | Lazy media poster and activation metadata. |
| `q-dialog` | Overlay | Implemented | [Guide](./components/q-dialog.md) | Modal lifecycle, focus management, actions, and CEF-safe backdrop. |
| `q-toast` | Overlay | Implemented | [Guide](./components/q-toast.md) | Global queued mutation feedback composed from `q-alert`. |
| `q-tooltip` | Overlay | Implemented with known limitation | [Guide](./components/q-tooltip.md) | Parent-attached hover/focus tooltip without collision flipping. |

## Inventory rule

Any change that adds or removes a `q-*` component must update this matrix, `docs/components/README.md`, and the current-contract reference in the same change. The production build must regenerate and commit the source-adjacent API page and framework proxies where this repository tracks them.
