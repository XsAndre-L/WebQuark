/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@webquark/core/components';

import { defineCustomElement as defineQButton } from '@webquark/core/components/q-button.js';
import { defineCustomElement as defineQCard } from '@webquark/core/components/q-card.js';
import { defineCustomElement as defineQCarousel } from '@webquark/core/components/q-carousel.js';
import { defineCustomElement as defineQChip } from '@webquark/core/components/q-chip.js';
import { defineCustomElement as defineQCircularProgress } from '@webquark/core/components/q-circular-progress.js';
import { defineCustomElement as defineQDataTable } from '@webquark/core/components/q-data-table.js';
import { defineCustomElement as defineQDialog } from '@webquark/core/components/q-dialog.js';
import { defineCustomElement as defineQDropdown } from '@webquark/core/components/q-dropdown.js';
import { defineCustomElement as defineQForm } from '@webquark/core/components/q-form.js';
import { defineCustomElement as defineQIcon } from '@webquark/core/components/q-icon.js';
import { defineCustomElement as defineQInput } from '@webquark/core/components/q-input.js';
import { defineCustomElement as defineQLink } from '@webquark/core/components/q-link.js';
import { defineCustomElement as defineQNavbar } from '@webquark/core/components/q-navbar.js';
import { defineCustomElement as defineQPanel } from '@webquark/core/components/q-panel.js';
import { defineCustomElement as defineQQuantitySelector } from '@webquark/core/components/q-quantity-selector.js';
import { defineCustomElement as defineQReel } from '@webquark/core/components/q-reel.js';
import { defineCustomElement as defineQScrollable } from '@webquark/core/components/q-scrollable.js';
import { defineCustomElement as defineQSidepanel } from '@webquark/core/components/q-sidepanel.js';
import { defineCustomElement as defineQStepDiagram } from '@webquark/core/components/q-step-diagram.js';
import { defineCustomElement as defineQStepDiagramItem } from '@webquark/core/components/q-step-diagram-item.js';
import { defineCustomElement as defineQSyntaxBox } from '@webquark/core/components/q-syntax-box.js';
import { defineCustomElement as defineQTextarea } from '@webquark/core/components/q-textarea.js';
import { defineCustomElement as defineQThumbnail } from '@webquark/core/components/q-thumbnail.js';
import { defineCustomElement as defineQToggle } from '@webquark/core/components/q-toggle.js';
import { defineCustomElement as defineQTooltip } from '@webquark/core/components/q-tooltip.js';
@ProxyCmp({
  defineCustomElementFn: defineQButton,
  inputs: ['ariaLabel', 'disabled', 'download', 'expand', 'href', 'iconOnly', 'loading', 'rel', 'size', 'target', 'type', 'variant']
})
@Component({
  selector: 'q-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'disabled', 'download', 'expand', 'href', 'iconOnly', 'loading', 'rel', 'size', 'target', 'type', 'variant'],
  outputs: ['qClick', 'qFocus', 'qBlur'],
})
export class QButton {
  protected el: HTMLQButtonElement;
  @Output() qClick = new EventEmitter<QButtonCustomEvent<MouseEvent>>();
  @Output() qFocus = new EventEmitter<QButtonCustomEvent<FocusEvent>>();
  @Output() qBlur = new EventEmitter<QButtonCustomEvent<FocusEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QButtonCustomEvent } from '@webquark/core/components';

