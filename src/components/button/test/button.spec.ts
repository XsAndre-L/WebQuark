import { expect, describe, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../dist/loader';

defineCustomElements();

describe('q-button', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-button');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('adds noopener noreferrer for blank link buttons by default', async () => {
    const el = await createComponent({ href: 'https://example.com', target: '_blank' });
    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;

    expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    el.remove();
  });

  it('keeps an explicit rel value for link buttons', async () => {
    const el = await createComponent({ href: 'https://example.com', target: '_blank', rel: 'nofollow' });
    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;

    expect(anchor.getAttribute('rel')).toBe('nofollow');
    el.remove();
  });
});
