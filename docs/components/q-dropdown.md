# 🧩 Component Specification: `q-dropdown`

The `<q-dropdown>` is a custom select dropdown menu. It allows selecting from a list of option objects. To render correctly in Unreal Engine's Off-Screen Rendering (OSR) environment, it avoids native HTML select overlays, drawing the menu layout directly inside the Webview canvas using custom HTML elements.

---

## 1. Component API (Properties & Attributes)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `""` | The value of the currently selected option. |
| `label` | `string` | `undefined` | Header label text displayed above the dropdown container. |
| `placeholder` | `string` | `"Select an option..."` | Helper text displayed in the trigger box when no option is selected. |
| `options` | `Option[]` | `[]` | Array of selectable options: `Option { label: string; value: string; }`. |
| `disabled` | `boolean` | `false` | Disables dropdown toggle and locks interactions. |

---

## 2. Events

*   `qChange`: Emitted when the user selects a new option. Passes the selected `value` (`string`) as the event payload (essential for Angular forms integration).
*   `wqSelect`: Emitted simultaneously. Passes the full selected `Option` object (`{ label, value }`) for applications requiring metadata.

---

## 3. Visual Variants

The dropdown relies on stateful rendering inside the Shadow DOM to support four visual states:

### Variant A: Standby (Closed)
*   **Behavior**: Renders the toggle trigger box showing the active option label (or the placeholder if empty).
*   **Styling**: Uses `--q-dropdown-bg` for background and `--q-dropdown-border` for borders. Features a trailing chevron icon.

### Variant B: Open (Active Dropdown)
*   **Behavior**: Spawns an absolute-positioned options panel (`<ul>` element) directly below the trigger box. The chevron rotates 180 degrees.
*   **Styling**: The options list container is styled using `--q-dropdown-menu-bg` (maps to Surface-3 so it floats layered on top of other elements) and overlays a shadow (`--q-shadow-medium`).

### Variant C: Active Selection Highlight
*   **Behavior**: When hovering list items, they highlight. The currently active selected item displays with an active checkmark or color shift.
*   **Styling**: Hovering items shifts their background color to `--q-color-primary` (Electric Blue) and text to `--q-bg-base` (dark base).

### Variant D: Disabled State (`disabled="true"`)
*   **Behavior**: Trigger box is grayed out, cursor is blocked, and clicks will not open the options menu.
*   **Styling**: Drops overall opacity to `0.6` and sets cursor to `not-allowed`.

---

## 4. Typography & Font Styles

*   **Global Font Stack**: Inherits `--q-font-family`.
*   **Header Label**:
    *   Font size: `--q-font-size-sm` (e.g., `0.875rem` / `14px`).
    *   Font weight: `--q-font-weight-bold` (e.g., `600`).
    *   Color: `--q-color-secondary` (Slate Gray).
*   **Active Trigger Text & Option Labels**:
    *   Font size: `--q-font-size-base` (e.g., `1rem` / `16px`).
    *   Font weight: `--q-font-weight-normal` (e.g., `400`).
    *   Line-height: `1.2` (centered vertically).
*   **Muted Placeholder**:
    *   Font weight: `--q-font-weight-normal` (`400`).
    *   Color: `--q-color-secondary` (opacity lowered).

---

## 5. CSS Variable Mapping

Below is the complete list of styling tokens mapped to the component's internal CSS:

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-dropdown-bg` | `var(--q-bg-surface-2)` | Trigger box background color. |
| `--q-dropdown-menu-bg` | `var(--q-bg-surface-3)` | Absolute popover options menu background. |
| `--q-dropdown-border` | `var(--q-border)` | Standby border outline definitions. |
| `--q-dropdown-radius` | `var(--q-radius-md)` (8px) | Corner rounding radius for both trigger and list. |
| `--q-color-primary` | `#60a5fa` | Highlight accent color for selected/hovered options. |
| `--q-shadow-medium` | `0 8px 16px rgba(0,0,0,0.3)` | Shadow depth under the opened select menu. |
| `--q-transition-fast` | `150ms ease` | Animation speed for chevron rotation and hover states. |

