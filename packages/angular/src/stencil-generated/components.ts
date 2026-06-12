/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@webquark/core/components';

import { defineCustomElement as defineQButton } from '@webquark/core/components/q-button.js';
import { defineCustomElement as defineQCard } from '@webquark/core/components/q-card.js';
import { defineCustomElement as defineQCarousel } from '@webquark/core/components/q-carousel.js';
import { defineCustomElement as defineQCircularProgress } from '@webquark/core/components/q-circular-progress.js';
import { defineCustomElement as defineQDropdown } from '@webquark/core/components/q-dropdown.js';
import { defineCustomElement as defineQIcon } from '@webquark/core/components/q-icon.js';
import { defineCustomElement as defineQInput } from '@webquark/core/components/q-input.js';
import { defineCustomElement as defineQReel } from '@webquark/core/components/q-reel.js';
import { defineCustomElement as defineQScrollable } from '@webquark/core/components/q-scrollable.js';
import { defineCustomElement as defineQSidepanel } from '@webquark/core/components/q-sidepanel.js';
import { defineCustomElement as defineQStepDiagram } from '@webquark/core/components/q-step-diagram.js';
import { defineCustomElement as defineQStepDiagramItem } from '@webquark/core/components/q-step-diagram-item.js';
import { defineCustomElement as defineQTextarea } from '@webquark/core/components/q-textarea.js';
import { defineCustomElement as defineQThumbnail } from '@webquark/core/components/q-thumbnail.js';
import { defineCustomElement as defineQToggle } from '@webquark/core/components/q-toggle.js';
import { defineCustomElement as defineQTooltip } from '@webquark/core/components/q-tooltip.js';
@ProxyCmp({
  defineCustomElementFn: defineQButton,
  inputs: ['disabled', 'download', 'expand', 'href', 'loading', 'size', 'target', 'type', 'variant']
})
@Component({
  selector: 'q-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'download', 'expand', 'href', 'loading', 'size', 'target', 'type', 'variant'],
})
export class QButton {
  protected el: HTMLQButtonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface QButton extends Components.QButton {}


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
  @Output() qSlideChange = new EventEmitter<QCarouselCustomEvent<{ index: number; element: HTMLElement }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QCarouselCustomEvent } from '@webquark/core/components';

export declare interface QCarousel extends Components.QCarousel {

  qSlideChange: EventEmitter<QCarouselCustomEvent<{ index: number; element: HTMLElement }>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQCircularProgress,
  inputs: ['indeterminate', 'label', 'size', 'value']
})
@Component({
  selector: 'q-circular-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['indeterminate', 'label', 'size', 'value'],
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
  defineCustomElementFn: defineQDropdown,
  inputs: ['disabled', 'label', 'options', 'placeholder', 'size', 'value']
})
@Component({
  selector: 'q-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'label', 'options', 'placeholder', 'size', 'value'],
  outputs: ['qChange', 'qSelect'],
})
export class QDropdown {
  protected el: HTMLQDropdownElement;
  @Output() qChange = new EventEmitter<QDropdownCustomEvent<string>>();
  @Output() qSelect = new EventEmitter<QDropdownCustomEvent<IQDropdownOption>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QDropdownCustomEvent } from '@webquark/core/components';
import type { Option as IQDropdownOption } from '@webquark/core/components';

export declare interface QDropdown extends Components.QDropdown {

  qChange: EventEmitter<QDropdownCustomEvent<string>>;

  qSelect: EventEmitter<QDropdownCustomEvent<IQDropdownOption>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQIcon,
  inputs: ['color', 'lib', 'localPath', 'name', 'size']
})
@Component({
  selector: 'q-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['color', 'lib', 'localPath', 'name', 'size'],
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
  inputs: ['clearable', 'disabled', 'error', 'errorMessage', 'label', 'placeholder', 'required', 'size', 'type', 'value'],
  methods: ['focusElement', 'clearValue']
})
@Component({
  selector: 'q-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['clearable', 'disabled', 'error', 'errorMessage', 'label', 'placeholder', 'required', 'size', 'type', 'value'],
  outputs: ['qChange', 'qInput', 'qBlur', 'qFocus'],
})
export class QInput {
  protected el: HTMLQInputElement;
  @Output() qChange = new EventEmitter<QInputCustomEvent<string>>();
  @Output() qInput = new EventEmitter<QInputCustomEvent<string>>();
  @Output() qBlur = new EventEmitter<QInputCustomEvent<FocusEvent>>();
  @Output() qFocus = new EventEmitter<QInputCustomEvent<FocusEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QInputCustomEvent } from '@webquark/core/components';

