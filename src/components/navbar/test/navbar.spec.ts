import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../dist/loader';

defineCustomElements();

describe('q-navbar', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-navbar');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('renders configured navigation items', async () => {
    const el = await createComponent({
      items: [{ label: 'Docs', value: 'docs' }],
    });
    expect(el.shadowRoot.textContent).toContain('Docs');
    el.remove();
  });

  it('emits qSelect when an item is clicked', async () => {
    const el = await createComponent({
      items: [{ label: 'Docs', value: 'docs' }],
    });
    const handler = vi.fn();
    el.addEventListener('qSelect', handler);

    const item = el.shadowRoot.querySelector('.nav-item') as HTMLElement;
    item.click();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.value).toBe('docs');
    el.remove();
  });
});