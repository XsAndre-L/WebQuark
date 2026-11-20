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
    const commit = (value: string) => updateKnobValue('slot', slotName, value, this.activeComponentTag);
    const input = (event: CustomEvent<string>) => commit(event.detail);

    const resetLabel = slotName === 'default' ? 'Reset default content' : `Reset ${slotName} slot`;
    const resetAction = createResetAction(resetLabel, () => {
      const value = slotConfig.default ?? '';
      this.control.value = value;
      commit(value);
    });

    const hasToolbar = slotConfig.type === 'html';
    this.control = hasToolbar
      ? <q-syntax-box editable language="html" aria-label={name} height="110px" onQInput={input} />
      : slotConfig.type === 'textarea'
        ? <q-textarea rows={4} aria-label={name} width="full" onQInput={input} />
        : <q-input aria-label={name} width="full" onQInput={input} />;
    this.control.dataset.slot = slotName;

    if (hasToolbar) {
      resetAction.slot = 'actions';
      this.control.append(resetAction);
    }

    this.className = 'property-row vertical';
    this.replaceChildren(
      <div class="slot-editor-heading">
        <div class="property-meta">
          <span class="property-label">{name}</span>
          <span class="property-label-sub">{slotConfig.desc ?? slotConfig.description}</span>
        </div>
        {!hasToolbar && resetAction}
      </div>,
      this.control,
    );
    this.sync(slotConfig.currentValue);
  }

  sync(value?: string): void {
    if (!this.control.matches(':focus-within') && this.control.value !== (value ?? '')) this.control.value = value ?? '';
  }
}

customElements.define('slot-row', SlotRow);
