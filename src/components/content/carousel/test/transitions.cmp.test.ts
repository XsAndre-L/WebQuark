import { afterEach, expect, it, vi } from 'vitest';
import '../carousel';
import carouselStyles from '../carousel.css?inline';
import type { QCarouselLayout } from '../carousel.types';
const frame = async () => { await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); };

afterEach(() => { document.body.innerHTML = ''; });

type CarouselTestElement = Omit<HTMLQCarouselElement, 'showArrows' | 'showIndicators'> & {
  layout: QCarouselLayout;
  showArrows: boolean | undefined;
  showIndicators: boolean | undefined;
  autoplay: boolean;
  autoplayInterval: number;
  autoplaySuspended: boolean;
  ariaLabel: string;
  play(): Promise<void>;
  pause(): Promise<void>;
};
type CarouselTestOptions = Partial<Pick<CarouselTestElement,
  'layout' | 'itemWidth' | 'showArrows' | 'showIndicators' | 'autoplay' | 'autoplayInterval' | 'autoplaySuspended' | 'repeat'
>>;

async function create(transition: 'slide' | 'crossfade' | 'instant' = 'crossfade', parent: HTMLElement | ShadowRoot = document.body, options: CarouselTestOptions = {}) {
  const el = document.createElement('q-carousel') as unknown as CarouselTestElement;
  Object.assign(el, { transition, showArrows: true, showIndicators: true, itemWidth: '100%', transitionDuration: 40, ...options });
  el.style.cssText = 'width:400px;--q-carousel-padding:0;--q-carousel-gap:0';
  el.innerHTML = '<div style="height:100px">First <button>Inside</button></div><div style="height:180px">Second</div><div style="height:120px">Third</div>';
  parent.append(el);
  await frame();
  const style = document.createElement('style');
  style.textContent = carouselStyles;
  el.shadowRoot!.prepend(style);
  await el.updateLimits();
  await frame();
  return el;
}

it('overlays slides at full width, uses tallest height, and shares arrow/dot navigation', async () => {
  const el = await create();
  const slides = Array.from(el.children) as HTMLElement[];
  expect(slides[0].getBoundingClientRect().x).toBe(slides[1].getBoundingClientRect().x);
  expect(slides[0].getBoundingClientRect().width).toBe(400);
  expect(el.shadowRoot!.querySelector('.carousel-viewport')!.getBoundingClientRect().height).toBe(180);
  expect(slides[0].inert).toBe(false);
  expect(slides[1].inert).toBe(true);
  (el.shadowRoot!.querySelector('.arrow-right') as HTMLElement).click();
  await frame();
  expect(slides[1].getAttribute('data-q-carousel-active')).toBe('true');
  expect(el.shadowRoot!.querySelectorAll('.indicator-dot')).toHaveLength(3);
  expect(el.shadowRoot!.querySelectorAll('.indicator-dot')[1].getAttribute('aria-current')).toBe('true');
  await vi.waitFor(() => expect(getComputedStyle(slides[1]).opacity).toBe('1'));
  await vi.waitFor(() => expect(getComputedStyle(slides[0]).opacity).toBe('0'));
});

it('converges on rapid selections, wraps, clamps removals and restores authored attributes', async () => {
  const el = await create();
  el.repeat = true;
  const slides = Array.from(el.children) as HTMLElement[];
  await el.slideTo(1); await el.slideTo(2); await el.slideTo(0); await el.slideTo(-1);
  await frame();
  expect(slides[2].getAttribute('data-q-carousel-active')).toBe('true');
  slides[2].remove();
  await frame();
  expect(slides[1].getAttribute('data-q-carousel-active')).toBe('true');
  expect(slides[2].hasAttribute('aria-hidden')).toBe(false);
  el.transition = 'slide';
  await frame();
  expect(slides[0].hasAttribute('aria-hidden')).toBe(false);
  expect(slides[0].inert).toBe(false);
  expect(getComputedStyle(el.shadowRoot!.querySelector('.carousel-viewport')!).display).toBe('flex');
});

