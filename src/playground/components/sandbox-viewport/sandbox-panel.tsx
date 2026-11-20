import { h } from '../../dom-factory';
import { activeComponent, activeTab, componentRegistry, effect, fetchComponentSpec, specErrors, updateKnobValue } from '../../state';
import { resolveExample } from '../../examples/example';
import { mountExample } from '../../examples/mount';
import { ExampleOutput } from './example-output';

export class SandboxPanel extends HTMLElement {
  private cleanup?: () => void;
  private preview?: ReturnType<typeof mountExample>;

  connectedCallback() {
    const stage = <div class="stage-container" />;
    const controls = <div class="demo-actions" hidden />;
    const output = new ExampleOutput();
    const description = <p class="demo-description" hidden />;
    this.replaceChildren(<div class="sandbox-layout"><div class="sandbox-main">{description}{stage}{controls}{output.element}</div></div>);

    let mountedTag = '';
    this.cleanup = effect(() => {
      const tag = activeComponent();
      const spec = componentRegistry()[tag];
      const visible = activeTab() === 'sandbox' && tag !== 'global-styling';

      if (!visible || !spec || mountedTag !== tag) {
        this.preview?.dispose();
        this.preview = undefined;
        mountedTag = '';
        stage.replaceChildren();
        output.reset();
      }
      output.element.hidden = !visible || !spec;
      description.textContent = spec?.description || '';
      description.hidden = !visible || !description.textContent;
      if (!visible) return;
      if (!spec) {
        const error = specErrors()[tag];
        stage.textContent = error ? 'Could not load ' + tag + '. ' : 'Loading ' + tag + '…';
        if (error) stage.append(<q-button type="button" size="sm" onClick={() => fetchComponentSpec(tag)}>Retry</q-button>);
        return;
      }

      const example = resolveExample(spec);
      if (this.preview) this.preview.update(example);
      else {
        mountedTag = tag;
        this.preview = mountExample(stage, controls, example, event => output.record(event),
          (key, value) => updateKnobValue('prop', key, value, tag));
      }
      void output.show(example);
    });
  }

  disconnectedCallback() {
    this.cleanup?.();
    this.preview?.dispose();
    this.preview = undefined;
  }
}

customElements.define('sandbox-panel', SandboxPanel);
