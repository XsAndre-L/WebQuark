import { expect, describe, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../dist/loader';

defineCustomElements();

describe('q-panel', () => {
  async function createComponent(props: Record<string, any> = {}, html = ''): Promise<any> {
    const el = document.createElement('q-panel');
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

  it('renders body content', async () => {
    const el = await createComponent({}, '<p>Panel body</p>');
    expect(el.shadowRoot.querySelector('.panel-body')).not.toBeNull();
    expect(el.textContent).toContain('Panel body');
    el.remove();
  });

  it('reveals the header slot when provided', async () => {
    const el = await createComponent({}, '<span slot="header">Header</span>');
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.shadowRoot.querySelector('.panel-header')?.classList.contains('is-hidden')).toBe(false);
    el.remove();
  });
});