it('instant has no fade; mode changes and disconnects do not leave stale accessibility state', async () => {
  const el = await create('instant');
  const slides = Array.from(el.children) as HTMLElement[];
  await el.slideTo(1);
  await frame();
  expect(getComputedStyle(slides[1]).transitionDuration).toBe('0s');
  expect(getComputedStyle(slides[1]).opacity).toBe('1');
  el.transition = 'crossfade'; el.transitionDuration = 800;
  await frame();
  expect(getComputedStyle(slides[1]).transitionDuration).toBe('0.8s');
  el.remove();
  expect(slides.every(slide => !slide.inert && !slide.hasAttribute('aria-hidden'))).toBe(true);
  document.body.append(el);
  await frame();
  expect(slides[0].inert).toBe(true);
  expect(slides[1].inert).toBe(false);
});

it('moves focus out of a deactivated slide and avoids duplicate keyboard navigation', async () => {
  const el = await create();
  const button = el.querySelector('button')!;
  button.focus();
  await el.slideTo(1);
  expect(el.shadowRoot!.activeElement).toBe(el.shadowRoot!.querySelectorAll('.indicator-dot')[1]);
  const bubbled = vi.fn();
  el.addEventListener('keydown', bubbled);
  el.shadowRoot!.querySelector('.carousel-viewport')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
  await frame();
  expect(el.children[2].getAttribute('data-q-carousel-active')).toBe('true');
  expect(bubbled).not.toHaveBeenCalled();
});

