import { expect, describe, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
import { normalizeCardElevation, shouldActivateCardFromKey } from '../card.utils';

defineCustomElements();

describe('q-card', () => {
  async function createComponent(props: Record<string, any> = {}, children: HTMLElement[] = []): Promise<any> {
    const el = document.createElement('q-card');
    Object.assign(el, props);
    children.forEach(child => el.appendChild(child));
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await wait(50);
    }
    await wait();
    return el;
  }

  function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  it('renders body content without interactive semantics by default', async () => {
    const child = document.createElement('span');
    child.textContent = 'Body';
    const el = await createComponent({}, [child]);
    const container = el.shadowRoot.querySelector('.card-container') as HTMLElement;

    expect(container).not.toBeNull();
    expect(container.getAttribute('role')).toBeNull();
    expect(container.hasAttribute('tabindex')).toBe(false);
    expect(el.shadowRoot.querySelector('[part="body"]')).not.toBeNull();

    el.remove();
  });

  it('adds button semantics only when interactive', async () => {
    const el = await createComponent({ interactive: true });
    const container = el.shadowRoot.querySelector('.card-container') as HTMLElement;

    expect(container.getAttribute('role')).toBe('button');
    expect(container.getAttribute('tabindex')).toBe('0');

    el.remove();
  });

  it('normalizes legacy numeric elevation values to semantic classes', async () => {
    expect(normalizeCardElevation(1)).toBe('low');
    expect(normalizeCardElevation(2)).toBe('medium');
    expect(normalizeCardElevation(3)).toBe('high');
    expect(normalizeCardElevation('high')).toBe('high');

    const el = await createComponent({ elevation: 1 });
    const container = el.shadowRoot.querySelector('.card-container') as HTMLElement;

    expect(container.classList.contains('elevation-low')).toBe(true);
    expect(container.classList.contains('elevation-1')).toBe(false);

    el.remove();
  });

  it('guards keyboard activation to events originating on the card container', () => {
    const currentTarget = document.createElement('div');
    const nestedTarget = document.createElement('button');

    expect(shouldActivateCardFromKey(true, 'Enter', currentTarget, currentTarget)).toBe(true);
    expect(shouldActivateCardFromKey(true, ' ', currentTarget, currentTarget)).toBe(true);
    expect(shouldActivateCardFromKey(true, 'Enter', nestedTarget, currentTarget)).toBe(false);
    expect(shouldActivateCardFromKey(false, 'Enter', currentTarget, currentTarget)).toBe(false);
    expect(shouldActivateCardFromKey(true, 'Escape', currentTarget, currentTarget)).toBe(false);
  });

  it('keeps header slot mounted and hidden when no header is present', async () => {
    const el = await createComponent();
    const header = el.shadowRoot.querySelector('.card-header') as HTMLElement;

    expect(header).not.toBeNull();
    expect(header.classList.contains('is-hidden')).toBe(true);
    expect(header.querySelector('slot[name="header"]')).not.toBeNull();

    el.remove();
  });
});
