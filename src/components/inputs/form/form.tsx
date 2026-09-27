import { controlScope, type QControlSize } from '../../../theme/tokens';
import { Component, Element, Event, EventEmitter, Host, Listen, Method, Prop, State, h } from '@stencil/core';
import { handleEnterBehavior } from './internals/enter-behavior';
import { getNamedControls, shouldSkipControl } from './internals/controls';
import { applyValues, collectValues, createFormData, resetValues } from './internals/values';
import type {
  NamedFormControl,
  QFormAction,
  QFormAutocomplete,
  QFormEnctype,
  QFormEnterBehavior,
  QFormMethod,
  QFormResetDetail,
  QFormSubmitDetail,
  QFormTarget,
  QFormValues,
} from './form.types';

let formIds = 0;

/**
 * Form wrapper that bridges slotted WebQuark controls to a native form element.
 * Named controls in the light DOM and assigned slots participate in validation,
 * value collection, reset, and `FormData`. Controls hidden inside a
 * consumer-owned nested shadow root are outside this explicit boundary.
 *
 * @slot - Form fields and body content.
 * @slot header - Optional custom header content.
 * @slot actions - Optional form action controls.
 * @part header - Header container.
 * @part form - Native form element.
 * @part body - Body content container.
 * @part actions - Action controls container.
 */
@Component({
  tag: 'q-form',
  styleUrl: 'form.css',
  shadow: true,
})
export class QForm {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  /** Names the native form when no custom header is slotted. */
  @Prop() label?: string;

  @Prop() size: QControlSize = 'inherit';
  @Prop() reserveFeedback?: boolean;
  @Prop() labelHidden: boolean = false;

  /** Prevents the native submit event's default navigation. */
  @Prop() preventDefault: boolean = true;
  /** Controls how Enter behaves inside text-like controls. */
  @Prop({ attribute: 'enter-behavior' }) enterBehavior: QFormEnterBehavior = 'submit';

  @Prop({ attribute: 'no-validate' }) noValidate: boolean = false;

  @Prop() action?: string;
  @Prop() method: QFormMethod = 'post';
  @Prop() autocomplete: QFormAutocomplete = 'on';
  @Prop() enctype: QFormEnctype = 'application/x-www-form-urlencoded';
  @Prop() target?: QFormTarget;

  /** Names the native form without requiring a visible heading. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  /** Emitted after a valid submit with collected values and FormData. */
  @Event() qSubmit!: EventEmitter<QFormSubmitDetail>;

  @Event() qReset!: EventEmitter<QFormResetDetail>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() hasHeaderSlot: boolean = false;
  @State() hasActionsSlot: boolean = false;

  private formEl?: HTMLFormElement;
  private headerSlot?: HTMLSlotElement;
  private actionsSlot?: HTMLSlotElement;
  private handledButtonClicks = new WeakSet<Event>();
  private readonly titleId = `q-form-title-${++formIds}`;
  private initialValues: QFormValues = {};
  private submitTask?: Promise<void>;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentDidLoad() {
    this.updateHeaderSlotState();
    this.updateActionsSlotState();
    this.initialValues = collectValues(this.formEl, this.el);
  }

  // ============================ [4] EXPOSED METHODS ============================

  /** Returns values collected from named native and WebQuark form controls. */
  @Method()
  async getValues(): Promise<QFormValues> {
    return collectValues(this.formEl, this.el);
  }

  /** Applies values to matching named native and WebQuark form controls. */
  @Method()
  async setValues(values: QFormValues): Promise<void> {
    applyValues(this.formEl, this.el, values);
  }

  /** Resets the native form and associated controls. */
  @Method()
  async resetForm(): Promise<void> {
    if (!this.formEl) return;

    const nativeReset = HTMLFormElement.prototype.reset;
    if (typeof nativeReset === 'function') {
      nativeReset.call(this.formEl);
    } else {
      this.formEl.dispatchEvent(new globalThis.Event('reset', { bubbles: true, cancelable: true }));
    }

    resetValues(this.formEl, this.el);
    applyValues(this.formEl, this.el, this.initialValues);
  }