export declare interface QInput extends Components.QInput {

  qChange: EventEmitter<QInputCustomEvent<string>>;

  qInput: EventEmitter<QInputCustomEvent<string>>;

  qBlur: EventEmitter<QInputCustomEvent<FocusEvent>>;

  qFocus: EventEmitter<QInputCustomEvent<FocusEvent>>;
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

  qLightboxOpen: EventEmitter<QReelCustomEvent<void>>;

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
  @Output() qScroll = new EventEmitter<QScrollableCustomEvent<{ scrollTop: number; scrollHeight: number; clientHeight: number }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QScrollableCustomEvent } from '@webquark/core/components';

export declare interface QScrollable extends Components.QScrollable {

  qScroll: EventEmitter<QScrollableCustomEvent<{ scrollTop: number; scrollHeight: number; clientHeight: number }>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQSidepanel,
  inputs: ['open', 'panelSize', 'side']
})
@Component({
  selector: 'q-sidepanel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['open', 'panelSize', 'side'],
  outputs: ['qClose'],
})
export class QSidepanel {
  protected el: HTMLQSidepanelElement;
  @Output() qClose = new EventEmitter<QSidepanelCustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QSidepanelCustomEvent } from '@webquark/core/components';

export declare interface QSidepanel extends Components.QSidepanel {

  qClose: EventEmitter<QSidepanelCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQStepDiagram,
  inputs: ['layout']
})
@Component({
  selector: 'q-step-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['layout'],
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

  qItemClick: EventEmitter<QStepDiagramItemCustomEvent<void>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQTextarea,
  inputs: ['autoGrow', 'disabled', 'error', 'errorMessage', 'label', 'placeholder', 'required', 'rows', 'value'],
  methods: ['focusElement', 'adjustHeight']
})
@Component({
  selector: 'q-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['autoGrow', 'disabled', 'error', 'errorMessage', 'label', 'placeholder', 'required', 'rows', 'value'],
  outputs: ['qChange', 'qInput', 'qBlur', 'qFocus'],
})
export class QTextarea {
  protected el: HTMLQTextareaElement;
  @Output() qChange = new EventEmitter<QTextareaCustomEvent<string>>();
  @Output() qInput = new EventEmitter<QTextareaCustomEvent<string>>();
  @Output() qBlur = new EventEmitter<QTextareaCustomEvent<FocusEvent>>();
  @Output() qFocus = new EventEmitter<QTextareaCustomEvent<FocusEvent>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QTextareaCustomEvent } from '@webquark/core/components';

export declare interface QTextarea extends Components.QTextarea {

  qChange: EventEmitter<QTextareaCustomEvent<string>>;

  qInput: EventEmitter<QTextareaCustomEvent<string>>;

  qBlur: EventEmitter<QTextareaCustomEvent<FocusEvent>>;

  qFocus: EventEmitter<QTextareaCustomEvent<FocusEvent>>;
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
  @Output() qMaximize = new EventEmitter<QThumbnailCustomEvent<{ src: string; label?: string; video: boolean; alt: string; triggerEl: HTMLElement }>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QThumbnailCustomEvent } from '@webquark/core/components';

export declare interface QThumbnail extends Components.QThumbnail {

  qMaximize: EventEmitter<QThumbnailCustomEvent<{ src: string; label?: string; video: boolean; alt: string; triggerEl: HTMLElement }>>;
}


@ProxyCmp({
  defineCustomElementFn: defineQToggle,
  inputs: ['checked', 'disabled', 'error', 'label', 'required', 'size', 'type'],
  methods: ['toggle']
})
@Component({
  selector: 'q-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'disabled', 'error', 'label', 'required', 'size', 'type'],
  outputs: ['qChange'],
})
export class QToggle {
  protected el: HTMLQToggleElement;
  @Output() qChange = new EventEmitter<QToggleCustomEvent<boolean>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


import type { QToggleCustomEvent } from '@webquark/core/components';

export declare interface QToggle extends Components.QToggle {

  qChange: EventEmitter<QToggleCustomEvent<boolean>>;
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