export declare interface QButton extends Components.QButton {
  /**
   * Emitted on click, unless disabled or loading.
   */
  qClick: EventEmitter<QButtonCustomEvent<MouseEvent>>;
  /**
   * Emitted when the inner control receives focus.
   */
  qFocus: EventEmitter<QButtonCustomEvent<FocusEvent>>;
  /**
   * Emitted when the inner control loses focus.
   */
  qBlur: EventEmitter<QButtonCustomEvent<FocusEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQCard,
  inputs: ['elevation', 'glass', 'interactive', 'lift']
})
@Component({
  selector: 'q-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['elevation', 'glass', 'interactive', 'lift'],
})
export class QCard {
  protected el: HTMLQCardElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface QCard extends Components.QCard {}


@ProxyCmp({
  defineCustomElementFn: defineQCarousel,
  inputs: ['itemWidth', 'repeat', 'showArrows', 'showIndicators', 'snapAlignment'],
  methods: ['slideTo', 'updateLimits']
})
@Component({
  selector: 'q-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['itemWidth', 'repeat', 'showArrows', 'showIndicators', 'snapAlignment'],
  outputs: ['qSlideChange'],
})
export class QCarousel {
  protected el: HTMLQCarouselElement;
  @Output() qSlideChange = new EventEmitter<QCarouselCustomEvent<IQCarouselQCarouselSlideChangeDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QCarouselCustomEvent } from '@webquark/core/components';
import type { QCarouselSlideChangeDetail as IQCarouselQCarouselSlideChangeDetail } from '@webquark/core/components';

export declare interface QCarousel extends Components.QCarousel {
  /**
   * Fires when the active slide index changes.
   */
  qSlideChange: EventEmitter<QCarouselCustomEvent<IQCarouselQCarouselSlideChangeDetail>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQChip,
  inputs: ['clickable', 'disabled', 'download', 'href', 'label', 'rel', 'removable', 'selected', 'size', 'target', 'value', 'variant']
})
@Component({
  selector: 'q-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['clickable', 'disabled', 'download', 'href', 'label', 'rel', 'removable', 'selected', 'size', 'target', 'value', 'variant'],
  outputs: ['qClick', 'qRemove', 'qFocus', 'qBlur'],
})
export class QChip {
  protected el: HTMLQChipElement;
  @Output() qClick = new EventEmitter<QChipCustomEvent<MouseEvent>>();
  @Output() qRemove = new EventEmitter<QChipCustomEvent<IQChipQChipRemoveDetail>>();
  @Output() qFocus = new EventEmitter<QChipCustomEvent<FocusEvent>>();
  @Output() qBlur = new EventEmitter<QChipCustomEvent<FocusEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QChipCustomEvent } from '@webquark/core/components';
import type { QChipRemoveDetail as IQChipQChipRemoveDetail } from '@webquark/core/components';