  /** Requests native form submission, falling back to dispatching a submit event. */
  @Method()
  async submitForm(): Promise<void> {
    this.requestSubmit();
    await this.submitTask;
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  @Listen('click')
  handleComposedClick(ev: MouseEvent) {
    this.handleComposedFormAction(ev, ev);
  }

  @Listen('qClick')
  handleButtonClick(ev: CustomEvent<MouseEvent>) {
    // q-button forwards its original MouseEvent in qClick.detail; the WeakSet prevents the host click listener from handling it twice.
    if (ev.detail && this.handledButtonClicks.has(ev.detail)) return;
    if (ev.detail) this.handledButtonClicks.add(ev.detail);
    this.handleComposedFormAction(ev, ev);
  }

  @Listen('keydown')
  handleKeyDown(ev: KeyboardEvent) {
    handleEnterBehavior({
      ev,
      enterBehavior: this.enterBehavior,
      formEl: this.formEl,
      hostEl: this.el,
      requestSubmit: () => this.requestSubmit(),
    });
  }

  private requestSubmit() {
    if (!this.formEl) return;

    if (typeof this.formEl.requestSubmit === 'function') {
      this.formEl.requestSubmit();
      return;
    }

    this.dispatchSubmitEvent();
  }

  private handleComposedFormAction(ev: Event, sourceEvent: Event) {
    if (this.handledButtonClicks.has(sourceEvent)) return;

    const action = this.getFormActionFromComposedPath(sourceEvent.composedPath());
    if (!action || !this.formEl) return;

    this.handledButtonClicks.add(sourceEvent);
    ev.preventDefault();

    if (action === 'reset') {
      this.formEl.reset();
      return;
    }

    this.dispatchSubmitEvent();
  }

  private dispatchSubmitEvent() {
    this.formEl?.dispatchEvent(new globalThis.Event('submit', { bubbles: true, cancelable: true }));
  }

  private getFormActionFromComposedPath(path: EventTarget[]): QFormAction | undefined {
    for (const target of path) {
      if (!(target instanceof HTMLElement)) continue;
      if (target.tagName.toLowerCase() !== 'q-button') continue;

      const control = target as NamedFormControl;
      const type = (control.type || target.getAttribute('type') || '').toLowerCase();
      if (type === 'submit' || type === 'reset') return type;
    }

    return undefined;
  }

  private handleHeaderSlotChange = () => {
    this.updateHeaderSlotState();
  };

  private handleActionsSlotChange = () => {
    this.updateActionsSlotState();
  };

  private updateHeaderSlotState() {
    this.hasHeaderSlot = this.slotHasAssignedContent(this.headerSlot);
  }

  private updateActionsSlotState() {
    this.hasActionsSlot = this.slotHasAssignedContent(this.actionsSlot);
  }

  private slotHasAssignedContent(slot: HTMLSlotElement | undefined): boolean {
    if (!slot) return false;

    return slot.assignedNodes({ flatten: true }).some(node => {
      if (node.nodeType === Node.ELEMENT_NODE) return true;
      if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent?.trim());
      return false;
    });
  }

  private handleSubmit = (ev: Event): void => {
    this.submitTask = this.processSubmit(ev);
  };

  private async processSubmit(ev: Event): Promise<void> {
    if (this.preventDefault) {
      ev.preventDefault();
    }

    if (!this.noValidate && !(await this.reportControlValidity())) {
      return;
    }

    if (!this.formEl) return;

    const formData = createFormData(this.formEl, this.el);

    this.qSubmit.emit({
      values: collectValues(this.formEl, this.el, formData),
      formData,
      form: this.formEl,
      originalEvent: ev,
    });
  }

  private async reportControlValidity(): Promise<boolean> {
    if (
      this.formEl &&
      typeof this.formEl.reportValidity === 'function' &&
      !this.formEl.reportValidity()
    ) {
      return false;
    }

    const controls = getNamedControls(this.formEl, this.el);
    for (const control of controls) {
      const validate =
        typeof control.reportValidity === 'function'
          ? control.reportValidity
          : control.checkValidity;

      if (
        control.disabled ||
        shouldSkipControl(control) ||
        typeof validate !== 'function'
      ) {
        continue;
      }

      if (!(await validate.call(control))) {
        return false;
      }
    }

    return true;
  }

  private handleReset = (ev: Event) => {
    if (!this.formEl) return;

    this.qReset.emit({
      form: this.formEl,
      originalEvent: ev,
    });
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const hasHeaderContent = Boolean(this.label) || this.hasHeaderSlot;
    const formLabelledBy = !this.ariaLabel && this.label && !this.hasHeaderSlot ? this.titleId : undefined;
    const formAriaLabel = this.ariaLabel?.trim() || (this.label && this.hasHeaderSlot ? this.label : undefined);

    return (
      <Host style={{ ...controlScope(this.size), '--q-context-feedback-min': this.reserveFeedback === undefined ? '' : this.reserveFeedback ? '1rem' : '0px' }}>
      <div class="form-shell">
        <div class={{ 'form-header': true, 'is-hidden': !hasHeaderContent, 'q-label-hidden': this.labelHidden }} part="header">
          <slot name="header" ref={(el) => (this.headerSlot = el as HTMLSlotElement)} onSlotchange={this.handleHeaderSlotChange}>
            {this.label && <h2 id={this.titleId} class="form-title">{this.label}</h2>}
          </slot>
        </div>

        <form
          ref={(el) => (this.formEl = el as HTMLFormElement)}
          action={this.action}
          method={this.method}
          autocomplete={this.autocomplete}
          enctype={this.enctype}
          target={this.target}
          noValidate={this.noValidate}
          aria-labelledby={formLabelledBy}
          aria-label={formAriaLabel}
          part="form"
          onSubmit={this.handleSubmit}
          onReset={this.handleReset}
        >
          <div class="form-body" part="body">
            <slot />
          </div>

          <div class={{ 'form-actions': true, 'is-hidden': !this.hasActionsSlot }} part="actions">
            <slot name="actions" ref={(el) => (this.actionsSlot = el as HTMLSlotElement)} onSlotchange={this.handleActionsSlotChange} />
          </div>
        </form>
      </div>
      </Host>
    );
  }
}
