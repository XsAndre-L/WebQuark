import { h } from '../../dom-factory';
import { convertToHex } from '../../utils';

export interface TokenItem {
  name: string;
  label: string;
  type: 'color' | 'radius';
  desc: string;
  min?: number;
  max?: number;
}

export class TokenRow extends HTMLElement {
  public token!: TokenItem;

  public syncValue(): void {
    const computedStyle = window.getComputedStyle(document.documentElement);
    const val = computedStyle.getPropertyValue(this.token.name).trim();

    if (this.token.type === 'color') {
      const hexVal = convertToHex(val);
      const picker = this.querySelector('.color-swatch-picker') as HTMLInputElement | null;
      const textInput = this.querySelector('.color-text-input') as HTMLInputElement | null;
      if (picker) picker.value = hexVal;
      if (textInput) textInput.value = hexVal;
    } else if (this.token.type === 'radius') {
      const numVal = parseInt(val, 10) || 0;
      const slider = this.querySelector('.range-slider-input') as HTMLInputElement | null;
      const display = this.querySelector('.range-slider-value') as HTMLElement | null;
      if (slider) slider.value = String(numVal);
      if (display) display.innerText = `${numVal}px`;
    }
  }

  connectedCallback() {
    if (!this.token) return;
    this.className = 'token-row';
    this.innerHTML = '';

    const computedStyle = window.getComputedStyle(document.documentElement);
    const val = computedStyle.getPropertyValue(this.token.name).trim();
    let control: HTMLElement;

    if (this.token.type === 'color') {
      const hexVal = convertToHex(val);

      const picker = (
        <input
          type="color"
          class="color-swatch-picker"
          data-token={this.token.name}
          value={hexVal}
          onInput={(e: Event) => {
            const target = e.target as HTMLInputElement;
            const textInput = this.querySelector('.color-text-input') as HTMLInputElement | null;
            if (textInput) textInput.value = target.value;
            document.documentElement.style.setProperty(this.token.name, target.value);
          }}
        />
      ) as HTMLInputElement;

      const textInput = (
        <input
          type="text"
          class="color-text-input"
          data-token={this.token.name}
          value={hexVal}
          onInput={(e: Event) => {
            const target = e.target as HTMLInputElement;
            const newColor = target.value;
            if (/^#[0-9A-F]{6}$/i.test(newColor)) {
              const pickerEl = this.querySelector('.color-swatch-picker') as HTMLInputElement | null;
              if (pickerEl) pickerEl.value = newColor;
              document.documentElement.style.setProperty(this.token.name, newColor);
            }
          }}
        />
      ) as HTMLInputElement;

      control = (
        <div class="color-input-container">
          <div class="color-picker-wrapper">{picker}</div>
          {textInput}
        </div>
      );
    } else {
      const numVal = parseInt(val, 10) || 0;

      const valDisplay = (
        <span class="range-slider-value" data-token={this.token.name}>
          {numVal}px
        </span>
      ) as HTMLElement;

      const slider = (
        <input
          type="range"
          class="range-slider-input"
          min={String(this.token.min ?? 0)}
          max={String(this.token.max ?? 40)}
          value={String(numVal)}
          data-token={this.token.name}
          onInput={(e: Event) => {
            const target = e.target as HTMLInputElement;
            valDisplay.innerText = `${target.value}px`;
            document.documentElement.style.setProperty(this.token.name, `${target.value}px`);
          }}
        />
      ) as HTMLInputElement;

      control = (
        <div class="range-slider-container">
          {slider}
          {valDisplay}
        </div>
      );
    }

    this.appendChild(
      <div class="token-info">
        <span class="token-label">{this.token.label}</span>
        <span class="token-desc">{this.token.desc}</span>
      </div>
    );
    this.appendChild(
      <div class="token-control-wrapper">{control}</div>
    );
  }
}

customElements.define('token-row', TokenRow);
