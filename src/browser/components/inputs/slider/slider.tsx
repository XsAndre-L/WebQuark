import { AttachInternals, Component, Element, Event, EventEmitter, h, Method, Prop, State, Watch } from '@stencil/core';
import { isFieldDisabled } from '../../../utils/form-field-state';
import { registerFormField } from '../../../utils/form-field-adapter';

/**
 * Single-value range input with a themed track, glowing thumb and optional value badge.
 * @part label - Label and value row.
 * @part value - Current-value badge.
 * @part input - Native range control.
 */
@Component({ tag: 'q-slider', styleUrl: 'slider.css', shadow: { delegatesFocus: true }, formAssociated: true })
export class QSlider {
  @Element() el!: HTMLElement;
  /** Current value. Defaults to the minimum when omitted. */
  @Prop({ mutable: true }) value?: number;
  @Prop() label?: string;
  /** Suffix for the displayed value, such as px or %. */
  @Prop() suffix: string = '';

  @Prop() showValue: boolean = true;

  @Prop({ reflect: true }) disabled: boolean = false;

  @Prop() min: number = 0;
  @Prop() max: number = 100;
  @Prop() step: number = 1;

  @Prop({ reflect: true }) name?: string;

  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  @AttachInternals() internals!: ElementInternals;
  /** Numeric value emitted continuously while dragging or using the keyboard. */
  @Event() qInput!: EventEmitter<number>;
  /** Numeric value emitted when the interaction is committed. */
  @Event() qChange!: EventEmitter<number>;
  @State() private fieldDisabled = false;
  private inputEl?: HTMLInputElement;
  private initialValue?: number;

  componentWillLoad() {
    this.initialValue = this.value;
    this.normalize();
  }

  @Watch('value')
  @Watch('min')
  @Watch('max')
  @Watch('step')
  constraintsChanged() { this.normalize(); }

  @Watch('disabled')
  disabledChanged() { this.syncForm(); }

  private get lower() { return Number.isFinite(this.min) ? this.min : 0; }
  private get upper() { return Math.max(this.lower, Number.isFinite(this.max) ? this.max : 100); }
  private get increment() { return Number.isFinite(this.step) && this.step > 0 ? this.step : 1; }

  private normalize() {
    const candidate = Number.isFinite(this.value) ? this.value! : this.lower;
    const steps = Math.round((Math.min(this.upper, Math.max(this.lower, candidate)) - this.lower) / this.increment);
    const lastStep = Math.floor((this.upper - this.lower) / this.increment + 1e-10);
    const next = Number((this.lower + Math.min(steps, lastStep) * this.increment).toPrecision(12));
    if (this.value !== next) this.value = next;
    this.syncForm();
  }

  private syncForm() {
    this.fieldDisabled = isFieldDisabled(this.el, this.disabled);
    this.internals?.setFormValue?.(this.fieldDisabled ? null : String(this.value ?? this.lower));
  }

  componentDidLoad() {
    registerFormField(this.el, {
      kind: 'text',
      owner: () => this.internals?.form ?? null,
      active: () => true,
      value: () => String(this.value),
      assign: value => { this.value = Number(value); this.normalize(); },
      reconcile: () => this.normalize(),
      reset: () => this.formResetCallback(),
      validate: () => true,
    });
    this.syncForm();
  }

  formDisabledCallback() { this.syncForm(); }
  formResetCallback() { this.value = this.initialValue; this.normalize(); }
  formStateRestoreCallback(state: string | File | FormData | null) {
    if (typeof state === 'string') { this.value = Number(state); this.normalize(); }
  }

  @Method()
  async focusElement() { this.inputEl?.focus(); }

  private onValue(event: Event, committed: boolean) {
    if (this.fieldDisabled) return;
    this.value = (event.target as HTMLInputElement).valueAsNumber;
    this.normalize();
    if (committed) this.qChange.emit(this.value!);
    else this.qInput.emit(this.value!);
  }

  render() {
    return (
      <div class="field">
        {(this.label || this.showValue) && <div class="label-row" part="label">
          {this.label && <label htmlFor="range">{this.label}</label>}
          {this.showValue && <span class="badge" part="value" aria-hidden="true">{this.value}{this.suffix}</span>}
        </div>}
        <input ref={el => this.inputEl = el} id="range" part="input" type="range"
          min={this.lower} max={this.upper} step={this.increment} value={this.value}
          disabled={this.fieldDisabled} aria-label={this.ariaLabel || (!this.label ? 'Value' : undefined)}
          aria-valuetext={this.suffix ? `${this.value}${this.suffix}` : undefined}
          onInput={event => this.onValue(event, false)} onChange={event => this.onValue(event, true)} />
      </div>
    );
  }
}
