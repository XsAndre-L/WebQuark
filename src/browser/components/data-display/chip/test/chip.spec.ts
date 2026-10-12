import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';
// @ts-ignore
import { QChip as QChipElement } from '../../../../../../packages/browser/components/dist/components/q-chip.js';

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

  it('renders a neutral span chip by default', async () => {
    const el = await createComponent({ label: 'Draft' });
    const chip = el.shadowRoot.querySelector('span.chip') as HTMLSpanElement;

    expect(chip).toBeTruthy();
    expect(chip.classList.contains('variant-neutral')).toBe(true);
    expect(chip.classList.contains('size-md')).toBe(true);
    expect(chip.textContent?.trim()).toBe('Draft');
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

  it('disables the remove button and suppresses qRemove when disabled', async () => {
    const el = await createComponent({ removable: true, disabled: true, value: 'archived', label: 'Archived' });
    const handler = vi.fn();
    el.addEventListener('qRemove', handler);

    const removeButton = el.shadowRoot.querySelector('.remove-button') as HTMLButtonElement;
    removeButton.click();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(removeButton.hasAttribute('disabled')).toBe(true);
    expect(handler).not.toHaveBeenCalled();
    el.remove();
  });

  it('emits qFocus and qBlur from the interactive chip', async () => {
    const el = await createComponent({ clickable: true, label: 'Focus me' });
    const focusHandler = vi.fn();
    const blurHandler = vi.fn();
    el.addEventListener('qFocus', focusHandler);
    el.addEventListener('qBlur', blurHandler);

    const button = el.shadowRoot.querySelector('button.chip') as HTMLButtonElement;
    button.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    button.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(focusHandler).toHaveBeenCalledTimes(1);
    expect(blurHandler).toHaveBeenCalledTimes(1);
    el.remove();
  });

  it('does not nest a removable chip inside an anchor or button', async () => {
    const el = await createComponent({ href: '/admin/users', clickable: true, removable: true });

    expect(el.shadowRoot.querySelector('span.chip')).toBeTruthy();
    expect(el.shadowRoot.querySelector('a.chip')).toBeNull();
    expect(el.shadowRoot.querySelector('button.chip')).toBeNull();
    el.remove();
  });

  it('keeps selected variant color rules for non-primary variants', async () => {
    const el = await createComponent({ variant: 'success', selected: true, label: 'Synced' });
    const chip = el.shadowRoot.querySelector('.chip') as HTMLElement;
    const styles = String((QChipElement as any).style || '');

    expect(chip.classList.contains('variant-success')).toBe(true);
    expect(chip.classList.contains('is-selected')).toBe(true);
    expect(styles).toContain('.variant-success.is-selected');
    el.remove();
  });
});
