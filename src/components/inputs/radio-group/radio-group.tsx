import { AttachInternals, Component, Element, Event, EventEmitter, h, Method, Prop, Watch } from '@stencil/core';

import { identifyItems } from '../../../utils/collection-identity';
import type { QRadioGroupOrientation, QRadioGroupSize, RadioGroupOption, RadioGroupOptionInput } from './radio-group.types';
import { getRadioGroupOptions } from './radio-group.utils';

let nextRadioGroupId = 0;

/**
 * Form-associated single-selection radio group with a connected segmented presentation.
 * @part group - Native fieldset that owns the radio-group semantics.
 * @part label - Visible group legend.
 * @part options - Segmented option container.
 * @part option - Individual option label.
 * @part input - Native radio input retained for keyboard and screen-reader behavior.
 * @part option-label - Visible option text.
 * @part error-msg - Validation helper text.
 */
@Component({
  tag: 'q-radio-group',
  styleUrl: 'radio-group.css',
  shadow: {
    delegatesFocus: true,
  },
  formAssociated: true,
})
export class QRadioGroup {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  @Prop() label?: string;
  /** Options to render; strings use the same text for label and value. */
  @Prop() options: RadioGroupOptionInput[] | string = [];
  @Prop({ mutable: true }) value: string = '';

  @Prop({ reflect: true }) size: QRadioGroupSize = 'md';
  /** `responsive` stacks the connected options below 680px. */
  @Prop({ reflect: true }) orientation: QRadioGroupOrientation = 'responsive';

  @Prop({ reflect: true }) disabled: boolean = false;

  @Prop({ reflect: true }) required: boolean = false;
  /** Validation error text or error-state flag. */
  @Prop({ reflect: true }) error?: string;
  /** Validation helper text displayed when the group is in an error state. */
  @Prop() errorMessage?: string;

  @Prop({ reflect: true }) name?: string;

  /** Accessible group name used when no visible label is supplied. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  /** Emitted with the selected option value when selection changes. */
  @Event() qChange!: EventEmitter<string>;

  @Event() qFocus!: EventEmitter<FocusEvent>;

  @Event() qBlur!: EventEmitter<FocusEvent>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private readonly internalName = `q-radio-group-${++nextRadioGroupId}`;
  private initialValue: string = '';
  private fieldsetEl?: HTMLFieldSetElement;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  @Watch('value')
  watchValue() {
    this.syncFormState();
  }

  @Watch('options')
  @Watch('disabled')
  @Watch('required')
  @Watch('error')
  @Watch('errorMessage')
  watchConstraints() {
    this.syncFormState();
  }

  componentWillLoad() {
    this.initialValue = this.value;
    this.syncFormState();
  }

  componentDidRender() {
    this.syncFormState();
  }

  formResetCallback() {
    this.value = this.initialValue;
    this.syncFormState();
  }

  // ============================ [4] EXPOSED METHODS ============================

  /** Focuses the selected option, or the first enabled option when nothing is selected. */
  @Method()
  async focusElement(): Promise<void> {
    const inputs = this.getInputs();
    (inputs.find(input => input.checked && !input.disabled) ?? inputs.find(input => !input.disabled))?.focus();
  }

  /** Returns whether the group satisfies its required and custom-error constraints. */
  @Method()
  async checkValidity(): Promise<boolean> {
    this.syncFormState();
    if (typeof this.internals?.checkValidity === 'function') {
      return this.internals.checkValidity();
    }
    return this.isValid();
  }

