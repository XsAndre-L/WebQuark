import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../../packages/browser/components/dist/loader';

defineCustomElements();

describe('q-avatar', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function createComponent(props: Record<string, unknown> = {}): Promise<any> {
    const element = document.createElement('q-avatar');
    Object.assign(element, props);
    document.body.appendChild(element);
    await (element as any).componentOnReady();
    return element;
  }

  it('derives two-character fallback initials and an accessible name from name', async () => {
    const element = await createComponent({ name: 'Maya Dlamini' });
    const container = element.shadowRoot.querySelector('[part="container"]') as HTMLElement;
    const fallback = element.shadowRoot.querySelector('[part="fallback"]') as HTMLElement;

    expect(container.getAttribute('role')).toBe('img');
    expect(container.getAttribute('aria-label')).toBe('Maya Dlamini');
    expect(fallback.textContent?.trim()).toBe('MD');
  });

  it('supports an explicitly decorative avatar', async () => {
    const element = await createComponent({ name: 'Maya Dlamini', alt: '' });
    const container = element.shadowRoot.querySelector('[part="container"]') as HTMLElement;

    expect(container.getAttribute('role')).toBeNull();
    expect(container.getAttribute('aria-hidden')).toBe('true');
  });

  it('falls back and emits qError when the image fails', async () => {
    const element = await createComponent({ src: '/missing.png', name: 'Theo' });
    const handler = vi.fn();
    element.addEventListener('qError', handler);
    const image = element.shadowRoot.querySelector('img') as HTMLImageElement;

    image.dispatchEvent(new Event('error'));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(element.shadowRoot.querySelector('img')).toBeNull();
    expect(element.shadowRoot.querySelector('[part="fallback"]')?.textContent?.trim()).toBe('TH');
  });

  it('does not disclose the embedding page when loading remote avatars', async () => {
    const element = await createComponent({ src: 'https://media.example/avatar.jpg', name: 'Maya' });
    const image = element.shadowRoot.querySelector('img') as HTMLImageElement;

    expect(image.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('uses a custom CSS size without changing semantic shape', async () => {
    const element = await createComponent({ size: '3rem', shape: 'rounded' });
    const container = element.shadowRoot.querySelector('[part="container"]') as HTMLElement;

    expect(element.style.getPropertyValue('--q-avatar-resolved-size')).toBe('3rem');
    expect(container.classList.contains('size-custom')).toBe(true);
    expect(element.getAttribute('shape')).toBe('rounded');
  });
});