export declare interface QChip extends Components.QChip {
  /**
   * Emitted when an interactive chip is clicked.
   */
  qClick: EventEmitter<QChipCustomEvent<MouseEvent>>;
  /**
   * Emitted when the remove button is clicked.
   */
  qRemove: EventEmitter<QChipCustomEvent<IQChipQChipRemoveDetail>>;
  /**
   * Emitted when the interactive chip or remove button receives focus.
   */
  qFocus: EventEmitter<QChipCustomEvent<FocusEvent>>;
  /**
   * Emitted when the interactive chip or remove button loses focus.
   */
  qBlur: EventEmitter<QChipCustomEvent<FocusEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQCircularProgress,
  inputs: ['ariaLabel', 'indeterminate', 'label', 'size', 'value']
})
@Component({
  selector: 'q-circular-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'indeterminate', 'label', 'size', 'value'],
})
export class QCircularProgress {
  protected el: HTMLQCircularProgressElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface QCircularProgress extends Components.QCircularProgress {}


@ProxyCmp({
  defineCustomElementFn: defineQDataTable,
  inputs: ['columns', 'items', 'keyField', 'loading', 'searchPlaceholder', 'searchValue', 'selectable', 'selectedKeys', 'showSearch', 'showToolbar', 'toolbarTitle']
})
@Component({
  selector: 'q-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['columns', 'items', 'keyField', 'loading', 'searchPlaceholder', 'searchValue', 'selectable', 'selectedKeys', 'showSearch', 'showToolbar', 'toolbarTitle'],
  outputs: ['qRowClick', 'qSelectionChange', 'qSearch'],
})
export class QDataTable {
  protected el: HTMLQDataTableElement;
  @Output() qRowClick = new EventEmitter<QDataTableCustomEvent<IQDataTableQDataTableRowClickDetail>>();
  @Output() qSelectionChange = new EventEmitter<QDataTableCustomEvent<IQDataTableQDataTableSelectionChangeDetail>>();
  @Output() qSearch = new EventEmitter<QDataTableCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QDataTableCustomEvent } from '@webquark/core/components';
import type { QDataTableRowClickDetail as IQDataTableQDataTableRowClickDetail } from '@webquark/core/components';
import type { QDataTableSelectionChangeDetail as IQDataTableQDataTableSelectionChangeDetail } from '@webquark/core/components';

export declare interface QDataTable extends Components.QDataTable {
  /**
   * Emitted when a non-interactive row area is clicked or activated with the keyboard.
   */
  qRowClick: EventEmitter<QDataTableCustomEvent<IQDataTableQDataTableRowClickDetail>>;
  /**
   * Emitted when selected rows change.
   */
  qSelectionChange: EventEmitter<QDataTableCustomEvent<IQDataTableQDataTableSelectionChangeDetail>>;
  /**
   * Emitted when the built-in search input value changes.
   */
  qSearch: EventEmitter<QDataTableCustomEvent<string>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQDialog,
  inputs: ['backdropEffect', 'cancelLabel', 'closeLabel', 'closeOnEsc', 'closeOnOverlayClick', 'confirmLabel', 'dialogTitle', 'loading', 'message', 'open', 'showCancel', 'showConfirm'],
  methods: ['show', 'close', 'confirm', 'cancel']
})
@Component({
  selector: 'q-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['backdropEffect', 'cancelLabel', 'closeLabel', 'closeOnEsc', 'closeOnOverlayClick', 'confirmLabel', 'dialogTitle', 'loading', 'message', 'open', 'showCancel', 'showConfirm'],
  outputs: ['qConfirm', 'qCancel', 'qClose'],
})
export class QDialog {
  protected el: HTMLQDialogElement;
  @Output() qConfirm = new EventEmitter<QDialogCustomEvent<void>>();
  @Output() qCancel = new EventEmitter<QDialogCustomEvent<void>>();
  @Output() qClose = new EventEmitter<QDialogCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QDialogCustomEvent } from '@webquark/core/components';

export declare interface QDialog extends Components.QDialog {
  /**
   * Emitted when the confirm action is activated.
   */
  qConfirm: EventEmitter<QDialogCustomEvent<void>>;
  /**
   * Emitted when the cancel action is activated.
   */
  qCancel: EventEmitter<QDialogCustomEvent<void>>;
  /**
   * Emitted whenever the dialog is closed through a public action.
   */
  qClose: EventEmitter<QDialogCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQDropdown,
  inputs: ['disabled', 'label', 'name', 'options', 'placeholder', 'searchable', 'size', 'value']
})
@Component({
  selector: 'q-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'label', 'name', 'options', 'placeholder', 'searchable', 'size', 'value'],
  outputs: ['qChange', 'qSelect', 'qFocus', 'qBlur', 'qClick'],
})
export class QDropdown {
  protected el: HTMLQDropdownElement;
  @Output() qChange = new EventEmitter<QDropdownCustomEvent<string>>();
  @Output() qSelect = new EventEmitter<QDropdownCustomEvent<IQDropdownOption>>();
  @Output() qFocus = new EventEmitter<QDropdownCustomEvent<FocusEvent>>();
  @Output() qBlur = new EventEmitter<QDropdownCustomEvent<FocusEvent>>();
  @Output() qClick = new EventEmitter<QDropdownCustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QDropdownCustomEvent } from '@webquark/core/components';
import type { Option as IQDropdownOption } from '@webquark/core/components';