---

## 6. HTML/TSX Structure (Shadow DOM Layout)

```tsx
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
})
export class QDropdown {
  @Prop({ mutable: true }) value: string = "";
  @Prop() label?: string;
  @Prop() placeholder: string = "Select an option...";
  @Prop() options: Option[] = [];
  @Prop({ reflect: true }) disabled: boolean = false;

  @State() isOpen: boolean = false;
  @State() focusedIndex: number = -1;

  @Event() qChange: EventEmitter<string>;
  @Event() wqSelect: EventEmitter<Option>;

  private elRef?: HTMLElement;
  private triggerEl?: HTMLButtonElement;
  private static idCounter = 0;
  private inputId: string;

  componentWillLoad() {
    if (!this.inputId) {
      QDropdown.idCounter++;
      this.inputId = `q-dropdown-${QDropdown.idCounter}`;
    }
  }

  private toggleMenu = () => {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Focus on active element if it exists, otherwise first element
      const activeIdx = this.options.findIndex(opt => opt.value === this.value);
      this.focusedIndex = activeIdx >= 0 ? activeIdx : 0;
    } else {
      this.focusedIndex = -1;
    }
  };

  private handleSelect = (option: Option) => {
    this.value = option.value;
    this.isOpen = false;
    this.focusedIndex = -1;
    this.qChange.emit(option.value);
    this.wqSelect.emit(option);
    setTimeout(() => this.triggerEl?.focus(), 50);
  };

  private handleKeyDown = (ev: KeyboardEvent) => {
    if (this.disabled) return;

    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        if (!this.isOpen) {
          this.isOpen = true;
          this.focusedIndex = 0;
        } else {
          this.focusedIndex = Math.min(this.focusedIndex + 1, this.options.length - 1);
        }
        break;
      case 'ArrowUp':
        ev.preventDefault();
        if (!this.isOpen) {
          this.isOpen = true;
          this.focusedIndex = this.options.length - 1;
        } else {
          this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        }
        break;
      case 'Enter':
      case ' ':
        ev.preventDefault();
        if (this.isOpen && this.focusedIndex >= 0) {
          this.handleSelect(this.options[this.focusedIndex]);
        } else {
          this.toggleMenu();
        }
        break;
      case 'Escape':
      case 'Tab':
        if (this.isOpen) {
          this.isOpen = false;
          this.focusedIndex = -1;
          if (ev.key === 'Escape') {
            ev.preventDefault();
            this.triggerEl?.focus();
          }
        }
        break;
    }
  };

  // Close dropdown if user clicks outside of the element
  @Listen('click', { target: 'window' })
  handleClickOutside(ev: MouseEvent) {
    const path = ev.composedPath();
    if (this.elRef && !path.includes(this.elRef)) {
      this.isOpen = false;
      this.focusedIndex = -1;
    }
  }

  render() {
    const selectedOption = this.options.find(opt => opt.value === this.value);
    const displayLabel = selectedOption ? selectedOption.label : this.placeholder;
    const hasSelection = selectedOption !== undefined;

    return (
      <div 
        class={{
          'dropdown-wrapper': true,
          'is-open': this.isOpen,
          'is-disabled': this.disabled
        }}
        ref={(el) => (this.elRef = el)}
      >
        {/* Optional Header Label */}
        {this.label && (
          <label class="dropdown-label" htmlFor={`${this.inputId}-trigger`} part="label">
            {this.label}
          </label>
        )}

        {/* Custom Trigger Box (Renders as standard button for click stability) */}
        <button
          ref={(el) => (this.triggerEl = el)}
          id={`${this.inputId}-trigger`}
          class="dropdown-trigger"
          part="trigger"
          type="button"
          disabled={this.disabled}
          onClick={this.toggleMenu}
          onKeyDown={this.handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={this.isOpen ? 'true' : 'false'}
          aria-controls={this.isOpen ? `${this.inputId}-menu` : undefined}
          aria-activedescendant={this.isOpen && this.focusedIndex >= 0 ? `${this.inputId}-item-${this.focusedIndex}` : undefined}
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
            id={`${this.inputId}-menu`}
            class="dropdown-menu" 
            part="menu" 
            role="listbox"
            aria-label={this.label || 'Options'}
          >
            {this.options.map((option, index) => (
              <li
                id={`${this.inputId}-item-${index}`}
                class={{
                  'menu-item': true,
                  'is-selected': option.value === this.value,
                  'is-focused': index === this.focusedIndex
                }}
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
```

