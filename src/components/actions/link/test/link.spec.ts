import { expect, describe, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

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

  it('prefers href over url and url over tel', async () => {
    const hrefEl = await createComponent({ href: '/primary', url: '/secondary', tel: '+15551234567' });
    const hrefAnchor = hrefEl.shadowRoot.querySelector('a') as HTMLAnchorElement;
    const urlEl = await createComponent({ url: '/secondary', tel: '+15551234567' });
    const urlAnchor = urlEl.shadowRoot.querySelector('a') as HTMLAnchorElement;

    expect(hrefAnchor.getAttribute('href')).toBe('/primary');
    expect(urlAnchor.getAttribute('href')).toBe('/secondary');
    hrefEl.remove();
    urlEl.remove();
  });

  it('adds noopener noreferrer for blank targets and external links', async () => {
    const blankEl = await createComponent({ href: 'https://example.com', target: '_blank' });
    const blankAnchor = blankEl.shadowRoot.querySelector('a') as HTMLAnchorElement;
    const externalEl = await createComponent({ href: 'https://example.com', external: true });
    const externalAnchor = externalEl.shadowRoot.querySelector('a') as HTMLAnchorElement;

    expect(blankAnchor.getAttribute('rel')).toBe('noopener noreferrer');
    expect(externalAnchor.getAttribute('rel')).toBe('noopener noreferrer');
    blankEl.remove();
    externalEl.remove();
  });

  it('keeps explicit rel values', async () => {
    const el = await createComponent({ href: 'https://example.com', target: '_blank', rel: 'nofollow' });
    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;

    expect(anchor.getAttribute('rel')).toBe('nofollow');
    el.remove();
  });

  it('renders an accessible external-link cue', async () => {
    const blankEl = await createComponent({ href: 'https://example.com', target: '_blank', label: 'Docs' });
    const blankCue = blankEl.shadowRoot.querySelector('.visually-hidden') as HTMLElement;
    const externalEl = await createComponent({ href: 'https://example.com', external: true, label: 'Vendor' });
    const externalCue = externalEl.shadowRoot.querySelector('.visually-hidden') as HTMLElement;

    expect(blankEl.shadowRoot.querySelector('.external-icon')).toBeTruthy();
    expect(blankCue.textContent).toContain('opens in new tab');
    expect(externalCue.textContent).toContain('external link');
    blankEl.remove();
    externalEl.remove();
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

  it('emits qFocus and qBlur from the anchor', async () => {
    const el = await createComponent({ href: '/docs' });
    const focusHandler = vi.fn();
    const blurHandler = vi.fn();
    el.addEventListener('qFocus', focusHandler);
    el.addEventListener('qBlur', blurHandler);
    const anchor = el.shadowRoot.querySelector('a') as HTMLAnchorElement;

    anchor.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    anchor.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(focusHandler).toHaveBeenCalledTimes(1);
    expect(blurHandler).toHaveBeenCalledTimes(1);
    el.remove();
  });
});
