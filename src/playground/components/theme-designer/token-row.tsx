import { h } from '../../dom-factory';
import { convertToHex } from '../../utils';

export interface TokenItem {
  name: string;
  label: string;
  type: 'color' | 'radius' | 'dimension' | 'text';
  desc: string;
  min?: number;
  max?: number;
}

export class TokenRow extends HTMLElement {
  public token!: TokenItem;

  private pixelValue(value: string): number {
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return (parseFloat(value) || 0) * (value.endsWith('rem') ? rootSize : 1);
  }

  public syncValue(): void {
    const computedStyle = window.getComputedStyle(document.documentElement);
    const val = computedStyle.getPropertyValue(this.token.name).trim();

    if (this.token.type === 'text') {
      const input = this.querySelector<HTMLInputElement>('.token-text-input');
      if (input) input.value = val;
    } else if (this.token.type === 'color') {
      const hexVal = convertToHex(val);
      const picker = this.querySelector('.color-swatch-picker') as HTMLInputElement | null;
      const textInput = this.querySelector('.color-text-input') as HTMLInputElement | null;
      if (picker) picker.value = hexVal;
      if (textInput) textInput.value = hexVal;
    } else {
      const numVal = this.pixelValue(val);
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

    if (this.token.type === 'text') {
      control = <input type="text" class="color-text-input token-text-input" aria-label={this.token.label} value={val}
        onChange={(event: Event) => {
          const value = (event.target as HTMLInputElement).value.trim();
          if (value) document.documentElement.style.setProperty(this.token.name, value);
          else document.documentElement.style.removeProperty(this.token.name);
        }} />;
    } else if (this.token.type === 'color') {
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
      const numVal = this.pixelValue(val);

      const valDisplay = (
        <span class="range-slider-value" data-token={this.token.name}>
          {numVal}px
        </span>
      ) as HTMLElement;

      const slider = (
        <input
          type="range"
          step="0.5"
          class="range-slider-input"
          min={String(this.token.min ?? 0)}
          max={String(this.token.max ?? 40)}
          value={String(numVal)}
          data-token={this.token.name}
          onInput={(e: Event) => {
            const target = e.target as HTMLInputElement;
            valDisplay.innerText = `${target.value}px`;
            const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
            document.documentElement.style.setProperty(this.token.name, this.token.type === 'dimension' ? `${Number(target.value) / rootSize}rem` : `${target.value}px`);
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
