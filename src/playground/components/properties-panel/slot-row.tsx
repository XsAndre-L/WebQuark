import { h } from '../../dom-factory';
import { SlotSpec, updateKnobValue } from '../../state';
import { createResetAction } from './reset-action';

export class SlotRow extends HTMLElement {
  slotName!: string;
  slotConfig!: SlotSpec;
  activeComponentTag!: string;
  private control!: HTMLElement & { value?: string };

  connectedCallback(): void {
    const { slotName, slotConfig } = this;
    const name = slotName === 'default' ? 'Default content' : `Slot "${slotName}"`;
    const description = (slotConfig.desc ?? slotConfig.description)?.trim();
    const commit = (value: string) => updateKnobValue('slot', slotName, value, this.activeComponentTag);
    const input = (event: CustomEvent<string>) => commit(event.detail);

    const resetLabel = slotName === 'default' ? 'Reset default content' : `Reset ${slotName} slot`;
    const resetAction = createResetAction(resetLabel, () => {
      const value = slotConfig.default ?? '';
      this.control.value = value;
      commit(value);
    });

    const hasToolbar = slotConfig.type === 'html';
    const label = (
      <span class="property-label" data-theme={hasToolbar ? 'dark' : undefined} tabIndex={description ? 0 : undefined}>
        {name}
        {description && <q-tooltip content={description} position="top" />}
      </span>
    );

    this.control = hasToolbar
      ? <q-syntax-box editable language="html" heading={name} height="110px" onQInput={input} />
      : slotConfig.type === 'textarea'
        ? <q-textarea rows={4} aria-label={name} width="full" onQInput={input} />
        : <q-input aria-label={name} width="full" onQInput={input} />;
    this.control.dataset.slot = slotName;

    this.className = 'property-row vertical';
    if (hasToolbar) {
      label.slot = 'heading';
      resetAction.slot = 'actions';
      this.control.append(label, resetAction);
      this.replaceChildren(this.control);
    } else {
      this.replaceChildren(<div class="slot-editor-heading">{label}{resetAction}</div>, this.control);
    }

    this.sync(slotConfig.currentValue);
  }

  sync(value?: string): void {
    if (!this.control.matches(':focus-within') && this.control.value !== (value ?? '')) this.control.value = value ?? '';
  }
}

customElements.define('slot-row', SlotRow);
