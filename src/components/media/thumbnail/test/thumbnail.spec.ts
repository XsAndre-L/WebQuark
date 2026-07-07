import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';
// @ts-ignore
import { QThumbnail as QThumbnailElement } from '../../../../../dist/components/q-thumbnail.js';

defineCustomElements();

describe('q-thumbnail', () => {
  async function wait(ms = 20): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async function createComponent(props: Record<string, any> = {}): Promise<any> {
    const el = document.createElement('q-thumbnail');
    Object.assign(el, props);
    document.body.appendChild(el);

    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await wait(50);
    }

    return el;
  }

  function keydownEvent(key: string): KeyboardEvent {
    const event = new Event('keydown', { bubbles: true, cancelable: true }) as KeyboardEvent;
    Object.defineProperty(event, 'key', { value: key });
    return event;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('emits qMaximize with thumbnail details when clicked', async () => {
    const el = await createComponent({
      src: '/media/store.jpg',
      label: 'Store front',
      alt: 'Store exterior',
      video: false,
    });
    const handler = vi.fn();
    el.addEventListener('qMaximize', handler);

    const wrapper = el.shadowRoot.querySelector('.thumb-wrapper') as HTMLElement;
    wrapper.click();
    await wait();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      src: '/media/store.jpg',
      label: 'Store front',
      video: false,
      alt: 'Store exterior',
      triggerEl: el,
    });
  });

  it('activates on Enter and Space while preventing Space page scroll', async () => {
    const instance = new QThumbnailElement() as any;
    const emit = vi.fn();
    instance.src = '/media/video.jpg';
    instance.label = 'Walkthrough';
    instance.alt = 'Video thumbnail';
    instance.video = false;
    instance.qMaximize = { emit };

    const enterEvent = keydownEvent('Enter');
    instance.handleKeyDown(enterEvent);
    const spaceEvent = keydownEvent(' ');
    instance.handleKeyDown(spaceEvent);

    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit.mock.calls[0][0]).toEqual({
      src: '/media/video.jpg',
      label: 'Walkthrough',
      video: false,
      alt: 'Video thumbnail',
      triggerEl: instance,
    });
    expect(enterEvent.defaultPrevented).toBe(true);
    expect(spaceEvent.defaultPrevented).toBe(true);
  });

  it('reflects video and highlighted state into host attributes and classes', async () => {
    const el = await createComponent({ video: true, highlighted: true });
    const wrapper = el.shadowRoot.querySelector('.thumb-wrapper') as HTMLElement;

    expect(el.getAttribute('video')).toBe('');
    expect(el.getAttribute('highlighted')).toBe('');
    expect(wrapper.classList.contains('is-video')).toBe(true);
    expect(wrapper.classList.contains('is-highlighted')).toBe(true);
  });

  it('marks the video play indicator as decorative', async () => {
    const el = await createComponent({ video: true });
    const indicator = el.shadowRoot.querySelector('.video-play-indicator') as HTMLElement;
    const svg = indicator.querySelector('svg') as SVGElement;

    expect(indicator.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses label, then alt, then fallback text for the accessible name', async () => {
    const withLabel = await createComponent({ label: 'Feature video', alt: 'Alt text' });
    const withAlt = await createComponent({ alt: 'Alt only' });
    const fallback = await createComponent();

    expect(withLabel.shadowRoot.querySelector('.thumb-wrapper')?.getAttribute('aria-label')).toBe('Feature video');
    expect(withAlt.shadowRoot.querySelector('.thumb-wrapper')?.getAttribute('aria-label')).toBe('Alt only');
    expect(fallback.shadowRoot.querySelector('.thumb-wrapper')?.getAttribute('aria-label')).toBe('Media item');
  });
});
