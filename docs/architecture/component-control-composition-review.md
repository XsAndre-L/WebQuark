# WebQuark component control review

The source review covered the rendered controls of all 45 library components, including helpers that create controls dynamically. Six components contain actions with direct WebQuark equivalents. Seven more contain controls whose keyboard behavior, accessibility state, or events need special handling. The remaining 32 either implement their own control surface, already compose WebQuark components, or render content. These findings are for review before changing the published library.

## Direct replacement candidates

| Component | Candidate | Behavior to verify before adopting it |
|---|---|---|
| [Alert](../../src/browser/components/communication/alert/alert.tsx) | Use a small icon-only `q-button` for dismissal. | Preserve the accessible dismiss label, focus indicator, `dismiss-button` CSS part, and single dismiss event. |
| [Pagination](../../src/browser/components/data-display/pagination/pagination.tsx) | Use `q-button` for Previous and Next. | Preserve boundary disabling and one page-change request per activation. |
| [Dialog](../../src/browser/components/overlays/dialog/dialog.tsx) | Use `q-button` for Close, Cancel, and Confirm. | Verify initial focus, tab trapping, focus restoration, loading state, and the public styling parts. |
| [Reel](../../src/browser/components/media/reel/reel.tsx) | Use icon-only `q-button` controls in the lightbox. | Verify focus when opening and closing, arrow-key navigation, and previous/next behavior at the ends. |
| [Quantity Selector](../../src/browser/components/inputs/quantity-selector/quantity-selector.tsx) | Use `q-button` for increment and decrement. | Preserve boundary disabling, spinbutton behavior, and the number of click and value events observed by the consumer. |
| [Map](../../src/browser/components/data-display/map/map.tsx) | Use `q-link` for the attribution URL. | Preserve URL validation, link destination, and external-link announcement. Leaflet owns the live map and marker controls. |

## Controls that need more than a tag change

| Component | Controls | Constraint |
|---|---|---|
| [Carousel](../../src/browser/components/content/carousel/carousel.tsx) | Rotation, arrows, and indicators | Indicators use roving focus and expose the current slide. An unavailable arrow can still receive keyboard focus. |
| [Chip](../../src/browser/components/data-display/chip/chip.tsx) | Remove action and interactive chip surface | Preserve pressed/current state and prevent a nested action from producing duplicate activation or focus events. |
| [Data Table](../../src/browser/components/data-display/data-table/internals/render-table-head.tsx) | Sort actions and selection checkboxes | The select-all checkbox exposes an indeterminate state. `q-toggle` needs equivalent support for that use. Verify row click isolation. |
| [Dropdown](../../src/browser/components/inputs/dropdown/dropdown.tsx) | Done and pagination actions, trigger, search, and options | Done and pagination are ordinary actions. The other elements implement the combobox and listbox keyboard and active-option behavior. |
| [Input](../../src/browser/components/inputs/input/input.tsx) | Clear, increment/decrement, and password visibility | Preserve editor focus, event ordering, and the visibility toggle's pressed state. The native input supplies text entry and form semantics. |
| [Navbar](../../src/browser/components/layout/navbar/navbar.tsx) | Brand link, navigation items, and mobile menu button | Preserve current-page state, same-tab and new-tab navigation, and the menu button's expanded state and relationship to its popup. |
| [Sidepanel](../../src/browser/components/layout/sidepanel/sidepanel.tsx) | Collapse control, navigation items, and group disclosures | Preserve the focusable control's expanded/current state, keyboard navigation, and exposed parts. |

## Remaining components

| Finding | Components |
|---|---|
| Own the interactive surface or browser primitive (14) | Button, Card, Form, Image Comparison, Link, Radio Group, Scrollable, Slider, Step Diagram Item, Syntax Box, Tabs, Textarea, Thumbnail, Toggle |
| Already composed or have no applicable control to replace (18) | Accordion, Avatar, Banner, Control Group, Conversation Bubble, Divider, Grid, Icon, Inline, Media, Panel, Progress, Section, Stack, Step Diagram, Toast, Toolbar, Tooltip |

For example, `q-button` supplies a real browser button or anchor, `q-syntax-box` uses a textarea for editing and WebQuark controls for its toolbar, and `q-tabs` owns the elements that implement its tablist. Form submitter proxies and consumer-provided slotted content have separate owners.
