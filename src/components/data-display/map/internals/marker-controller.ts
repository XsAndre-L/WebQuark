import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

import { Q_MAP_MARKER_VARIANTS } from '../map.types';
import type { QMapMarker, QMapMarkerId, QMapMarkerInput } from '../map.types';
import { getMapMarkerKey, getMapMarkers } from './markers';

type LeafletModule = typeof import('leaflet');

interface MarkerElementListeners {
  element: HTMLElement;
  click: (event: MouseEvent) => void;
  keydown: (event: KeyboardEvent) => void;
}

export interface MapMarkerControllerOptions {
  map: LeafletMap;
  leaflet: LeafletModule;
  getSelectedMarkerId: () => QMapMarkerId | undefined;
  onSelect: (marker: QMapMarker, originalEvent: MouseEvent | KeyboardEvent) => void;
}

/** Owns Leaflet marker reconciliation, accessibility, listeners, and cleanup. */
export class MapMarkerController {
  private readonly layers = new Map<string, LeafletMarker>();
  private readonly records = new Map<string, QMapMarker>();
  private readonly listeners = new Map<string, MarkerElementListeners>();

  constructor(private readonly options: MapMarkerControllerOptions) {}

  sync(markers: QMapMarkerInput): void {
    const nextRecords = new Map<string, QMapMarker>();
    for (const marker of getMapMarkers(markers)) nextRecords.set(getMapMarkerKey(marker.id), marker);

    for (const key of this.layers.keys()) {
      if (!nextRecords.has(key)) this.remove(key);
    }

    this.records.clear();
    for (const [key, marker] of nextRecords) {
      this.records.set(key, marker);
      const layer = this.layers.get(key);
      if (layer) {
        layer.setLatLng([marker.latitude, marker.longitude]);
        this.updateElement(key, marker);
      } else {
        this.add(key, marker);
      }
    }
  }

  syncSelection(): void {
    for (const [key, marker] of this.records) this.updateElement(key, marker);
  }

  destroy(): void {
    for (const key of [...this.layers.keys()]) this.remove(key);
    this.records.clear();
  }

  private add(key: string, marker: QMapMarker): void {
    const markerContent = this.createMarkerContent();

    const icon = this.options.leaflet.divIcon({
      className: 'q-map-marker',
      html: markerContent,
      iconAnchor: [0, 0],
      iconSize: [0, 0],
    });
    const layer = this.options.leaflet.marker([marker.latitude, marker.longitude], {
      icon,
      keyboard: false,
      riseOnHover: true,
      riseOffset: 1000,
      title: marker.label,
    });
    layer.addTo(this.options.map);
    this.layers.set(key, layer);

    const element = layer.getElement();
    if (!element) return;

    const click = (event: MouseEvent) => this.select(key, event);
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      this.select(key, event);
    };

    element.addEventListener('click', click);
    element.addEventListener('keydown', keydown);
    this.listeners.set(key, { element, click, keydown });
    this.updateElement(key, marker);
  }

  private updateElement(key: string, marker: QMapMarker): void {
    const element = this.listeners.get(key)?.element;
    if (!element) return;

    for (const variant of Q_MAP_MARKER_VARIANTS) element.classList.remove(`variant-${variant}`);
    element.classList.add(`variant-${marker.variant ?? 'default'}`);
    this.updateMarkerContent(element, marker);
    const selected = this.isSelected(marker.id);
    element.classList.toggle('is-selected', selected);
    element.setAttribute('part', 'marker');
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-label', marker.label);
    element.setAttribute('aria-pressed', selected ? 'true' : 'false');
    element.setAttribute('data-marker-id', key);
    element.setAttribute('title', marker.label);
  }

  private createMarkerContent(): HTMLElement {
    const center = document.createElement('span');
    center.className = 'q-map-marker__center';
    center.setAttribute('aria-hidden', 'true');

    const fallback = document.createElement('span');
    fallback.className = 'q-map-marker__fallback';
    fallback.hidden = true;

    const image = document.createElement('img');
    image.className = 'q-map-marker__image';
    image.alt = '';
    image.decoding = 'async';
    image.draggable = false;
    image.hidden = true;
    image.setAttribute('aria-hidden', 'true');
    image.addEventListener('load', () => {
      if (image.dataset.source !== image.getAttribute('src')) return;
      image.hidden = false;
      center.classList.add('has-image');
    });
    image.addEventListener('error', () => {
      if (image.dataset.source !== image.getAttribute('src')) return;
      image.hidden = true;
      center.classList.remove('has-image');
    });

    center.append(fallback, image);
    return center;
  }

  private updateMarkerContent(element: HTMLElement, marker: QMapMarker): void {
    const center = element.querySelector<HTMLElement>('.q-map-marker__center');
    const fallback = center?.querySelector<HTMLElement>('.q-map-marker__fallback');
    const image = center?.querySelector<HTMLImageElement>('.q-map-marker__image');
    if (!center || !fallback || !image) return;

    const fallbackText = marker.fallbackText ?? '';
    fallback.textContent = fallbackText;
    fallback.hidden = fallbackText.length === 0;
    element.classList.toggle('has-content', Boolean(marker.imageUrl || fallbackText));

    if (!marker.imageUrl) {
      image.hidden = true;
      image.removeAttribute('src');
      delete image.dataset.source;
      center.classList.remove('has-image');
      return;
    }

    if (image.dataset.source === marker.imageUrl) return;

    image.hidden = true;
    center.classList.remove('has-image');
    image.dataset.source = marker.imageUrl;
    image.src = marker.imageUrl;
  }

  private isSelected(id: QMapMarkerId): boolean {
    const selectedId = this.options.getSelectedMarkerId();
    return selectedId !== undefined && getMapMarkerKey(selectedId) === getMapMarkerKey(id);
  }

  private select(key: string, originalEvent: MouseEvent | KeyboardEvent): void {
    const marker = this.records.get(key);
    if (marker) this.options.onSelect(marker, originalEvent);
  }

  private remove(key: string): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.element.removeEventListener('click', listeners.click);
      listeners.element.removeEventListener('keydown', listeners.keydown);
      this.listeners.delete(key);
    }

    this.layers.get(key)?.remove();
    this.layers.delete(key);
    this.records.delete(key);
  }
}