export declare interface QDropdown extends Components.QDropdown {
  /**
   * Emitted with the selected option value when selection changes.
   */
  qChange: EventEmitter<QDropdownCustomEvent<string>>;
  /**
   * Emitted with the selected option object when selection changes.
   */
  qSelect: EventEmitter<QDropdownCustomEvent<IQDropdownOption>>;
  /**
   * Emitted when the trigger receives focus.
   */
  qFocus: EventEmitter<QDropdownCustomEvent<FocusEvent>>;
  /**
   * Emitted when the trigger loses focus.
   */
  qBlur: EventEmitter<QDropdownCustomEvent<FocusEvent>>;
  /**
   * Emitted before the trigger toggles the menu.
   */
  qClick: EventEmitter<QDropdownCustomEvent<MouseEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQForm,
  inputs: ['action', 'autocomplete', 'enctype', 'enterBehavior', 'label', 'method', 'noValidate', 'preventDefault', 'target'],
  methods: ['getValues', 'setValues', 'resetForm', 'submitForm']
})
@Component({
  selector: 'q-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['action', 'autocomplete', 'enctype', 'enterBehavior', 'label', 'method', 'noValidate', 'preventDefault', 'target'],
  outputs: ['qSubmit', 'qReset'],
})
export class QForm {
  protected el: HTMLQFormElement;
  @Output() qSubmit = new EventEmitter<QFormCustomEvent<IQFormQFormSubmitDetail>>();
  @Output() qReset = new EventEmitter<QFormCustomEvent<IQFormQFormResetDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QFormCustomEvent } from '@webquark/core/components';
import type { QFormSubmitDetail as IQFormQFormSubmitDetail } from '@webquark/core/components';
import type { QFormResetDetail as IQFormQFormResetDetail } from '@webquark/core/components';

export declare interface QForm extends Components.QForm {
  /**
   * Emitted after a valid submit with collected values and FormData.
   */
  qSubmit: EventEmitter<QFormCustomEvent<IQFormQFormSubmitDetail>>;
  /**
   * Emitted when the native form resets.
   */
  qReset: EventEmitter<QFormCustomEvent<IQFormQFormResetDetail>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQIcon,
  inputs: ['color', 'fetchTimeout', 'label', 'lib', 'libVersion', 'localPath', 'name', 'size']
})
@Component({
  selector: 'q-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['color', 'fetchTimeout', 'label', 'lib', 'libVersion', 'localPath', 'name', 'size'],
})
export class QIcon {
  protected el: HTMLQIconElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface QIcon extends Components.QIcon {}


@ProxyCmp({
  defineCustomElementFn: defineQInput,
  inputs: ['clearable', 'disabled', 'error', 'errorMessage', 'label', 'max', 'min', 'name', 'placeholder', 'required', 'size', 'step', 'type', 'value'],
  methods: ['focusElement', 'clearValue']
})
@Component({
  selector: 'q-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['clearable', 'disabled', 'error', 'errorMessage', 'label', 'max', 'min', 'name', 'placeholder', 'required', 'size', 'step', 'type', 'value'],
  outputs: ['qChange', 'qInput', 'qBlur', 'qFocus', 'qClick'],
})
export class QInput {
  protected el: HTMLQInputElement;
  @Output() qChange = new EventEmitter<QInputCustomEvent<string>>();
  @Output() qInput = new EventEmitter<QInputCustomEvent<string>>();
  @Output() qBlur = new EventEmitter<QInputCustomEvent<FocusEvent>>();
  @Output() qFocus = new EventEmitter<QInputCustomEvent<FocusEvent>>();
  @Output() qClick = new EventEmitter<QInputCustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QInputCustomEvent } from '@webquark/core/components';

export declare interface QInput extends Components.QInput {
  /**
   * Emitted when the committed value changes.
   */
  qChange: EventEmitter<QInputCustomEvent<string>>;
  /**
   * Emitted as the user types or spinner controls update the value.
   */
  qInput: EventEmitter<QInputCustomEvent<string>>;
  /**
   * Emitted when the native input loses focus.
   */
  qBlur: EventEmitter<QInputCustomEvent<FocusEvent>>;
  /**
   * Emitted when the native input receives focus.
   */
  qFocus: EventEmitter<QInputCustomEvent<FocusEvent>>;
  /**
   * Emitted when the native input is clicked.
   */
  qClick: EventEmitter<QInputCustomEvent<MouseEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQLink,
  inputs: ['disabled', 'download', 'external', 'href', 'label', 'mailto', 'rel', 'target', 'tel', 'underline', 'url', 'variant']
})
@Component({
  selector: 'q-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'download', 'external', 'href', 'label', 'mailto', 'rel', 'target', 'tel', 'underline', 'url', 'variant'],
  outputs: ['qClick', 'qFocus', 'qBlur'],
})
export class QLink {
  protected el: HTMLQLinkElement;
  @Output() qClick = new EventEmitter<QLinkCustomEvent<MouseEvent>>();
  @Output() qFocus = new EventEmitter<QLinkCustomEvent<FocusEvent>>();
  @Output() qBlur = new EventEmitter<QLinkCustomEvent<FocusEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QLinkCustomEvent } from '@webquark/core/components';

