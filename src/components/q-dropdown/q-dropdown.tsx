import { Component, Prop, State, Event, EventEmitter, Element, AttachInternals, Watch, Listen, h } from '@stencil/core';

export interface Option {
  label: string;
  value: string;
}

@Component({
  tag: 'q-dropdown',
  styleUrl: 'q-dropdown.css',
  shadow: {
    delegatesFocus: true
  },
  formAssociated: true
})
export class QDropdown {
  @Prop({ mutable: true }) value: string = "";
  @Prop() label?: string;
  @Prop() placeholder: string = "Select an option...";
  @Prop() options: Option[] | string = [];
  @Prop({ reflect: true }) disabled: boolean = false;

  @State() isOpen: boolean = false;
  @State() focusedIndex: number = -1;

  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  @Event() qChange!: EventEmitter<string>;
  @Event() qSelect!: EventEmitter<Option>;

  private triggerEl?: HTMLButtonElement;
  private initialValue: string = "";

  private get parsedOptions(): Option[] {
    if (typeof this.options === 'string') {
      try {
        return JSON.parse(this.options);
      } catch (e) {
        console.error('Failed to parse options JSON string:', e);
        return [];
      }
    }
    return this.options || [];
  }

  @Watch('value')
  watchValue(newValue: string) {
    this.internals.setFormValue(newValue);
  }

  componentWillLoad() {
    this.initialValue = this.value || "";
    this.internals.setFormValue(this.value);
  }

  formResetCallback() {
    this.value = this.initialValue;
    this.internals.setFormValue(this.value);
  }

  private toggleMenu = () => {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      const activeIdx = this.parsedOptions.findIndex(opt => opt.value === this.value);
      const nextIdx = activeIdx >= 0 ? activeIdx : 0;
      this.updateFocusedIndex(nextIdx);
    } else {
      this.focusedIndex = -1;
      requestAnimationFrame(() => this.triggerEl?.focus());
    }
  };

  private handleSelect = (option: Option) => {
    this.value = option.value;
    this.isOpen = false;
    this.focusedIndex = -1;
    this.qChange.emit(option.value);
    this.qSelect.emit(option);
    requestAnimationFrame(() => this.triggerEl?.focus());
  };

  private updateFocusedIndex(index: number) {
    this.focusedIndex = index;
    requestAnimationFrame(() => this.focusCurrentOption());
  }

  private focusCurrentOption() {
    if (this.focusedIndex >= 0 && this.isOpen) {
      const listElement = this.el.shadowRoot?.querySelector(`#q-field-item-${this.focusedIndex}`) as HTMLElement;
      listElement?.focus();
    }
  }

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (this.disabled) return;

    const maxIndex = this.parsedOptions.length - 1;

    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        if (!this.isOpen) {
          this.isOpen = true;
          const activeIdx = this.parsedOptions.findIndex(opt => opt.value === this.value);
          const nextIdx = activeIdx >= 0 ? activeIdx : 0;
          this.updateFocusedIndex(nextIdx);
        } else {
          const nextIdx = Math.min(this.focusedIndex + 1, maxIndex);
          this.updateFocusedIndex(nextIdx);
        }
        break;
      case 'ArrowUp':
        ev.preventDefault();
        if (!this.isOpen) {
          this.isOpen = true;
          const activeIdx = this.parsedOptions.findIndex(opt => opt.value === this.value);
          const nextIdx = activeIdx >= 0 ? activeIdx : maxIndex;
          this.updateFocusedIndex(nextIdx);
        } else {
          const nextIdx = Math.max(this.focusedIndex - 1, 0);
          this.updateFocusedIndex(nextIdx);
        }
        break;
      case 'Home':
        if (this.isOpen) {
          ev.preventDefault();
          this.updateFocusedIndex(0);
        }
        break;
      case 'End':
        if (this.isOpen) {
          ev.preventDefault();
          this.updateFocusedIndex(maxIndex);
        }
        break;
      case 'Enter':
      case ' ':
        ev.preventDefault();
        if (this.isOpen && this.focusedIndex >= 0 && this.focusedIndex < this.parsedOptions.length) {
          this.handleSelect(this.parsedOptions[this.focusedIndex]);
        } else {
          this.toggleMenu();
        }
        break;
      case 'Escape':
        if (this.isOpen) {
          ev.preventDefault();
          this.isOpen = false;
          this.focusedIndex = -1;
          requestAnimationFrame(() => this.triggerEl?.focus());
        }
        break;
      case 'Tab':
        if (this.isOpen) {
          this.isOpen = false;
          this.focusedIndex = -1;
        }
        break;
    }
  };

  // Close dropdown if user clicks outside of the element
  @Listen('click', { target: 'window' })
  handleClickOutside(ev: MouseEvent) {
    const path = ev.composedPath();
    if (this.el && !path.includes(this.el)) {
      this.isOpen = false;
      this.focusedIndex = -1;
    }
  }

  render() {
    const opts = this.parsedOptions;
    const selectedOption = opts.find(opt => opt.value === this.value);
    const displayLabel = selectedOption ? selectedOption.label : this.placeholder;
    const hasSelection = selectedOption !== undefined;

    return (
      <div 
        class={{
          'dropdown-wrapper': true,
          'is-open': this.isOpen,
          'is-disabled': this.disabled
        }}
        onKeyDown={this.handleKeyDown}
      >
        {/* Optional Header Label */}
        {this.label && (
          <label class="dropdown-label" htmlFor="q-field" part="label">
            {this.label}
          </label>
        )}

        {/* Custom Trigger Box (Renders as standard button for click stability) */}
        <button
          ref={(el) => (this.triggerEl = el)}
          id="q-field"
          class="dropdown-trigger"
          part="trigger"
          type="button"
          disabled={this.disabled}
          onClick={this.toggleMenu}
          aria-haspopup="listbox"
          aria-expanded={this.isOpen ? 'true' : 'false'}
          aria-controls={this.isOpen ? 'q-field-menu' : undefined}
          aria-activedescendant={this.isOpen && this.focusedIndex >= 0 ? `q-field-item-${this.focusedIndex}` : undefined}
        >
          <span class={{ 'trigger-text': true, 'is-placeholder': !hasSelection }}>
            {displayLabel}
          </span>
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Options List Menu (Absolute Overlay inside Webview Canvas) */}
        {this.isOpen && (
          <ul 
            id="q-field-menu"
            class="dropdown-menu" 
            part="menu" 
            role="listbox"
            aria-label={this.label || 'Options'}
          >
            {opts.map((option, index) => (
              <li
                id={`q-field-item-${index}`}
                class={{
                  'menu-item': true,
                  'is-selected': option.value === this.value,
                  'is-focused': index === this.focusedIndex
                }}
                tabindex={index === this.focusedIndex ? 0 : -1}
                part={`item ${option.value === this.value ? 'selected-item' : ''} ${index === this.focusedIndex ? 'focused-item' : ''}`}
                role="option"
                aria-selected={option.value === this.value ? 'true' : 'false'}
                onClick={() => this.handleSelect(option)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}