it('accepts horizontal touch gestures but ignores vertical or cancelled gestures', async () => {
  const el = await create();
  const viewport = el.shadowRoot!.querySelector('.carousel-viewport')!;
  const pointer = (type: string, x: number, y: number) => viewport.dispatchEvent(new PointerEvent(type, { pointerId: 1, isPrimary: true, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
  pointer('pointerdown', 200, 50); pointer('pointerup', 100, 55);
  await frame();
  expect(el.children[1].getAttribute('data-q-carousel-active')).toBe('true');
  pointer('pointerdown', 200, 50); pointer('pointerup', 100, 200);
  pointer('pointerdown', 200, 50); pointer('pointercancel', 100, 55); pointer('pointerup', 100, 55);
  await frame();
  expect(el.children[1].getAttribute('data-q-carousel-active')).toBe('true');
});

it('keeps native sliding as the default without overlay attributes', async () => {
  const el = await create('slide');
  await el.slideTo(1);
  await vi.waitFor(() => expect(el.shadowRoot!.querySelector('.carousel-viewport')!.scrollLeft).toBeGreaterThan(390));
  expect(el.children[0].hasAttribute('data-q-carousel-active')).toBe(false);
});


it.each(['open', 'closed'] as const)('preserves focus when nested inside an %s shadow root', async (mode) => {
  const outer = document.createElement('div');
  document.body.append(outer);
  const root = outer.attachShadow({ mode });
  const el = await create('crossfade', root);
  const slide = el.children[0] as HTMLElement;
  const inner = document.createElement('div');
  slide.append(inner);
  const innerRoot = inner.attachShadow({ mode: 'closed' });
  const button = document.createElement('button');
  button.textContent = 'Nested action';
  innerRoot.append(button);
  button.focus();
  expect(document.activeElement).toBe(outer);
  expect(root.activeElement).toBe(inner);

  await el.slideTo(1);
  await frame();
  expect(root.activeElement).toBe(el);
  expect(el.shadowRoot!.activeElement).toBe(el.shadowRoot!.querySelectorAll('.indicator-dot')[1]);
  expect(slide.inert).toBe(true);
  expect(slide.getAttribute('aria-hidden')).toBe('true');

  const outside = document.createElement('button');
  root.append(outside);
  outside.focus();
  await el.slideTo(2);
  expect(root.activeElement).toBe(outside);
});

it('groups extra controls below dots without treating the named slot as a slide', async () => {
  const el = await create();
  const counter = document.createElement('p');
  counter.slot = 'controls-extra';
  counter.textContent = '1 / 3';
  el.append(counter);
  await frame();
  const controls = el.shadowRoot!.querySelector('[part="controls"]') as HTMLElement;
  const slot = controls.querySelector('slot') as HTMLSlotElement;
  expect(slot.assignedElements()).toEqual([counter]);
  expect(el.shadowRoot!.querySelectorAll('.indicator-dot')).toHaveLength(3);
  expect(counter.inert).toBe(false);
  for (const transition of ['slide', 'crossfade', 'instant'] as const) {
    el.transition = transition;
    await frame();
    expect(getComputedStyle(counter).opacity).toBe('1');
    expect(getComputedStyle(counter).pointerEvents).not.toBe('none');
  }
  expect(counter.hasAttribute('data-q-carousel-active')).toBe(false);
  el.showIndicators = false;
  await frame();
  expect(controls.hidden).toBe(false);
  counter.remove();
  await frame();
  expect(controls.hidden).toBe(true);
});

it('supplies slideshow defaults, preserves explicit false controls, and keeps the frame square', async () => {
  const el = await create('slide', document.body, {
    layout: 'slideshow', itemWidth: 'auto', showArrows: undefined, showIndicators: undefined,
  });
  el.style.removeProperty('--q-carousel-padding');
  el.style.removeProperty('--q-carousel-gap');
  await el.updateLimits();
  await frame();
  const viewport = el.shadowRoot!.querySelector<HTMLElement>('.carousel-viewport')!;
  expect(el.shadowRoot!.querySelectorAll('.arrow-btn')).toHaveLength(2);
  expect(el.shadowRoot!.querySelectorAll('.indicator-dot')).toHaveLength(3);
  expect(viewport.tabIndex).toBe(-1);
  expect(getComputedStyle(viewport).padding).toBe('0px');
  expect(getComputedStyle(viewport).gap).toBe('0px');
  expect(el.children[0].getBoundingClientRect().width).toBe(400);
  expect((el.children[1] as HTMLElement).inert).toBe(true);
  // A tabindex=-1 viewport can still receive mouse focus. Keyboard focus must
  // move to one navigation action rather than decorate the entire banner.
  viewport.focus();
  viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
  await frame();
  expect(el.children[1].getAttribute('data-q-carousel-active')).toBe('true');
  expect(el.children[2].getAttribute('data-q-carousel-active')).toBe('false');
  expect(el.shadowRoot!.activeElement).toBe(el.shadowRoot!.querySelectorAll('.indicator-dot')[1]);
  expect(getComputedStyle(viewport).outlineStyle).toBe('none');
  el.ariaLabel = 'Featured products';
  el.showArrows = false;
  el.showIndicators = false;
  await frame();
  expect(viewport.getAttribute('aria-label')).toBe('Featured products');
  expect(el.shadowRoot!.querySelector('.arrow-btn')).toBeNull();
  expect(viewport.tabIndex).toBe(0);
  viewport.focus();
  expect(getComputedStyle(viewport).borderRadius).toBe('0px');
  expect(getComputedStyle(viewport).boxShadow).toBe('none');
  viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
  await frame();
  expect(el.children[2].getAttribute('data-q-carousel-active')).toBe('true');
});

it('keeps overflowing strip content keyboard-accessible without creating a slideshow policy', async () => {
  const el = await create('slide', document.body, {
    itemWidth: 'auto', showArrows: undefined, showIndicators: undefined, autoplay: true,
  });
  el.style.removeProperty('--q-carousel-padding');
  el.style.removeProperty('--q-carousel-gap');
  el.innerHTML = '<div style="width:800px;height:100px">Wide native content <a href="#wide">Action</a></div>';
  await frame();
  await el.updateLimits();
  const viewport = el.shadowRoot!.querySelector<HTMLElement>('.carousel-viewport')!;
  expect(viewport.tabIndex).toBe(0);
  expect(el.shadowRoot!.querySelector('.rotation-btn')).toBeNull();
  expect(el.children[0].hasAttribute('aria-hidden')).toBe(false);
  expect(getComputedStyle(viewport).padding).toBe('48px 40px');
  const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true, cancelable: true });
  viewport.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  el.children[0].setAttribute('style', 'width:100px;height:100px');
  await el.updateLimits();
  await frame();
  expect(viewport.tabIndex).toBe(-1);
});

it('does not let a rotation-only control remove the slide-navigation fallback', async () => {
  const el = await create('instant', document.body, {
    layout: 'slideshow', showArrows: false, showIndicators: false,
    autoplay: true, autoplayInterval: 1000,
  });
  const viewport = el.shadowRoot!.querySelector<HTMLElement>('.carousel-viewport')!;
  expect(viewport.tabIndex).toBe(0);
  expect(el.shadowRoot!.querySelector('.rotation-btn')).not.toBeNull();
  viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
  await frame();
  expect(el.children[1].getAttribute('data-q-carousel-active')).toBe('true');
  el.innerHTML = '<div style="height:100px">Only slide</div>';
  await frame();
  await el.updateLimits();
  await frame();
  expect(viewport.tabIndex).toBe(-1);
  expect(el.shadowRoot!.querySelector('.rotation-btn')).toBeNull();
});

it('keeps native slideshow links inactive and restores authored values when leaving slideshow', async () => {
  const el = await create('slide', document.body, { layout: 'slideshow' });
  const first = el.children[0] as HTMLElement;
  const second = el.children[1] as HTMLElement;
  expect(second.inert).toBe(true);
  first.querySelector('button')!.focus();
  await el.slideTo(1);
  await frame();
  expect(first.inert).toBe(true);
  expect(second.inert).toBe(false);
  expect(el.shadowRoot!.activeElement).toBe(el.shadowRoot!.querySelectorAll('.indicator-dot')[1]);
  el.layout = 'strip';
  await frame();
  expect(first.inert).toBe(false);
  expect(first.hasAttribute('aria-hidden')).toBe(false);
  expect(second.hasAttribute('data-q-carousel-active')).toBe(false);
});

it('keeps playback intent labels distinct from temporary suspension and handles pointer focus before click', async () => {
  const el = await create('instant', document.body, {
    layout: 'slideshow', autoplay: true, autoplayInterval: 1000, repeat: true,
  });
  const states: boolean[] = [];
  el.addEventListener('qAutoplayChange', event => states.push((event as CustomEvent<{ playing: boolean }>).detail.playing));
  el.autoplaySuspended = true;
  await frame();
  const rotation = el.shadowRoot!.querySelector<HTMLButtonElement>('.rotation-btn')!;
  expect(rotation.textContent?.trim()).toBe('Pause slideshow');
  expect(states.at(-1)).toBe(false);
  rotation.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
  rotation.focus();
  rotation.click();
  await frame();
  expect(rotation.textContent?.trim()).toBe('Play slideshow');
  rotation.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
  rotation.click();
  await frame();
  expect(rotation.textContent?.trim()).toBe('Pause slideshow');
  expect(states.at(-1)).toBe(false);
  el.autoplaySuspended = false;
  await frame();
  expect(states.at(-1)).toBe(true);
  await el.pause();
  el.innerHTML = '';
  await frame();
  el.innerHTML = '<div style="height:100px">First</div><div style="height:100px">Second</div>';
  await frame();
  expect(el.shadowRoot!.querySelector('.rotation-btn')?.textContent?.trim()).toBe('Play slideshow');
});

it('stops non-repeating playback and restarts completed playback explicitly', async () => {
  const el = await create('instant', document.body, {
    layout: 'slideshow', autoplay: true, autoplayInterval: 150,
  });
  await vi.waitFor(() => expect(el.children[2].getAttribute('data-q-carousel-active')).toBe('true'));
  await vi.waitFor(() => expect(el.shadowRoot!.querySelector('.rotation-btn')?.textContent?.trim()).toBe('Play slideshow'));
  await el.play();
  await frame();
  expect(el.children[0].getAttribute('data-q-carousel-active')).toBe('true');
  await el.pause();
});

it('preserves original dot styling while controls fit the available container width', async () => {
  const el = await create('instant', document.body, { layout: 'slideshow' });
  el.style.width = '180px';
  await frame();
  const controls = el.shadowRoot!.querySelector<HTMLElement>('[part="controls"]')!;
  const row = el.shadowRoot!.querySelector<HTMLElement>('.carousel-indicators')!;
  const dots = Array.from(row.querySelectorAll<HTMLButtonElement>('.indicator-dot'));
  expect(controls.getBoundingClientRect().width).toBeLessThanOrEqual(180);
  expect(row.getBoundingClientRect().height).toBe(6);
  expect(getComputedStyle(row).gap).toBe('8px');
  expect(dots[0].getBoundingClientRect().width).toBe(15);
  expect(dots[1].getBoundingClientRect().width).toBe(6);
  expect(dots[1].getBoundingClientRect().height).toBe(6);
  expect(getComputedStyle(dots[1]).backgroundColor).toBe('rgb(156, 163, 175)');
  await vi.waitFor(() => expect(getComputedStyle(dots[1]).opacity).toBe('0.5'));
});
