import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore
import { defineCustomElements } from '../../../../../dist/loader';

defineCustomElements();

describe('q-map', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function waitForReady(element: HTMLElement): Promise<void> {
    await new Promise<void>(resolve => {
      element.addEventListener('qReady', () => resolve(), { once: true });
      document.body.appendChild(element);
    });
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  it('renders an accessible map surface and the missing-configuration slot', async () => {
    const element = document.createElement('q-map') as any;
    element.ariaLabel = 'Team locations';
    element.tileUrl = '';
    await waitForReady(element);

    const canvas = element.shadowRoot.querySelector('[part="canvas"]') as HTMLElement;
    const empty = element.shadowRoot.querySelector('[part="empty"]') as HTMLElement;

    expect(canvas.getAttribute('role')).toBe('region');
    expect(canvas.getAttribute('aria-label')).toBe('Team locations');
    expect(empty.textContent).toContain('Map provider is not configured.');
  });

  it('accepts JSON markers and emits a plain marker selection detail', async () => {
    const element = document.createElement('q-map') as any;
    element.markers = JSON.stringify([
      { id: 'member-1', latitude: -26.2041, longitude: 28.0473, label: 'Pat Molefe', variant: 'success' },
    ]);
    element.selectedMarkerId = 'member-1';
    const markerSelect = vi.fn();
    element.addEventListener('qMarkerSelect', markerSelect);
    await waitForReady(element);

    const marker = element.shadowRoot.querySelector('[part~="marker"]') as HTMLElement;
    marker.click();

    expect(marker.getAttribute('role')).toBe('button');
    expect(marker.getAttribute('aria-label')).toBe('Pat Molefe');
    expect(marker.getAttribute('aria-pressed')).toBe('true');
    expect(markerSelect).toHaveBeenCalledTimes(1);
    expect(markerSelect.mock.calls[0][0].detail.marker).toEqual({
      id: 'member-1',
      latitude: -26.2041,
      longitude: 28.0473,
      label: 'Pat Molefe',
      variant: 'success',
    });
    expect(markerSelect.mock.calls[0][0].detail.originalEvent).toBeInstanceOf(MouseEvent);
  });

  it('renders provider attribution as text rather than raw HTML', async () => {
    const element = document.createElement('q-map') as any;
    element.attribution = '<strong>Map provider</strong>';
    element.attributionUrl = 'https://example.com/map-license';
    await waitForReady(element);

    const attribution = element.shadowRoot.querySelector('[part="attribution"]') as HTMLAnchorElement;

    expect(attribution.textContent).toContain('<strong>Map provider</strong>');
    expect(attribution.querySelector('strong')).toBeNull();
    expect(attribution.href).toBe('https://example.com/map-license');
    expect(attribution.rel).toBe('noopener noreferrer');
  });

  it('does not create a link for an unsafe attribution URL', async () => {
    const element = document.createElement('q-map') as any;
    element.attribution = 'Map provider';
    element.attributionUrl = 'javascript:alert(1)';
    await waitForReady(element);

    const attribution = element.shadowRoot.querySelector('[part="attribution"]') as HTMLElement;

    expect(attribution.tagName).toBe('SPAN');
    expect(attribution.textContent).toBe('Map provider');
  });
});
