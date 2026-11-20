import { h } from '../../dom-factory';
import { activeComponent, activeTab, componentRegistry, effect, fetchComponentSpec, specErrors, updateKnobValue } from '../../state';
import { resolveExample } from '../../examples/example';
import { mountExample } from '../../examples/mount';
import { PlaygroundEventLog } from '../playground-event-log/playground-event-log';
import { PlaygroundCodePreview } from '../playground-code-preview/playground-code-preview';

export class SandboxPanel extends HTMLElement {
  private cleanup?: () => void;
  private preview?: ReturnType<typeof mountExample>;

  connectedCallback() {
    const stage = <div class="stage-container" />;
    const controls = <div class="demo-actions" hidden />;
    const log = new PlaygroundEventLog();
    const code = new PlaygroundCodePreview();
    const panels = <div class="sandbox-bottom-panels">{log}{code}</div>;
    const description = <p class="demo-description" hidden />;
    this.replaceChildren(<div class="sandbox-layout"><div class="sandbox-main">{description}{stage}{controls}{panels}</div></div>);

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
        log.clear();
      }
      panels.hidden = !visible || !spec;
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
        this.preview = mountExample(stage, controls, example, event => log.record(event),
          (key, value) => updateKnobValue('prop', key, value, tag));
      }
      code.show(example);
    });
  }

  disconnectedCallback() {
    this.cleanup?.();
    this.preview?.dispose();
    this.preview = undefined;
  }
}

customElements.define('sandbox-panel', SandboxPanel);
