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
