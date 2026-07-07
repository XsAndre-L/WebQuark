import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-chip', () => {
  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-chip');
    Object.assign(el, props);
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('renders an anchor chip when href is supplied', async () => {
    const el = await createComponent({ href: '/admin/users', label: 'Users' });
    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;

    expect(anchor.getAttribute('href')).toBe('/admin/users');
    expect(anchor.textContent?.trim()).toBe('Users');
    el.remove();
  });

  it('adds noopener noreferrer for blank anchor chips by default', async () => {
    const el = await createComponent({ href: 'https://example.com', target: '_blank' });
    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;

    expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
    el.remove();
  });

  it('renders a button chip when clickable is supplied without href', async () => {
    const el = await createComponent({ clickable: true, selected: true, label: 'Active' });
    const button = el.shadowRoot.querySelector('button.chip') as HTMLButtonElement;

    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-pressed')).toBe('true');
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

  it('emits qRemove with the chip value and label', async () => {
    const el = await createComponent({ removable: true, value: 'region-west', label: 'Western Cape' });
    const handler = vi.fn();
    el.addEventListener('qRemove', handler);

    const removeButton = el.shadowRoot.querySelector('.remove-button') as HTMLButtonElement;
    removeButton.click();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      value: 'region-west',
      label: 'Western Cape',
    });
    el.remove();
  });

  it('does not nest a removable chip inside an anchor or button', async () => {
    const el = await createComponent({ href: '/admin/users', clickable: true, removable: true });

    expect(el.shadowRoot.querySelector('span.chip')).toBeTruthy();
    expect(el.shadowRoot.querySelector('a.chip')).toBeNull();
    expect(el.shadowRoot.querySelector('button.chip')).toBeNull();
    el.remove();
  });
});
