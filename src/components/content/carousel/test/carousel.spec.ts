import { expect, describe, it } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';
import { getCarouselEdgeState, resolveCarouselTargetIndex } from '../carousel.utils';

defineCustomElements();

describe('q-carousel helpers', () => {
  it('wraps target indexes when repeat navigation is enabled', () => {
    expect(resolveCarouselTargetIndex(-1, 3, true)).toBe(3);
    expect(resolveCarouselTargetIndex(4, 3, true)).toBe(0);
    expect(resolveCarouselTargetIndex(2, 3, true)).toBe(2);
  });

  it('rejects out-of-range target indexes when repeat navigation is disabled', () => {
    expect(resolveCarouselTargetIndex(-1, 3, false)).toBeUndefined();
    expect(resolveCarouselTargetIndex(4, 3, false)).toBeUndefined();
    expect(resolveCarouselTargetIndex(2, 3, false)).toBe(2);
  });

  it('uses the configured edge tolerance for scroll boundaries', () => {
    expect(getCarouselEdgeState(4, 0, 100)).toEqual({ isAtStart: true, isAtEnd: false });
    expect(getCarouselEdgeState(96, 0, 100)).toEqual({ isAtStart: false, isAtEnd: true });
    expect(getCarouselEdgeState(50, 0, 100)).toEqual({ isAtStart: false, isAtEnd: false });
  });
});

describe('q-carousel', () => {
  async function createComponent(props: Record<string, any> = {}, html = ''): Promise<any> {
    const el = document.createElement('q-carousel');
    Object.assign(el, props);
    el.innerHTML = html;
    document.body.appendChild(el);
    if (typeof (el as any).componentOnReady === 'function') {
      await (el as any).componentOnReady();
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return el;
  }

  it('renders a labelled carousel viewport', async () => {
    const el = await createComponent({}, '<div>Slide one</div><div>Slide two</div>');
    const viewport = el.shadowRoot.querySelector('.carousel-viewport') as HTMLElement;

    expect(viewport.getAttribute('role')).toBe('group');
    expect(viewport.getAttribute('aria-roledescription')).toBe('carousel');
    expect(viewport.getAttribute('aria-label')).toBe('Carousel content');

    el.remove();
  });

  it('hides arrow buttons when content cannot scroll', async () => {
    const el = await createComponent({ showArrows: true }, '<div>Slide one</div>');
    const arrows = Array.from(el.shadowRoot.querySelectorAll('.arrow-btn')) as HTMLButtonElement[];

    expect(arrows).toHaveLength(0);

    el.remove();
  });
});
