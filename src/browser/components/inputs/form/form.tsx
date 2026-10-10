import { controlScope, type QControlSize } from '../../../theme/tokens';
import { Component, Element, Event, EventEmitter, Host, Listen, Method, Prop, State, h } from '@stencil/core';
import { handleEnterBehavior } from './internals/enter-behavior';
import { awaitFormControls, getFormControls } from './internals/controls';
import { validateField } from './internals/field-state';
import { applyValues, collectFormState, collectValues } from './internals/values';
import { reconcileControls, resetLogicalControls } from './internals/reset';
import { dispatchFormSubmit, isSubmitAction, readSubmitActivation, scheduleSubmitAction, setFormSubmitting, submitOwner, submitterNoValidate, type SubmitActivation } from '../../../utils/form-submit-action';
import { cancelSubmitAndAwaitDispatch, closeSubmissionDialog, deliverForm, normalizedMethod, submissionSettings, submitterFields } from './internals/submission';
import { awaitResetActions, scheduleResetAction } from '../../../utils/form-reset-action';
import type {
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
 * Supported controls in the light DOM and native associations participate in validation,
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
  private readonly titleId = `q-form-title-${++formIds}`;
  private resetTask?: Promise<void>;
  private resetRequest?: Promise<void>;
  private submitTask?: Promise<void>;
  private submitGeneration = 0;
  private submitAbort?: AbortController;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentDidLoad() {
    this.updateHeaderSlotState();
    this.updateActionsSlotState();
  }

  disconnectedCallback() {
    this.submitGeneration++;
    this.submitAbort?.abort();
  }

  // ============================ [4] EXPOSED METHODS ============================

  /** Returns values collected from named native and WebQuark form controls. */
  @Method()
  async getValues(): Promise<QFormValues> {
    await awaitFormControls(this.formEl, this.el);
    await awaitResetActions(this.el);
    await (this.resetRequest ?? this.resetTask);
    return collectValues(this.formEl, this.el);
  }

  /** Applies values to matching named native and WebQuark form controls. */
  @Method()
  async setValues(values: QFormValues): Promise<void> {
    await awaitFormControls(this.formEl, this.el);
    await awaitResetActions(this.el);
    await (this.resetRequest ?? this.resetTask);
    applyValues(this.formEl, this.el, values);
  }

  /** Resets the native form and associated controls. */
  @Method()
  async resetForm(): Promise<void> {
    if (this.resetRequest) return this.resetRequest;
    if (this.resetTask) return this.resetTask;
    const request = this.performReset();
    this.resetRequest = request;
    try {
      await request;
    } finally {
      if (this.resetRequest === request) this.resetRequest = undefined;
    }
  }

  /** Checks current owned fields without displaying validation messages. */
  @Method()
  async checkValidity(): Promise<boolean> {
    return this.reportControlValidity(false);
  }

  /** Reports current owned field constraints and returns aggregate validity. */
  @Method()
  async reportValidity(): Promise<boolean> {
    return this.reportControlValidity(true);
  }

  /** Requests native form submission, falling back to dispatching a submit event. */
  @Method()
  async submitForm(): Promise<void> {
    if (!this.submitTask) this.requestSubmit();
    await this.submitTask;
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private async performReset(): Promise<void> {
    await awaitFormControls(this.formEl, this.el);
    if (this.resetTask) return this.resetTask;
    if (!this.formEl) return;
    reconcileControls(this.formEl, this.el);

    const nativeReset = this.formEl.ownerDocument.defaultView!.HTMLFormElement.prototype.reset;
    nativeReset.call(this.formEl);
    await this.resetTask;
  }

  @Listen('click')
  handleComposedClick(ev: MouseEvent) {
    const action = ev.composedPath().find(target => target instanceof HTMLButtonElement || target instanceof HTMLInputElement) as HTMLButtonElement | HTMLInputElement | undefined;
    // Read native image offsetX/Y inside its own shadow tree. Outside that tree
    // the click is retargeted to q-form and offsets are relative to the host.
    if (action?.getRootNode() === this.formEl?.getRootNode() && ev.currentTarget === this.el) return;
    if (action?.type === 'reset') {
      if (!action.form && !action.hasAttribute('form')) scheduleResetAction(action, ev);
      return;
    }
    // q-button owns its bridge, including cancellation of qClick and late click listeners.
    if (action && !ev.composedPath().some(target => target instanceof HTMLElement && target.tagName === 'Q-BUTTON')) scheduleSubmitAction(action, ev);
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
    if (this.formEl) dispatchFormSubmit(this.formEl);
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
    if (ev.target !== this.formEl) return;
    if (ev.defaultPrevented || this.submitTask || !this.formEl) {
      ev.preventDefault();
      return;
    }
    // Cancels synchronously and observes later native submit listener calls.
    const dispatch = cancelSubmitAndAwaitDispatch(ev);
    const form = this.formEl;
    const generation = this.submitGeneration;
    const activation = readSubmitActivation(ev);
    const abort = new AbortController();
    this.submitAbort = abort;
    setFormSubmitting(form, true);
    const task = this.processSubmit(ev, form, generation, activation, abort.signal, dispatch);
    this.submitTask = task;
    void task.catch(error => console.error(error));
    void task.finally(() => {
      if (this.submitTask === task) this.submitTask = undefined;
      if (this.submitAbort === abort) this.submitAbort = undefined;
      setFormSubmitting(form, false);
    }).catch(() => {});
  };

  private currentSubmission(form: HTMLFormElement, generation: number, activation: SubmitActivation): boolean {
    if (!this.el.isConnected || this.formEl !== form || this.submitGeneration !== generation) return false;
    const submitter = activation.submitter;
    return !submitter || (submitter.isConnected && isSubmitAction(submitter) && [form, this.el].includes(submitOwner(submitter)!));
  }

  private async processSubmit(ev: Event, form: HTMLFormElement, generation: number, activation: SubmitActivation, signal: AbortSignal, dispatch: Promise<boolean>): Promise<void> {
    if (await dispatch) return;
    await awaitFormControls(form, this.el, signal);
    await awaitResetActions(this.el);
    await (this.resetRequest ?? this.resetTask);
    if (!this.currentSubmission(form, generation, activation)) return;
    reconcileControls(form, this.el);
    if (!this.noValidate && !submitterNoValidate(activation.submitter)) {
      for (const control of getFormControls(form, this.el)) if (!validateField(control, true)) return;
    }
    if (!this.currentSubmission(form, generation, activation)) return;
    const { values, formData } = collectFormState(form, this.el, submitterFields(activation));
    const settings = submissionSettings({ action: this.action, method: this.method, enctype: this.enctype, target: this.target }, activation.submitter);
    const emitted = this.qSubmit.emit({ values, formData, form, originalEvent: ev, submitter: activation.submitter });
    if (emitted.defaultPrevented || this.preventDefault || !this.currentSubmission(form, generation, activation)) return;
    if (normalizedMethod(form, settings.method) === 'dialog') closeSubmissionDialog(this.el, activation);
    else deliverForm(form, formData, settings);
  }

  private async reportControlValidity(report = true): Promise<boolean> {
    await awaitFormControls(this.formEl, this.el);
    await awaitResetActions(this.el);
    await (this.resetRequest ?? this.resetTask);
    if (this.formEl) reconcileControls(this.formEl, this.el);
    for (const control of getFormControls(this.formEl, this.el)) {
      if (!validateField(control, report)) return false;
    }
    return true;
  }

  private handleReset = (ev: Event) => {
    if (!this.formEl) return;
    if (this.resetTask) {
      ev.preventDefault();
      return;
    }
    const form = this.formEl;
    let complete!: () => void;
    let fail!: (reason: unknown) => void;
    const task = new Promise<void>((resolve, reject) => {
      complete = resolve;
      fail = reject;
    });
    this.resetTask = task;
    const emitted = this.qReset.emit({
      form: this.formEl,
      originalEvent: ev,
    });
    if (emitted.defaultPrevented) ev.preventDefault();
    // Native reset dispatch can flush microtasks before later listeners run.
    // Preserve resetTask while waiting for their final cancellation decision.
    setTimeout(async () => {
      try {
        if (!ev.defaultPrevented && this.el.isConnected) {
          await awaitFormControls(form, this.el);
          if (!ev.defaultPrevented && this.el.isConnected && this.formEl === form) {
            resetLogicalControls(form, this.el);
            reconcileControls(form, this.el);
          }
        }
        complete();
      } catch (error) {
        fail(error);
      } finally {
        if (this.resetTask === task) this.resetTask = undefined;
      }
    }, 0);
    void task.catch(error => console.error(error));
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const hasHeaderContent = Boolean(this.label) || this.hasHeaderSlot;
    const formLabelledBy = !this.ariaLabel && this.label && !this.hasHeaderSlot ? this.titleId : undefined;
    const formAriaLabel = this.ariaLabel?.trim() || (this.label && this.hasHeaderSlot ? this.label : undefined);

    return (
      <Host style={{ ...controlScope(this.size), '--q-context-feedback-min': this.reserveFeedback === undefined ? '' : 'initial', '--_q-context-feedback-reserve': this.reserveFeedback === undefined ? '' : this.reserveFeedback ? '1' : '0' }}>
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
          onClick={(ev) => {
            const image = ev.target;
            if (image instanceof HTMLInputElement && image.type === 'image' && image.getRootNode() === this.formEl?.getRootNode()) this.handleComposedClick(ev);
          }}
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
