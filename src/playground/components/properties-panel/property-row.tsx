import { h } from '../../dom-factory';
import { PropSpec, updateKnobValue } from '../../state';
import { contracts } from '../../examples/example';

type Editor = HTMLElement & { value?: string; checked?: boolean; options?: { label: string; value: string }[] };

const jsonEditors = new Set(['json', 'array', 'object', 'string-or-number']);

export class PropertyRow extends HTMLElement {
  propName!: string;
  prop!: PropSpec;
  activeComponentTag!: string;
  private control!: Editor;
  private error!: HTMLElement;
  private invalidDraft = false;

  connectedCallback(): void {
    const { propName, prop } = this;
    const description = (prop.desc ?? prop.description)?.trim();
    const required = contracts[this.activeComponentTag].requiredProps.includes(propName);
    this.className = 'property-row';
    this.error = <span class="property-error" role="status" />;
    this.control = this.createControl(required ? `${propName} (required)` : propName);
    this.control.dataset.prop = propName;

    this.replaceChildren(
      <span class="property-label" tabIndex={description ? 0 : undefined}>
        {propName}
        {required && <span aria-hidden="true">*</span>}
        {description && <q-tooltip content={description} position="top" />}
      </span>,
      <div class="property-control-container">
        {this.control}
      </div>,
      this.error,
    );
    this.sync(prop.currentValue);
  }

  private createControl(label: string): Editor {
    const { prop } = this;
    if (prop.type === 'boolean') {
      return <q-toggle type="switch" size="sm" label={label} labelHidden={true}
        onQChange={(event: CustomEvent<boolean>) => this.restore(event.detail)} />;
    }
    if (prop.type === 'select' || prop.type === 'callback') {
      const options = prop.options ?? [];
      const dropdown = <q-dropdown size="sm" width="full" aria-label={label}
        onQChange={(event: CustomEvent<string>) => {
          const choice = options.find(option => String(option) === event.detail);
          this.restore(choice);
        }} /> as Editor;
      dropdown.options = [
        { label: '(omitted)', value: '__playground_omitted__' },
        ...options.map(option => ({ label: String(option) || '(empty)', value: String(option) })),
      ];
      return dropdown;
    }

    const input = (event: CustomEvent<string>) => this.edit(event.detail);
    if (jsonEditors.has(prop.type) || prop.type === 'textarea' || prop.type === 'html') {
      return <q-textarea rows={4} width="full" aria-label={label} onQInput={input} />;
    }
    return <q-input type={prop.type === 'number' ? 'number' : 'text'} size="sm" width="full"
      aria-label={label} min={prop.min} max={prop.max} step={prop.step} onQInput={input} />;
  }

  private edit(raw: string): void {
    const { type, min, max } = this.prop;
    let value: unknown = raw;
    let error = '';

    if (type === 'number') {
      value = raw.trim() === '' ? undefined : Number(raw);
      if (typeof value === 'number' && (!Number.isFinite(value) ||
        (min !== undefined && value < min) || (max !== undefined && value > max))) {
        error = 'Enter a number within the allowed range.';
      }
    }

    if (jsonEditors.has(type)) {
      try {
        value = raw.trim() ? JSON.parse(raw) : undefined;
        if (value !== undefined && type === 'string-or-number' && typeof value !== 'string' && !(typeof value === 'number' && Number.isFinite(value))) {
          error = 'Enter a quoted string ID or a finite numeric ID.';
        }
        if (value !== undefined && type === 'array' && !Array.isArray(value)) error = 'Enter a JSON array.';
        if (value !== undefined && type === 'object' && (!value || typeof value !== 'object' || Array.isArray(value))) error = 'Enter a JSON object.';
      } catch {
        error = 'Enter valid JSON to update the example.';
      }
    }

    this.invalidDraft = Boolean(error);
    this.error.textContent = error;
    this.control.setAttribute('aria-invalid', String(this.invalidDraft));
    if (!error) updateKnobValue('prop', this.propName, value, this.activeComponentTag);
  }

  private restore(value: unknown): void {
    this.sync(value, true);
    updateKnobValue('prop', this.propName, value, this.activeComponentTag);
  }

  sync(value: unknown, force = false): void {
    if (force) {
      this.invalidDraft = false;
      this.error.textContent = '';
      this.control.removeAttribute('aria-invalid');
    } else if (this.invalidDraft || this.control.matches(':focus-within')) {
      return;
    }

    if (this.prop.type === 'boolean') {
      this.control.checked = value === undefined
        ? contracts[this.activeComponentTag].defaults[this.propName] === 'true'
        : value === true;
      return;
    }
    const next = value === undefined && this.control.localName === 'q-dropdown'
      ? '__playground_omitted__'
      : jsonEditors.has(this.prop.type) && value !== undefined ? JSON.stringify(value, null, 2) : String(value ?? '');
    if (this.control.value !== next) this.control.value = next;
  }
}

customElements.define('property-row', PropertyRow);
