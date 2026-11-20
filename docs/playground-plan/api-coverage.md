# Component API coverage

[Implementation sequence](README.md)

## Missing property controls

The 45 component classes declare 437 public Stencil properties. The 36 sandbox specs declare a property control for 267 of them. The remaining 170 include 18 deprecated aliases and 2 properties that already appear in a variant, edge case, or fixed options fixture. A declared control can still have the wrong type, option set, default, or behavior. The two component chapters cover those corrections.

Use the third column as the implementation checklist. For property-only data, callbacks and conditional features, provide a typed fixture, selector, or action appropriate to that API. For deprecated aliases, document replacement and precedence in a compatibility example. The last column is a subset of the missing controls. Counts use source decorators cross-checked with the generated component declarations. Native HTML attributes and projected child attributes are outside these counts.

| Component source | Controls / props | Missing controls or fixtures | Missing deprecated aliases | Already in example or options data only |
|---|---:|---|---|---|
| [q-accordion](../../src/browser/components/data-display/accordion/accordion.tsx) | New · 0/1 | `mode` | — | — |
| [q-alert](../../src/browser/components/communication/alert/alert.tsx) | New · 0/5 | `announcement`, `dismissible`, `dismissLabel`, `heading`, `variant` | — | — |
| [q-avatar](../../src/browser/components/media/avatar/avatar.tsx) | 6/7 | `loading` | — | — |
| [q-banner](../../src/browser/components/content/banner/banner.tsx) | New · 0/2 | `alignment`, `height` | — | — |
| [q-button](../../src/browser/components/actions/button/button.tsx) | 9/23 | `download`, `form`, `formAction`, `formEnctype`, `formMethod`, `formNoValidate`, `formTarget`, `iconOnly`, `layout`, `name`, `rel`, `shape`, `type`, `value` | — | — |
| [q-card](../../src/browser/components/content/card/card.tsx) | 7/9 | `footerPadding`, `headerPadding` | — | — |
| [q-carousel](../../src/browser/components/content/carousel/carousel.tsx) | 7/16 | `ariaLabel`, `autoplay`, `autoplayAdvanceSuspended`, `autoplayBehavior`, `autoplayInterval`, `autoplaySuspended`, `layout`, `rotationPlacement`, `slideTiming` | — | — |
| [q-chip](../../src/browser/components/data-display/chip/chip.tsx) | 8/12 | `download`, `label`, `rel`, `value` | — | — |
| [q-control-group](../../src/browser/components/layout/control-group/control-group.tsx) | 3/3 | — | — | — |
| [q-conversation-bubble](../../src/browser/components/communication/conversation-bubble/conversation-bubble.tsx) | 5/5 | — | — | — |
| [q-data-table](../../src/browser/components/data-display/data-table/data-table.tsx) | 17/22 | `ariaLabel`, `loading`, `rowGroup`, `selectedKeys`, `twoLineRows` | — | — |
| [q-dialog](../../src/browser/components/overlays/dialog/dialog.tsx) | 11/18 | `ariaLabel`, `backdrop`, `closeLabel` | `backdropEffect`, `closeOnEsc`, `closeOnOverlayClick`, `dialogTitle` | — |
| [q-divider](../../src/browser/components/layout/divider/divider.tsx) | 4/4 | — | — | — |
| [q-dropdown](../../src/browser/components/inputs/dropdown/dropdown.tsx) | 11/23 | `collisionPadding`, `description`, `error`, `externalSearch`, `hasMore`, `loading`, `multiple`, `name`, `options`, `placement`, `required`, `values` | — | `options` |
| [q-form](../../src/browser/components/inputs/form/form.tsx) | 7/13 | `action`, `ariaLabel`, `enctype`, `enterBehavior`, `method`, `target` | — | — |
| [q-grid](../../src/browser/components/layout/grid/grid.tsx) | 3/5 | `columnGap`, `rowGap` | — | — |
| [q-icon](../../src/browser/components/media/icon/icon.tsx) | 5/11 | `definition`, `fetchTimeout`, `label`, `libraryVersion` | `lib`, `libVersion` | — |
| [q-image-comparison](../../src/browser/components/media/image-comparison/image-comparison.tsx) | 9/11 | `afterCrop`, `beforeCrop` | — | — |
| [q-inline](../../src/browser/components/layout/inline/inline.tsx) | 3/4 | `align` | — | — |
| [q-input](../../src/browser/components/inputs/input/input.tsx) | 12/19 | `ariaLabel`, `description`, `max`, `min`, `name`, `step` | `errorMessage` | — |
| [q-link](../../src/browser/components/actions/link/link.tsx) | 8/12 | `download`, `label`, `rel` | `url` | — |
| [q-map](../../src/browser/components/data-display/map/map.tsx) | 21/26 | `scrollWheelZoom`, `tilePreloadBuffer`, `vectorPadding`, `vectorStyleUrl`, `zoomControls` | — | — |
| [q-media](../../src/browser/components/media/media/media.tsx) | New · 0/4 | `alt`, `kind`, `loading`, `src` | — | — |
| [q-navbar](../../src/browser/components/layout/navbar/navbar.tsx) | 13/17 | `logoAlt`, `logoSrc`, `mobileLabel` | `activeValue` | — |
| [q-pagination](../../src/browser/components/data-display/pagination/pagination.tsx) | New · 0/7 | `ariaLabel`, `disabled`, `itemLabel`, `page`, `pageSize`, `showSummary`, `totalItems` | — | — |
| [q-panel](../../src/browser/components/layout/panel/panel.tsx) | 9/13 | `ariaLabel`, `footerPadding`, `headerPadding` | `noBorders` | — |
| [q-progress](../../src/browser/components/indicators/progress/progress.tsx) | 6/8 | `ariaLabel`, `ariaValueText` | — | — |
| [q-quantity-selector](../../src/browser/components/inputs/quantity-selector/quantity-selector.tsx) | 6/7 | — | `variant` | — |
| [q-radio-group](../../src/browser/components/inputs/radio-group/radio-group.tsx) | 8/14 | `ariaLabel`, `description`, `error`, `name`, `options` | `errorMessage` | `options` |
| [q-reel](../../src/browser/components/media/reel/reel.tsx) | 2/2 | — | — | — |
| [q-scrollable](../../src/browser/components/layout/scrollable/scrollable.tsx) | 6/6 | — | — | — |
| [q-section](../../src/browser/components/layout/section/section.tsx) | New · 0/3 | `columns`, `layout`, `reverse` | — | — |
| [q-sidepanel](../../src/browser/components/layout/sidepanel/sidepanel.tsx) | 8/20 | `collapseControl`, `collapseControlPosition`, `collapseControlStyle`, `collapsed`, `collapseLabel`, `collapseMode`, `collapsible`, `items`, `value` | `collapseControlAppearance`, `expanded`, `panelSize` | — |
| [q-slider](../../src/browser/components/inputs/slider/slider.tsx) | 7/10 | `ariaLabel`, `name`, `showValue` | — | — |
| [q-stack](../../src/browser/components/layout/stack/stack.tsx) | 2/2 | — | — | — |
| [q-step-diagram](../../src/browser/components/indicators/step-diagram/step-diagram.tsx) | 1/3 | `ariaLabel` | `layout` | — |
| [q-step-diagram-item](../../src/browser/components/indicators/step-diagram-item/step-diagram-item.tsx) | New · 0/4 | `lineStyle`, `orientation`, `status` | `layout` | — |
| [q-syntax-box](../../src/browser/components/data-display/syntax-box/syntax-box.tsx) | 9/12 | `ariaLabel`, `name`, `value` | — | — |
| [q-tabs](../../src/browser/components/layout/tabs/tabs.tsx) | New · 0/7 | `ariaLabel`, `items`, `orientation`, `size`, `stretch`, `value`, `variant` | — | — |
| [q-textarea](../../src/browser/components/inputs/textarea/textarea.tsx) | 13/17 | `ariaLabel`, `description`, `name` | `errorMessage` | — |
| [q-thumbnail](../../src/browser/components/media/thumbnail/thumbnail.tsx) | New · 0/5 | `alt`, `highlighted`, `label`, `src`, `video` | — | — |
| [q-toast](../../src/browser/components/communication/toast/toast.tsx) | 2/2 | — | — | — |
| [q-toggle](../../src/browser/components/inputs/toggle/toggle.tsx) | 9/11 | `description`, `name` | — | — |
| [q-toolbar](../../src/browser/components/layout/toolbar/toolbar.tsx) | 7/9 | `gap`, `wrap` | — | — |
| [q-tooltip](../../src/browser/components/overlays/tooltip/tooltip.tsx) | 3/3 | — | — | — |

