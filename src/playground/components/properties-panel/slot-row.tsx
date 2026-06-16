import { h } from '../../dom-factory';
import { SlotSpec, updateKnobValue } from '../../state';

export class SlotRow extends HTMLElement {
  public slotName!: string;
  public slotConfig!: SlotSpec;
  public activeComponentTag!: string;

  connectedCallback() {
    if (!this.slotName || !this.slotConfig) return;
    this.className = 'property-row vertical';
    this.innerHTML = '';

    const labelText = this.slotName === 'default' ? 'default (Inner content)' : `slot="${this.slotName}"`;

    this.appendChild(
      <div class="property-meta">
        <span class="property-label">{labelText}</span>
        <span class="property-label-sub">{this.slotConfig.description || ''}</span>
      </div>
    );

    let inputControl: HTMLElement;
    if (this.activeComponentTag === 'q-data-table' && this.slotName === 'footer') {
      inputControl = (
        <q-syntax-box
          editable={true}
          language="html"
          height="110px"
          data-slot={this.slotName}
          value={this.slotConfig.currentValue}
          onQInput={(e: CustomEvent) => updateKnobValue('slot', this.slotName, e.detail)}
        />
      );
    } else if (this.slotConfig.description && (this.slotConfig.description.includes('textarea') || this.slotConfig.description.includes('html'))) {
      inputControl = (
        <q-textarea
          rows={4}
          data-slot={this.slotName}
          value={this.slotConfig.currentValue}
          onQInput={(e: CustomEvent) => updateKnobValue('slot', this.slotName, e.detail)}
        />
      );
    } else {
      inputControl = (
        <q-input
          type="text"
          data-slot={this.slotName}
          value={this.slotConfig.currentValue}
          onQInput={(e: CustomEvent) => updateKnobValue('slot', this.slotName, e.detail)}
        />
      );
    }

    this.appendChild(inputControl);
  }
}

customElements.define('slot-row', SlotRow);
