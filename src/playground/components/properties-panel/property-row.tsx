import { h } from '../../dom-factory';
import { PropSpec, updateKnobValue } from '../../state';

const CONTROL_FACTORY: Record<string, (propName: string, prop: PropSpec) => HTMLElement> = {
  boolean: (propName, prop) => (
    <q-toggle
      type="switch"
      data-prop={propName}
      checked={prop.currentValue}
      onQChange={(e: CustomEvent) => updateKnobValue('prop', propName, e.detail)}
    />
  ),
  select: (propName, prop) => {
    const options = prop.options ? prop.options.map(opt => ({ label: opt || '(none)', value: opt })) : [];
    const dropdown = (
      <q-dropdown
        data-prop={propName}
        value={prop.currentValue}
        onQChange={(e: CustomEvent) => updateKnobValue('prop', propName, e.detail)}
      />
    ) as any;
    dropdown.options = options;
    return dropdown;
  },
  number: (propName, prop) => (
    <q-input
      type="number"
      data-prop={propName}
      value={prop.currentValue}
      onQInput={(e: CustomEvent) => updateKnobValue('prop', propName, e.detail)}
    />
  ),
};

function createPropControl(propName: string, prop: PropSpec): HTMLElement {
  const factory = CONTROL_FACTORY[prop.type];
  if (factory) return factory(propName, prop);
  return (
    <q-input
      type="text"
      data-prop={propName}
      value={prop.currentValue}
      onQInput={(e: CustomEvent) => updateKnobValue('prop', propName, e.detail)}
    />
  );
}

export class PropertyRow extends HTMLElement {
  public propName!: string;
  public prop!: PropSpec;

  connectedCallback() {
    if (!this.propName || !this.prop) return;
    this.className = 'property-row';
    this.innerHTML = '';
    
    this.appendChild(
      <div class="property-meta">
        <span class="property-label">{this.propName}</span>
        <span class="property-label-sub">{this.prop.description || ''}</span>
      </div>
    );

    this.appendChild(
      <div class="property-control-container">
        {createPropControl(this.propName, this.prop)}
      </div>
    );
  }
}

customElements.define('property-row', PropertyRow);
