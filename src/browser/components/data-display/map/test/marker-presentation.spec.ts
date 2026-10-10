import { describe, expect, it } from 'vitest';

import {
  createCalloutContent,
  createMarkerContent,
  updateCalloutContent,
  updateMarkerPresentation,
} from '../internals/marker-presentation';

describe('q-map marker icon presentation', () => {
  it('applies finite pixel corrections and clears them on marker reuse', () => {
    const content = createMarkerContent(document);

    updateMarkerPresentation(content, {
      id: 'field-manager:1',
      latitude: -26.2041,
      longitude: 28.0473,
      label: 'Field Manager',
      kind: 'icon',
      icon: 'user-cog',
      iconSize: 18,
      iconOffsetX: 0.5,
      iconOffsetY: -0,
    }, false);

    expect(content.style.getPropertyValue('--q-map-marker-icon-size')).toBe('18px');
    expect(content.style.getPropertyValue('--q-map-marker-icon-offset-x')).toBe('0.5px');
    expect(content.style.getPropertyValue('--q-map-marker-icon-offset-y')).toBe('0px');

    updateMarkerPresentation(content, {
      id: 'store:1',
      latitude: -26.2041,
      longitude: 28.0473,
      label: 'Store',
      kind: 'icon',
      icon: 'store',
      iconSize: Number.NaN,
      iconOffsetX: Number.POSITIVE_INFINITY,
    }, false);

    expect(content.style.getPropertyValue('--q-map-marker-icon-size')).toBe('');
    expect(content.style.getPropertyValue('--q-map-marker-icon-offset-x')).toBe('');
    expect(content.style.getPropertyValue('--q-map-marker-icon-offset-y')).toBe('');
  });
});

describe('q-map marker callout presentation', () => {
  it('renders structured callout text without interpreting HTML', () => {
    const content = createCalloutContent(document);

    updateCalloutContent(content, {
      title: '<strong>Main Street Store</strong>',
      subtitle: 'CUST-001 | Johannesburg',
      meta: 'Visit due',
      status: {
        label: '<em>Attention</em>',
        variant: 'warning',
      },
      variant: 'success',
    });

    const heading = content.querySelector('.q-map-callout__heading');
    const title = content.querySelector('.q-map-callout__title');
    const status = content.querySelector('.q-map-callout__status');
    expect(title?.textContent).toBe('<strong>Main Street Store</strong>');
    expect(content.querySelector('strong')).toBeNull();
    expect(content.querySelector('.q-map-callout__subtitle')?.textContent)
      .toBe('CUST-001 | Johannesburg');
    expect(content.querySelector('.q-map-callout__meta')?.textContent)
      .toBe('Visit due');
    expect(content.querySelector('.q-map-callout__separator')).toBeNull();
    expect(status?.textContent).toBe('<em>Attention</em>');
    expect(title?.parentElement).toBe(heading);
    expect(status?.parentElement).toBe(heading);
    expect(content.querySelector('em')).toBeNull();
    expect(
      status?.classList.contains('variant-warning'),
    ).toBe(true);
    expect(content.classList.contains('variant-success')).toBe(true);
  });

  it('updates optional lines and replaces the previous variant', () => {
    const content = createCalloutContent(document);
    updateCalloutContent(content, {
      title: 'First store',
      subtitle: 'First subtitle',
      meta: 'First meta',
      status: {
        label: 'In Progress',
        variant: 'success',
      },
      variant: 'warning',
    });

    updateCalloutContent(content, {
      title: 'Second store',
      variant: 'danger',
    });

    const subtitle = content.querySelector<HTMLElement>('.q-map-callout__subtitle');
    const status = content.querySelector<HTMLElement>('.q-map-callout__status');
    const meta = content.querySelector<HTMLElement>('.q-map-callout__meta');
    expect(content.querySelector('.q-map-callout__title')?.textContent).toBe('Second store');
    expect(subtitle?.textContent).toBe('');
    expect(subtitle?.hidden).toBe(true);
    expect(status?.textContent).toBe('');
    expect(status?.hidden).toBe(true);
    expect(meta?.textContent).toBe('');
    expect(meta?.hidden).toBe(true);
    expect(content.classList.contains('variant-warning')).toBe(false);
    expect(content.classList.contains('variant-danger')).toBe(true);
  });
});

