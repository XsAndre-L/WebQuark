import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../dist/loader';

defineCustomElements();

describe('q-link', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-link');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('resolves mailto links', async () => {
    const el = await createComponent({ mailto: 'team@example.com', label: 'Email' });
    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe('mailto:team@example.com');
    el.remove();
  });

  it('blocks click events when disabled', async () => {
    const el = await createComponent({ href: '/docs', disabled: true });
    const handler = vi.fn();
    el.addEventListener('qClick', handler);

    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;
    anchor.click();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).not.toHaveBeenCalled();
    expect(anchor.getAttribute('href')).toBeNull();
    el.remove();
  });
});