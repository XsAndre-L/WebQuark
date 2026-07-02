import { Component, Element, Event, EventEmitter, Listen, Method, Prop, h } from '@stencil/core';
import { handleEnterBehavior } from './internals/enter-behavior';
import { applyValues, collectValues, createFormData } from './internals/values';
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

@Component({
  tag: 'q-form',
  styleUrl: 'form.css',
  shadow: true,
})
export class QForm {
  @Element() el!: HTMLElement;

  @Prop() label?: string;
  @Prop() action?: string;
  @Prop() method: QFormMethod = 'post';
  @Prop() autocomplete: QFormAutocomplete = 'on';
  @Prop() enctype: QFormEnctype = 'application/x-www-form-urlencoded';
  @Prop() target?: QFormTarget;
  @Prop({ attribute: 'no-validate' }) noValidate: boolean = false;
  @Prop() preventDefault: boolean = true;
  @Prop({ attribute: 'enter-behavior' }) enterBehavior: QFormEnterBehavior = 'submit';

  @Event() qSubmit!: EventEmitter<QFormSubmitDetail>;
  @Event() qReset!: EventEmitter<QFormResetDetail>;

  private formEl?: HTMLFormElement;
  private handledButtonClicks = new WeakSet<Event>();

  @Method()
  async getValues(): Promise<QFormValues> {
    return collectValues(this.formEl, this.el);
  }

  @Method()
  async setValues(values: QFormValues): Promise<void> {
    applyValues(this.formEl, this.el, values);
  }

  @Method()
  async resetForm(): Promise<void> {
    this.formEl?.reset();
  }

  @Method()
  async submitForm(): Promise<void> {
    this.requestSubmit();
  }

  @Listen('click')
  handleComposedClick(ev: MouseEvent) {
    this.handleComposedFormAction(ev, ev);
  }

  @Listen('qClick')
  handleButtonClick(ev: CustomEvent<MouseEvent>) {
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

  private handleSubmit = (ev: Event) => {
    if (this.preventDefault) {
      ev.preventDefault();
    }

    if (!this.noValidate && this.formEl && typeof this.formEl.reportValidity === 'function' && !this.formEl.reportValidity()) {
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
  };

  private handleReset = (ev: Event) => {
    if (!this.formEl) return;

    this.qReset.emit({
      form: this.formEl,
      originalEvent: ev,
    });
  };

  render() {
    return (
      <div class="form-shell">
        <div class="form-header" part="header">
          <slot name="header">
            {this.label && <h2 class="form-title">{this.label}</h2>}
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
          part="form"
          onSubmit={this.handleSubmit}
          onReset={this.handleReset}
        >
          <div class="form-body" part="body">
            <slot />
          </div>

          <div class="form-actions" part="actions">
            <slot name="actions" />
          </div>
        </form>
      </div>
    );
  }
}