export declare interface QLink extends Components.QLink {
  /**
   * Emitted when the link is clicked and not disabled.
   */
  qClick: EventEmitter<QLinkCustomEvent<MouseEvent>>;
  /**
   * Emitted when the inner anchor receives focus.
   */
  qFocus: EventEmitter<QLinkCustomEvent<FocusEvent>>;
  /**
   * Emitted when the inner anchor loses focus.
   */
  qBlur: EventEmitter<QLinkCustomEvent<FocusEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQNavbar,
  inputs: ['activeValue', 'bordered', 'brand', 'brandHref', 'compact', 'items', 'logoAlt', 'logoSrc', 'mobileLabel', 'sticky', 'transparent']
})
@Component({
  selector: 'q-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeValue', 'bordered', 'brand', 'brandHref', 'compact', 'items', 'logoAlt', 'logoSrc', 'mobileLabel', 'sticky', 'transparent'],
  outputs: ['qSelect', 'qMenuToggle'],
})
export class QNavbar {
  protected el: HTMLQNavbarElement;
  @Output() qSelect = new EventEmitter<QNavbarCustomEvent<IQNavbarNavbarSelectDetail>>();
  @Output() qMenuToggle = new EventEmitter<QNavbarCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QNavbarCustomEvent } from '@webquark/core/components';
import type { NavbarSelectDetail as IQNavbarNavbarSelectDetail } from '@webquark/core/components';

export declare interface QNavbar extends Components.QNavbar {

  qSelect: EventEmitter<QNavbarCustomEvent<IQNavbarNavbarSelectDetail>>;

