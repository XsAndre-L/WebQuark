import { expect, describe, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-step-diagram', () => {
  async function createComponent(props: Record<string, any> = {}, html = ''): Promise<any> {
    const el = document.createElement('q-step-diagram');
    Object.assign(el, props);
    el.innerHTML = html;
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  it('renders the default vertical layout with list semantics', async () => {
    const el = await createComponent();
    const root = el.shadowRoot.querySelector('.step-diagram') as HTMLElement;

    expect(el.getAttribute('layout')).toBe('vertical');
    expect(root.classList.contains('layout-vertical')).toBe(true);
    expect(root.getAttribute('role')).toBe('list');
    expect(root.getAttribute('aria-label')).toBe('Steps');
    el.remove();
  });

  it('updates layout classes and propagates layout to slotted step items', async () => {
    const el = await createComponent({}, '<q-step-diagram-item></q-step-diagram-item>');
    const child = el.querySelector('q-step-diagram-item') as any;

    el.layout = 'horizontal';
    await wait(20);

    expect(el.getAttribute('layout')).toBe('horizontal');
    expect(el.shadowRoot.querySelector('.step-diagram')?.classList.contains('layout-horizontal')).toBe(true);
    expect(child.layout).toBe('horizontal');
    el.remove();
  });

  it('applies the current layout to children added after initial load', async () => {
    const el = await createComponent({ layout: 'horizontal' });
    const child = document.createElement('q-step-diagram-item') as any;

    el.appendChild(child);
    el.shadowRoot.querySelector('slot')?.dispatchEvent(new Event('slotchange'));
    await wait(20);

    expect(child.layout).toBe('horizontal');
    el.remove();
  });
});