## Events and public methods

Use the following names when binding the instance event log and writing method examples. This is the complete source inventory of 78 event declarations and 48 method declarations, counted per component. Use the component source links for detail types, arguments and return values. For form methods, a shared form fixture can demonstrate several controls. For methods with side effects, invoke them on the selected instance through an explicit action.

| Component source | Events | Methods |
|---|---|---|
| [q-accordion](../../src/browser/components/data-display/accordion/accordion.tsx) | — | — |
| [q-alert](../../src/browser/components/communication/alert/alert.tsx) | `qDismiss` | — |
| [q-avatar](../../src/browser/components/media/avatar/avatar.tsx) | `qError`, `qLoad` | — |
| [q-banner](../../src/browser/components/content/banner/banner.tsx) | — | — |
| [q-button](../../src/browser/components/actions/button/button.tsx) | `qBlur`, `qClick`, `qFocus` | — |
| [q-card](../../src/browser/components/content/card/card.tsx) | — | — |
| [q-carousel](../../src/browser/components/content/carousel/carousel.tsx) | `qAutoplayChange`, `qPlaybackChange`, `qSlideChange` | `completeSlide`, `pause`, `play`, `setSlidePlayback`, `slideTo`, `updateLimits` |
| [q-chip](../../src/browser/components/data-display/chip/chip.tsx) | `qBlur`, `qClick`, `qFocus`, `qRemove` | — |
| [q-control-group](../../src/browser/components/layout/control-group/control-group.tsx) | — | — |
| [q-conversation-bubble](../../src/browser/components/communication/conversation-bubble/conversation-bubble.tsx) | — | — |
| [q-data-table](../../src/browser/components/data-display/data-table/data-table.tsx) | `qRowAction`, `qRowClick`, `qSearch`, `qSelectionChange`, `qSortChange` | — |
| [q-dialog](../../src/browser/components/overlays/dialog/dialog.tsx) | `qCancel`, `qClose`, `qConfirm` | `cancel`, `close`, `confirm`, `show` |
| [q-divider](../../src/browser/components/layout/divider/divider.tsx) | — | — |
| [q-dropdown](../../src/browser/components/inputs/dropdown/dropdown.tsx) | `qBlur`, `qChange`, `qClick`, `qFocus`, `qLoadMore`, `qSearch`, `qSelect`, `qValuesChange` | `checkValidity`, `focusElement`, `reportValidity` |
| [q-form](../../src/browser/components/inputs/form/form.tsx) | `qReset`, `qSubmit` | `checkValidity`, `getValues`, `reportValidity`, `resetForm`, `setValues`, `submitForm` |
| [q-grid](../../src/browser/components/layout/grid/grid.tsx) | — | — |
| [q-icon](../../src/browser/components/media/icon/icon.tsx) | — | — |
| [q-image-comparison](../../src/browser/components/media/image-comparison/image-comparison.tsx) | `qChange` | — |
| [q-inline](../../src/browser/components/layout/inline/inline.tsx) | — | — |
| [q-input](../../src/browser/components/inputs/input/input.tsx) | `qBlur`, `qChange`, `qClick`, `qFocus`, `qInput` | `checkValidity`, `clearValue`, `focusElement`, `reportValidity` |
| [q-link](../../src/browser/components/actions/link/link.tsx) | `qBlur`, `qClick`, `qFocus` | — |
| [q-map](../../src/browser/components/data-display/map/map.tsx) | `qClusterSelect`, `qError`, `qMapClick`, `qMarkerSelect`, `qReady`, `qStatusChange` | `ensureMarkerVisible`, `fitMarkers` |
| [q-media](../../src/browser/components/media/media/media.tsx) | — | — |
| [q-navbar](../../src/browser/components/layout/navbar/navbar.tsx) | `qMenuToggle`, `qSelect` | — |
| [q-pagination](../../src/browser/components/data-display/pagination/pagination.tsx) | `qPageChange` | — |
| [q-panel](../../src/browser/components/layout/panel/panel.tsx) | — | — |
| [q-progress](../../src/browser/components/indicators/progress/progress.tsx) | — | — |
| [q-quantity-selector](../../src/browser/components/inputs/quantity-selector/quantity-selector.tsx) | `qBlur`, `qChange`, `qClick`, `qFocus` | — |
| [q-radio-group](../../src/browser/components/inputs/radio-group/radio-group.tsx) | `qBlur`, `qChange`, `qFocus` | `checkValidity`, `focusElement`, `reportValidity` |
| [q-reel](../../src/browser/components/media/reel/reel.tsx) | `qLightboxClose`, `qLightboxOpen` | — |
| [q-scrollable](../../src/browser/components/layout/scrollable/scrollable.tsx) | `qScroll` | `scrollToBottom`, `scrollToPosition` |
| [q-section](../../src/browser/components/layout/section/section.tsx) | — | — |
| [q-sidepanel](../../src/browser/components/layout/sidepanel/sidepanel.tsx) | `qClose`, `qCollapsedChange`, `qSelect` | — |
| [q-slider](../../src/browser/components/inputs/slider/slider.tsx) | `qChange`, `qInput` | `focusElement` |
| [q-stack](../../src/browser/components/layout/stack/stack.tsx) | — | — |
| [q-step-diagram](../../src/browser/components/indicators/step-diagram/step-diagram.tsx) | — | — |
| [q-step-diagram-item](../../src/browser/components/indicators/step-diagram-item/step-diagram-item.tsx) | `qItemClick` | — |
| [q-syntax-box](../../src/browser/components/data-display/syntax-box/syntax-box.tsx) | `qChange`, `qInput` | `checkValidity`, `reportValidity`, `scrollToBottom` |
| [q-tabs](../../src/browser/components/layout/tabs/tabs.tsx) | `qChange` | — |
| [q-textarea](../../src/browser/components/inputs/textarea/textarea.tsx) | `qBlur`, `qChange`, `qClick`, `qFocus`, `qInput` | `adjustHeight`, `checkValidity`, `focusElement`, `reportValidity` |
| [q-thumbnail](../../src/browser/components/media/thumbnail/thumbnail.tsx) | `qMaximize` | — |
| [q-toast](../../src/browser/components/communication/toast/toast.tsx) | — | `clear`, `danger`, `dismiss`, `error`, `info`, `success`, `warning` |
| [q-toggle](../../src/browser/components/inputs/toggle/toggle.tsx) | `qBlur`, `qChange`, `qClick`, `qFocus` | `checkValidity`, `reportValidity`, `toggle` |
| [q-toolbar](../../src/browser/components/layout/toolbar/toolbar.tsx) | — | — |
| [q-tooltip](../../src/browser/components/overlays/tooltip/tooltip.tsx) | — | — |