describe('q-map original image marker presentation', () => {
  it('places the whole image at its anchor and restores dot geometry after failure or reuse', () => {
    const position = document.createElement('div');
    const content = createMarkerContent(document);
    position.append(content);
    const marker = {
      id: 'pin', latitude: 0, longitude: 0, label: 'Pin', kind: 'image' as const,
      imageUrl: 'https://example.test/pin.png', imageSize: [25, 41] as const,
      imageAnchor: [0, 41] as const,
    };
    updateMarkerPresentation(content, marker, false);
    const image = content.querySelector<HTMLImageElement>('img')!;
    expect(content.classList.contains('kind-dot')).toBe(true);
    Object.defineProperty(image, 'complete', { configurable: true, value: true });
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 25 });
    Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 41 });
    image.dispatchEvent(new Event('load'));
    expect(content.classList.contains('kind-image')).toBe(true);
    expect(position.classList.contains('is-image')).toBe(true);
    expect(position.style.getPropertyValue('--q-map-image-width')).toBe('25px');
    expect(position.style.getPropertyValue('--q-map-image-height')).toBe('41px');
    expect(position.style.getPropertyValue('--q-map-image-anchor-x')).toBe('0px');
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 0 });
    image.dispatchEvent(new Event('error'));
    expect(content.classList.contains('kind-dot')).toBe(true);
    expect(position.classList.contains('is-image')).toBe(false);

    updateMarkerPresentation(content, { ...marker, kind: 'avatar' }, false);
    image.dispatchEvent(new Event('load'));
    expect(content.classList.contains('kind-avatar')).toBe(true);
    expect(position.classList.contains('is-image')).toBe(false);
  });

  it('ignores stale load and error events while a replacement image is pending', () => {
    const position = document.createElement('div');
    const content = createMarkerContent(document);
    position.append(content);
    const marker = {
      id: 'pin', latitude: 0, longitude: 0, label: 'Pin', kind: 'image' as const,
      imageUrl: 'https://example.test/first.png',
    };
    updateMarkerPresentation(content, marker, false);
    const image = content.querySelector<HTMLImageElement>('img')!;
    Object.defineProperty(image, 'complete', { configurable: true, value: false });
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 0 });
    updateMarkerPresentation(content, { ...marker, imageUrl: 'https://example.test/next.png' }, false);
    image.dispatchEvent(new Event('load'));
    image.dispatchEvent(new Event('error'));
    expect(image.hidden).toBe(true);
    expect(position.classList.contains('is-image')).toBe(false);

    Object.defineProperty(image, 'complete', { configurable: true, value: true });
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 25 });
    Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 41 });
    image.dispatchEvent(new Event('load'));
    image.dispatchEvent(new Event('error'));
    expect(image.hidden).toBe(false);
    expect(position.classList.contains('is-image')).toBe(true);
  });

  it('uses bounded natural dimensions and bottom-center without image metadata', () => {
    const position = document.createElement('div');
    const content = createMarkerContent(document);
    position.append(content);
    updateMarkerPresentation(content, {
      id: 'natural', latitude: 0, longitude: 0, label: 'Natural',
      kind: 'image', imageUrl: 'https://example.test/wide.png',
    }, false);
    const image = content.querySelector<HTMLImageElement>('img')!;
    Object.defineProperty(image, 'complete', { value: true });
    Object.defineProperty(image, 'naturalWidth', { value: 200 });
    Object.defineProperty(image, 'naturalHeight', { value: 100 });
    image.dispatchEvent(new Event('load'));
    expect(position.style.getPropertyValue('--q-map-image-width')).toBe('48px');
    expect(position.style.getPropertyValue('--q-map-image-height')).toBe('24px');
    expect(position.style.getPropertyValue('--q-map-image-anchor-x')).toBe('24px');
    expect(position.style.getPropertyValue('--q-map-image-anchor-y')).toBe('24px');
  });
});
