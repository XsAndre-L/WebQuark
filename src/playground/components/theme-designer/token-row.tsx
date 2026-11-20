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
  token!: TokenItem;

  private change(value: string): void {
    this.dispatchEvent(new CustomEvent('token-edit', { bubbles: true, detail: { name: this.token.name, value } }));
    this.syncValue();
  }

  syncValue(): void {
    const computed = getComputedStyle(document.documentElement);
    const value = computed.getPropertyValue(this.token.name).trim();
    const text = this.querySelector<HTMLQInputElement>('.token-text-input');
    if (text && text.value !== value) {
      text.value = value;
      text.errorMessage = undefined;
    }

    const picker = this.querySelector<HTMLQInputElement>('.token-color-picker');
    if (picker) {
      const hex = convertToHex(value);
      picker.hidden = !hex;
      if (hex) picker.value = hex;
    }

    const slider = this.querySelector('q-slider');
    if (!slider) return;
    const length = value.match(/^(-?(?:\d+\.?\d*|\.\d+))(rem|px)?$/);
    const pixels = length ? Number(length[1]) * (length[2] === 'rem' ? parseFloat(computed.fontSize) : 1) : NaN;
    slider.disabled = !Number.isFinite(pixels) || pixels < (this.token.min ?? 0) || pixels > (this.token.max ?? 40);
    if (!slider.disabled) slider.value = pixels;
  }

  connectedCallback(): void {
    const { token } = this;
    if (!token) return;
    this.className = 'token-row';
    const editText = (event: CustomEvent<string>) => {
      const input = event.currentTarget as HTMLQInputElement;
      const value = event.detail.trim();
      if (token.type === 'color' && value && !CSS.supports('color', value)) {
        input.errorMessage = 'Enter a valid CSS color.';
        return;
      }

      if ((token.type === 'dimension' || token.type === 'radius') && value && !CSS.supports('width', value)) {
        input.errorMessage = 'Enter a valid CSS length.';
        return;
      }
      input.errorMessage = undefined;
      this.change(value);
    };

    this.replaceChildren(
      <div class="token-info">
        <span class="token-label">{token.label}</span>
        <span class="token-desc">{token.desc}</span>
      </div>,
      <div class="token-control-wrapper">
        <q-input type="text" size="sm" class="token-text-input" aria-label={token.label}
          placeholder="Unset" onQChange={editText} />

        {token.type === 'color' && <q-input type="color" size="sm" class="token-color-picker"
          aria-label={`Pick ${token.label}`} onQInput={(event: CustomEvent<string>) => this.change(event.detail)} />}

        {(token.type === 'dimension' || token.type === 'radius') && <q-slider
          aria-label={`${token.label} in pixels`} min={token.min ?? 0} max={token.max ?? 40} step={0.5} show-value="false"
          onQInput={(event: CustomEvent<number>) => {
            const pixels = event.detail;
            const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
            this.change(token.type === 'dimension' ? `${pixels / rootSize}rem` : `${pixels}px`);
          }} />}
      </div>,
    );
    this.syncValue();
  }
}

customElements.define('token-row', TokenRow);