---

## 7. Component Styling (`q-dropdown.css`)

```css
:host {
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.dropdown-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

/* Header Label Typography */
.dropdown-label {
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-sm, 0.875rem);
  font-weight: var(--q-font-weight-bold, 700);
  color: var(--q-color-secondary, #9ca3af);
  margin-bottom: 6px;
}

/* Clickable Trigger Box */
.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: var(--q-dropdown-bg, var(--q-bg-surface-2, #374151));
  border: var(--q-dropdown-border, var(--q-border, 1px solid var(--q-border-color, #4b5563)));
  border-radius: var(--q-dropdown-radius, var(--q-radius-md, 8px));
  padding: var(--q-dropdown-padding, var(--q-field-padding, 10px 14px));
  box-sizing: border-box;
  outline: none;
  cursor: pointer;
  
  color: var(--q-fg-base, #f9fafb);
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-base, 1rem);
  font-weight: var(--q-font-weight-normal, 400);
  
  transition: border-color var(--q-transition-fast, 150ms ease), 
              box-shadow var(--q-transition-fast, 150ms ease);
}

.dropdown-trigger:focus-visible {
  border-color: var(--q-color-primary, #60a5fa);
  box-shadow: 0 0 0 1px var(--q-color-primary, #60a5fa);
}

.trigger-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trigger-text.is-placeholder {
  color: var(--q-color-secondary, #9ca3af);
  opacity: 0.8;
}

/* Chevron Icon */
.chevron-icon {
  width: 16px;
  height: 16px;
  color: var(--q-color-secondary, #9ca3af);
  transition: transform var(--q-transition-fast, 150ms ease);
}

.is-open .chevron-icon {
  transform: rotate(180deg);
}

/* Options Dropdown Menu (Overlay List) */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin: 4px 0 0 0;
  padding: 4px 0;
  list-style: none;
  z-index: 1000;
  
  background: var(--q-dropdown-menu-bg, var(--q-bg-surface-3, #4b5563));
  border: var(--q-dropdown-border, var(--q-border, 1px solid var(--q-border-color, #4b5563)));
  border-radius: var(--q-dropdown-radius, var(--q-radius-md, 8px));
  box-shadow: var(--q-shadow-medium, 0 8px 16px rgba(0,0,0,0.3));
  box-sizing: border-box;
}

/* Options Items */
.menu-item {
  padding: 10px 14px;
  cursor: pointer;
  box-sizing: border-box;
  
  font-family: var(--q-font-family, inherit);
  font-size: var(--q-font-size-base, 1rem);
  font-weight: var(--q-font-weight-normal, 400);
  color: var(--q-fg-base, #f9fafb);
  
  transition: background var(--q-transition-fast, 150ms ease), 
              color var(--q-transition-fast, 150ms ease);
}

/* Hover & Selected states mapping */
.menu-item:hover,
.menu-item.is-focused {
  background: var(--q-color-primary, #60a5fa);
  color: var(--q-bg-base, #111827); /* Contrast text color */
  outline: none;
}

.menu-item.is-selected {
  background: color-mix(in srgb, var(--q-color-primary, #60a5fa) 15%, transparent);
  font-weight: var(--q-font-weight-bold, 700);
  border-left: 3px solid var(--q-color-primary, #60a5fa);
  padding-left: 11px; /* Align matching offset padding */
}

/* Disabled State Visuals */
.is-disabled {
  opacity: 0.6;
}
.is-disabled .dropdown-trigger {
  cursor: not-allowed;
  pointer-events: none;
}
```