  qMenuToggle: EventEmitter<QNavbarCustomEvent<boolean>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQPanel,
  inputs: ['ariaLabel', 'fullHeight', 'padding', 'scrollable', 'stickyFooter', 'stickyHeader', 'variant']
})
@Component({
  selector: 'q-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'fullHeight', 'padding', 'scrollable', 'stickyFooter', 'stickyHeader', 'variant'],
})
export class QPanel {
  protected el: HTMLQPanelElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface QPanel extends Components.QPanel {}


@ProxyCmp({
  defineCustomElementFn: defineQQuantitySelector,
  inputs: ['max', 'min', 'step', 'value', 'variant']
})
@Component({
  selector: 'q-quantity-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['max', 'min', 'step', 'value', 'variant'],
  outputs: ['qChange', 'qFocus', 'qBlur', 'qClick'],
})
export class QQuantitySelector {
  protected el: HTMLQQuantitySelectorElement;
  @Output() qChange = new EventEmitter<QQuantitySelectorCustomEvent<number>>();
  @Output() qFocus = new EventEmitter<QQuantitySelectorCustomEvent<FocusEvent>>();
  @Output() qBlur = new EventEmitter<QQuantitySelectorCustomEvent<FocusEvent>>();
  @Output() qClick = new EventEmitter<QQuantitySelectorCustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QQuantitySelectorCustomEvent } from '@webquark/core/components';

export declare interface QQuantitySelector extends Components.QQuantitySelector {
  /**
   * Emitted when the quantity value changes.
   */
  qChange: EventEmitter<QQuantitySelectorCustomEvent<number>>;
  /**
   * Emitted when the input receives focus.
   */
  qFocus: EventEmitter<QQuantitySelectorCustomEvent<FocusEvent>>;
  /**
   * Emitted when the input loses focus, after the value is reconciled.
   */
  qBlur: EventEmitter<QQuantitySelectorCustomEvent<FocusEvent>>;
  /**
   * Emitted when the quantity selector is clicked.
   */
  qClick: EventEmitter<QQuantitySelectorCustomEvent<MouseEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQReel,
  inputs: ['layout', 'lightbox']
})
@Component({
  selector: 'q-reel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['layout', 'lightbox'],
  outputs: ['qLightboxOpen', 'qLightboxClose'],
})
export class QReel {
  protected el: HTMLQReelElement;
  @Output() qLightboxOpen = new EventEmitter<QReelCustomEvent<void>>();
  @Output() qLightboxClose = new EventEmitter<QReelCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QReelCustomEvent } from '@webquark/core/components';

export declare interface QReel extends Components.QReel {
  /**
   * Emitted when the lightbox opens.
   */
  qLightboxOpen: EventEmitter<QReelCustomEvent<void>>;
  /**
   * Emitted when the lightbox closes.
   */
  qLightboxClose: EventEmitter<QReelCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQScrollable,
  inputs: ['autoHide', 'height', 'maxHeight', 'mode', 'nativeOnMobile', 'target'],
  methods: ['scrollToBottom', 'scrollToPosition']
})
@Component({
  selector: 'q-scrollable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['autoHide', 'height', 'maxHeight', 'mode', 'nativeOnMobile', 'target'],
  outputs: ['qScroll'],
})
export class QScrollable {
  protected el: HTMLQScrollableElement;
  @Output() qScroll = new EventEmitter<QScrollableCustomEvent<IQScrollableQScrollableEventDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QScrollableCustomEvent } from '@webquark/core/components';
import type { QScrollableEventDetail as IQScrollableQScrollableEventDetail } from '@webquark/core/components';

export declare interface QScrollable extends Components.QScrollable {

  qScroll: EventEmitter<QScrollableCustomEvent<IQScrollableQScrollableEventDetail>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQSidepanel,
  inputs: ['accordion', 'collapseControl', 'collapseLabel', 'collapseMode', 'collapsed', 'collapsible', 'expanded', 'items', 'mode', 'open', 'panelSize', 'side', 'value', 'variant']
})
@Component({
  selector: 'q-sidepanel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['accordion', 'collapseControl', 'collapseLabel', 'collapseMode', 'collapsed', 'collapsible', 'expanded', 'items', 'mode', 'open', 'panelSize', 'side', 'value', 'variant'],
  outputs: ['qClose', 'qSelect', 'qCollapsedChange'],
})
export class QSidepanel {
  protected el: HTMLQSidepanelElement;
  @Output() qClose = new EventEmitter<QSidepanelCustomEvent<void>>();
  @Output() qSelect = new EventEmitter<QSidepanelCustomEvent<IQSidepanelQSidepanelSelectDetail>>();
  @Output() qCollapsedChange = new EventEmitter<QSidepanelCustomEvent<IQSidepanelQSidepanelCollapsedChangeDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QSidepanelCustomEvent } from '@webquark/core/components';
