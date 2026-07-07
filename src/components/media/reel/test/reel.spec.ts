import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-reel', () => {
  const mediaItems = [
    { src: '/one.jpg', label: 'One', video: false, alt: 'First image' },
    { src: '/two.jpg', label: 'Two', video: false, alt: 'Second image' },
    { src: '/three.jpg', label: 'Three', video: false, alt: 'Third image' },
  ];

  async function wait(ms = 30): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitForReady(el: any): Promise<void> {
    if (typeof el.componentOnReady === 'function') {
      await el.componentOnReady();
    } else {
      await wait(50);
    }
  }

  async function createComponent(props: Record<string, any> = {}, items = mediaItems): Promise<{ el: any; thumbnails: any[] }> {
    const el = document.createElement('q-reel') as any;
    Object.assign(el, props);

    const thumbnails = items.map(item => {
      const thumb = document.createElement('q-thumbnail') as any;
      Object.assign(thumb, item);
      el.appendChild(thumb);
      return thumb;
    });

    document.body.appendChild(el);
    await waitForReady(el);
    await Promise.all(thumbnails.map(waitForReady));
    await wait();

    return { el, thumbnails };
  }

  function emitMaximize(thumb: any): void {
    thumb.dispatchEvent(new CustomEvent('qMaximize', {
      bubbles: true,
      composed: true,
      detail: {
        src: thumb.src,
        label: thumb.label,
        video: thumb.video,
        alt: thumb.alt,
        triggerEl: thumb,
      },
    }));
  }

  function dispatchWindowKey(key: string): void {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  }

  function getMediaSrc(el: any): string | null {
    return (el.shadowRoot.querySelector('.lightbox-media') as HTMLElement | null)?.getAttribute('src') || null;
  }

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('does not open the lightbox when lightbox is false', async () => {
    const { el, thumbnails } = await createComponent({ lightbox: false });
    const openHandler = vi.fn();
    el.addEventListener('qLightboxOpen', openHandler);

    emitMaximize(thumbnails[0]);
    await wait();

    expect(openHandler).not.toHaveBeenCalled();
    expect(el.shadowRoot.querySelector('.lightbox-overlay')).toBeNull();
  });

  it('closes on Escape exactly once when the overlay handles the key event', async () => {
    const { el, thumbnails } = await createComponent();
    const closeHandler = vi.fn();
    el.addEventListener('qLightboxClose', closeHandler);
    emitMaximize(thumbnails[0]);
    await wait();

    dispatchWindowKey('Escape');
    await wait();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(el.shadowRoot.querySelector('.lightbox-overlay')).toBeNull();
  });

  it('closes an open lightbox when lightbox is changed to false', async () => {
    const { el, thumbnails } = await createComponent();
    const closeHandler = vi.fn();
    el.addEventListener('qLightboxClose', closeHandler);
    emitMaximize(thumbnails[0]);
    await wait();

    el.lightbox = false;
    await wait();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(el.shadowRoot.querySelector('.lightbox-overlay')).toBeNull();
  });

  it('navigates media with arrow keys and clamps at the ends', async () => {
    const { el, thumbnails } = await createComponent();
    emitMaximize(thumbnails[0]);
    await wait();

    expect(getMediaSrc(el)).toBe('/one.jpg');

    dispatchWindowKey('ArrowRight');
    await wait();
    expect(getMediaSrc(el)).toBe('/two.jpg');

    dispatchWindowKey('ArrowRight');
    await wait();
    expect(getMediaSrc(el)).toBe('/three.jpg');

    dispatchWindowKey('ArrowRight');
    await wait();
    expect(getMediaSrc(el)).toBe('/three.jpg');

    dispatchWindowKey('ArrowLeft');
    await wait();
    expect(getMediaSrc(el)).toBe('/two.jpg');
  });

  it('emits one close event when the close button is clicked', async () => {
    const { el, thumbnails } = await createComponent();
    const closeHandler = vi.fn();
    el.addEventListener('qLightboxClose', closeHandler);
    emitMaximize(thumbnails[0]);
    await wait();

    const closeButton = el.shadowRoot.querySelector('.lightbox-close') as HTMLButtonElement;
    closeButton.click();
    await wait();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(el.shadowRoot.querySelector('.lightbox-overlay')).toBeNull();
  });
});
