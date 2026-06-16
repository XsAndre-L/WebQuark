import { h } from '../../dom-factory';
import { TokenItem } from './token-row';
import './token-row';

export class TokenSection extends HTMLElement {
  public categoryName!: string;
  public tokens!: TokenItem[];

  connectedCallback() {
    if (!this.categoryName || !this.tokens) return;
    this.className = 'theme-section-card';
    this.innerHTML = '';

    this.appendChild(<h3>{this.categoryName}</h3>);

    this.tokens.forEach(token => {
      const row = document.createElement('token-row') as any;
      row.token = token;
      this.appendChild(row);
    });
  }
}

customElements.define('token-section', TokenSection);