import type { QSidepanelSelectDetail as IQSidepanelQSidepanelSelectDetail } from '@webquark/core/components';
import type { QSidepanelCollapsedChangeDetail as IQSidepanelQSidepanelCollapsedChangeDetail } from '@webquark/core/components';

export declare interface QSidepanel extends Components.QSidepanel {
  /**
   * Emitted when the drawer is requested to close.
   */
  qClose: EventEmitter<QSidepanelCustomEvent<void>>;
  /**
   * Fires only for leaf items; clicking a parent group toggles it instead
   */
  qSelect: EventEmitter<QSidepanelCustomEvent<IQSidepanelQSidepanelSelectDetail>>;
  /**
   * Fires whenever the BUILT-IN collapse control toggles collapsed. Does not fire when a consumer sets [collapsed] externally themselves.
   */
  qCollapsedChange: EventEmitter<QSidepanelCustomEvent<IQSidepanelQSidepanelCollapsedChangeDetail>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQStepDiagram,
  inputs: ['ariaLabel', 'layout']
})
@Component({
  selector: 'q-step-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['ariaLabel', 'layout'],
})
export class QStepDiagram {
  protected el: HTMLQStepDiagramElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface QStepDiagram extends Components.QStepDiagram {}


@ProxyCmp({
  defineCustomElementFn: defineQStepDiagramItem,
  inputs: ['layout', 'lineStyle', 'status']
})
@Component({
  selector: 'q-step-diagram-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['layout', 'lineStyle', 'status'],
  outputs: ['qItemClick'],
})
export class QStepDiagramItem {
  protected el: HTMLQStepDiagramItemElement;
  @Output() qItemClick = new EventEmitter<QStepDiagramItemCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QStepDiagramItemCustomEvent } from '@webquark/core/components';

export declare interface QStepDiagramItem extends Components.QStepDiagramItem {
  /**
   * Emitted when the focusable step content is clicked or activated with Enter/Space.
   */
  qItemClick: EventEmitter<QStepDiagramItemCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQSyntaxBox,
  inputs: ['code', 'copyable', 'disabled', 'editable', 'heading', 'height', 'language', 'name', 'required', 'value', 'variant'],
  methods: ['scrollToBottom']
})
@Component({
  selector: 'q-syntax-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['code', 'copyable', 'disabled', 'editable', 'heading', 'height', 'language', 'name', 'required', 'value', 'variant'],
  outputs: ['qChange', 'qInput'],
})
export class QSyntaxBox {
  protected el: HTMLQSyntaxBoxElement;
  @Output() qChange = new EventEmitter<QSyntaxBoxCustomEvent<string>>();
  @Output() qInput = new EventEmitter<QSyntaxBoxCustomEvent<string>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QSyntaxBoxCustomEvent } from '@webquark/core/components';

export declare interface QSyntaxBox extends Components.QSyntaxBox {
  /**
   * Emitted when editable content is committed by the native change event or by formatting.
   */
  qChange: EventEmitter<QSyntaxBoxCustomEvent<string>>;
  /**
   * Emitted on each editable content input and after formatting.
   */
  qInput: EventEmitter<QSyntaxBoxCustomEvent<string>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQTextarea,
  inputs: ['autoGrow', 'disabled', 'error', 'errorMessage', 'label', 'name', 'placeholder', 'required', 'resizeMode', 'rows', 'value'],
  methods: ['focusElement', 'adjustHeight']
})
@Component({
  selector: 'q-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['autoGrow', 'disabled', 'error', 'errorMessage', 'label', 'name', 'placeholder', 'required', 'resizeMode', 'rows', 'value'],
  outputs: ['qChange', 'qInput', 'qBlur', 'qFocus', 'qClick'],
})
export class QTextarea {
  protected el: HTMLQTextareaElement;
  @Output() qChange = new EventEmitter<QTextareaCustomEvent<string>>();
  @Output() qInput = new EventEmitter<QTextareaCustomEvent<string>>();
  @Output() qBlur = new EventEmitter<QTextareaCustomEvent<FocusEvent>>();
  @Output() qFocus = new EventEmitter<QTextareaCustomEvent<FocusEvent>>();
  @Output() qClick = new EventEmitter<QTextareaCustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QTextareaCustomEvent } from '@webquark/core/components';

