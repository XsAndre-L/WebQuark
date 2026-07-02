import { expect, describe, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-dialog', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-dialog');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('uses blur as the default backdrop effect', async () => {
    const el = await createComponent();
    const backdrop = el.shadowRoot.querySelector('.dialog-backdrop') as HTMLElement;

    expect(el.backdropEffect).toBe('blur');
    expect(backdrop.classList.contains('effect-blur')).toBe(true);
    el.remove();
  });

  it('supports the solid backdrop effect for Unreal-safe rendering', async () => {
    const el = await createComponent({ backdropEffect: 'solid' });
    const backdrop = el.shadowRoot.querySelector('.dialog-backdrop') as HTMLElement;

    expect(backdrop.classList.contains('effect-solid')).toBe(true);
    el.remove();
  });

  it('falls back to blur for unknown backdrop effects', async () => {
    const el = await createComponent({ backdropEffect: 'invalid' });
    const backdrop = el.shadowRoot.querySelector('.dialog-backdrop') as HTMLElement;

    expect(backdrop.classList.contains('effect-blur')).toBe(true);
    el.remove();
  });
});
