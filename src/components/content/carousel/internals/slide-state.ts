/** Own only temporary accessibility attributes; restore authored values on release. */
export class CarouselSlideState {
  private originals = new Map<HTMLElement, { inert: boolean; hidden: string | null; active: string | null }>();

  update(slides: HTMLElement[], index: number, focusTarget?: HTMLElement | (() => void)): void {
    for (const element of this.originals.keys()) {
      if (!slides.includes(element)) this.restoreElement(element);
    }
    for (const [position, element] of slides.entries()) {
      if (!this.originals.has(element)) {
        this.originals.set(element, {
          inert: element.inert,
          hidden: element.getAttribute('aria-hidden'),
          active: element.getAttribute('data-q-carousel-active'),
        });
      }
      const active = position === index;
      const original = this.originals.get(element)!;
      // Focus is retargeted at each shadow boundary; inspect the slide's own root.
      const root = element.getRootNode();
      const focused = root instanceof ShadowRoot ? root.activeElement : element.ownerDocument.activeElement;
      if (!active && element.contains(focused)) {
        if (typeof focusTarget === 'function')
          focusTarget();
        else
          focusTarget?.focus({ preventScroll: true });
      }
      element.inert = active ? original.inert : true;
      this.attribute(element, 'aria-hidden', active ? original.hidden : 'true');
      this.attribute(element, 'data-q-carousel-active', active ? 'true' : 'false');
    }
  }

  restore(): void {
    for (const element of this.originals.keys()) this.restoreElement(element);
  }

  private restoreElement(element: HTMLElement): void {
    const original = this.originals.get(element)!;
    element.inert = original.inert;
    this.attribute(element, 'aria-hidden', original.hidden);
    this.attribute(element, 'data-q-carousel-active', original.active);
    this.originals.delete(element);
  }

  private attribute(element: HTMLElement, name: string, value: string | null): void {
    if (value === null) element.removeAttribute(name);
    else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }
}