export declare interface QTextarea extends Components.QTextarea {
  /**
   * Emitted when the committed value changes.
   */
  qChange: EventEmitter<QTextareaCustomEvent<string>>;
  /**
   * Emitted as the user types.
   */
  qInput: EventEmitter<QTextareaCustomEvent<string>>;
  /**
   * Emitted when the native textarea loses focus.
   */
  qBlur: EventEmitter<QTextareaCustomEvent<FocusEvent>>;
  /**
   * Emitted when the native textarea receives focus.
   */
  qFocus: EventEmitter<QTextareaCustomEvent<FocusEvent>>;
  /**
   * Emitted when the native textarea is clicked.
   */
  qClick: EventEmitter<QTextareaCustomEvent<MouseEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQThumbnail,
  inputs: ['alt', 'highlighted', 'label', 'src', 'video']
})
@Component({
  selector: 'q-thumbnail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['alt', 'highlighted', 'label', 'src', 'video'],
  outputs: ['qMaximize'],
})
export class QThumbnail {
  protected el: HTMLQThumbnailElement;
  @Output() qMaximize = new EventEmitter<QThumbnailCustomEvent<IQThumbnailQThumbnailMaximizeDetail>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QThumbnailCustomEvent } from '@webquark/core/components';
import type { QThumbnailMaximizeDetail as IQThumbnailQThumbnailMaximizeDetail } from '@webquark/core/components';

export declare interface QThumbnail extends Components.QThumbnail {
  /**
   * Emitted when the thumbnail is activated.
   */
  qMaximize: EventEmitter<QThumbnailCustomEvent<IQThumbnailQThumbnailMaximizeDetail>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQToggle,
  inputs: ['checked', 'disabled', 'error', 'label', 'name', 'required', 'size', 'type'],
  methods: ['toggle']
})
@Component({
  selector: 'q-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'disabled', 'error', 'label', 'name', 'required', 'size', 'type'],
  outputs: ['qChange', 'qFocus', 'qBlur', 'qClick'],
})
export class QToggle {
  protected el: HTMLQToggleElement;
  @Output() qChange = new EventEmitter<QToggleCustomEvent<boolean>>();
  @Output() qFocus = new EventEmitter<QToggleCustomEvent<FocusEvent>>();
  @Output() qBlur = new EventEmitter<QToggleCustomEvent<FocusEvent>>();
  @Output() qClick = new EventEmitter<QToggleCustomEvent<MouseEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QToggleCustomEvent } from '@webquark/core/components';

export declare interface QToggle extends Components.QToggle {
  /**
   * Emitted when the checked state changes.
   */
  qChange: EventEmitter<QToggleCustomEvent<boolean>>;
  /**
   * Emitted when the toggle receives focus.
   */
  qFocus: EventEmitter<QToggleCustomEvent<FocusEvent>>;
  /**
   * Emitted when the toggle loses focus.
   */
  qBlur: EventEmitter<QToggleCustomEvent<FocusEvent>>;
  /**
   * Emitted before the toggle changes due to pointer or keyboard activation.
   */
  qClick: EventEmitter<QToggleCustomEvent<MouseEvent>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQTooltip,
  inputs: ['content', 'delay', 'position']
})
@Component({
  selector: 'q-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['content', 'delay', 'position'],
})
export class QTooltip {
  protected el: HTMLQTooltipElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface QTooltip extends Components.QTooltip {}