  /** Reports group validity and returns whether the current selection is valid. */
  @Method()
  async reportValidity(): Promise<boolean> {
    this.syncFormState();
    if (typeof this.internals?.reportValidity === 'function') {
      return this.internals.reportValidity();
    }
    return this.isValid();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private getOptions(): RadioGroupOption[] {
    return getRadioGroupOptions(this.options);
  }

  private getSelectedOption(options = this.getOptions()): RadioGroupOption | undefined {
    return options.find(option => option.value === this.value && !option.disabled);
  }

  private getInputs(): HTMLInputElement[] {
    return Array.from(this.el.shadowRoot?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []);
  }

  private isValid(): boolean {
    if (this.disabled) return true;
    if ((this.error || this.errorMessage)?.trim()) return false;
    return !this.required || this.getSelectedOption() !== undefined;
  }

  private syncFormState(): void {
    if (!this.internals) return;

    const selectedOption = this.getSelectedOption();
    if (typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(this.disabled || !selectedOption ? null : selectedOption.value);
    }

    if (typeof this.internals.setValidity !== 'function') return;

    if (this.disabled) {
      this.internals.setValidity({});
      return;
    }

    const customError = (this.error || this.errorMessage)?.trim();
    if (customError) {
      this.internals.setValidity({ customError: true }, customError, this.getValidityAnchor());
      return;
    }

    if (this.required && !selectedOption) {
      this.internals.setValidity(
        { valueMissing: true },
        'Please select an option to continue.',
        this.getValidityAnchor(),
      );
      return;
    }

    this.internals.setValidity({});
  }

  private getValidityAnchor(): HTMLElement | undefined {
    return this.getInputs().find(input => input.checked && !input.disabled)
      ?? this.getInputs().find(input => !input.disabled)
      ?? this.fieldsetEl;
  }

  private handleChange = (event: Event) => {
    if (this.disabled) return;

    const input = event.target as HTMLInputElement;
    const option = this.getOptions().find(candidate => candidate.value === input.value);
    if (!option || option.disabled || option.value === this.value) return;

    this.value = option.value;
    this.qChange.emit(option.value);
  };

  private handleFocus = (event: FocusEvent) => {
    this.qFocus.emit(event);
  };

  private handleBlur = (event: FocusEvent) => {
    this.qBlur.emit(event);
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const options = this.getOptions();
    const identifiedOptions = identifyItems(options, option => option.value, {
      warningContext: 'q-radio-group options',
    });
    const displayError = this.error || this.errorMessage;
    const hasError = !!displayError;
    const ariaLabel = this.ariaLabel?.trim() || undefined;
    const radioName = this.name || this.internalName;

    return (
      <div
        class={{
          'radio-group': true,
          'is-disabled': this.disabled,
          'has-error': hasError,
          [`size-${this.size}`]: true,
          [`orientation-${this.orientation}`]: true,
        }}
      >
        <fieldset
          ref={element => (this.fieldsetEl = element)}
          class="group-fieldset"
          part="group"
          disabled={this.disabled}
          role="radiogroup"
          aria-label={!this.label ? ariaLabel : undefined}
          aria-required={this.required ? 'true' : 'false'}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? 'q-radio-group-error' : undefined}
        >
          {this.label && <legend part="label">{this.label}</legend>}

          <div
            class="options"
            part="options"
            style={{ '--q-radio-group-option-count': String(Math.max(identifiedOptions.length, 1)) }}
          >
            {identifiedOptions.map(({ item: option, key }) => (
              <label
                key={key}
                class={{
                  option: true,
                  'is-selected': option.value === this.value,
                  'is-disabled': this.disabled || option.disabled === true,
                }}
                part="option"
              >
                <input
                  type="radio"
                  name={radioName}
                  value={option.value}
                  checked={option.value === this.value}
                  disabled={this.disabled || option.disabled}
                  required={this.required}
                  part="input"
                  onClick={this.handleChange}
                  onInput={this.handleChange}
                  onChange={this.handleChange}
                  onFocus={this.handleFocus}
                  onBlur={this.handleBlur}
                />
                {option.icon && (
                  <q-icon
                    name={option.icon}
                    size={this.size === 'sm' ? '14' : this.size === 'lg' ? '18' : '16'}
                    part="option-icon"
                    class="option-icon"
                  />
                )}
                <span part="option-label">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {hasError && (
          <span id="q-radio-group-error" class="error-msg" part="error-msg">
            {displayError}
          </span>
        )}
      </div>
    );
  }
}
