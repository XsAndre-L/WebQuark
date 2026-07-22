import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

import type {
  QMapClusterSelectDetail,
  QMapMarker,
  QMapMarkerId,
  QMapMarkerInput,
} from '../map.types';
import {
  MapMarkerClusterIndex,
  type MapMarkerClusteringOptions,
  type MapMarkerViewportCluster,
  type MapMarkerViewportItem,
} from './marker-cluster-index';
import {
  createCalloutContent,
  createClusterContent,
  createMarkerContent,
  getMarkerAccessibleLabel,
  updateCalloutContent,
  updateClusterPresentation,
  updateMarkerPresentation,
} from './marker-presentation';
import { getMapMarkerKey, getMapMarkers } from './markers';

type LeafletModule = typeof import('leaflet');

interface RenderedLayer {
  kind: 'marker' | 'cluster';
  layer: LeafletMarker;
  element: HTMLElement;
  markerKeys: string[];
  click: (event: MouseEvent) => void;
  keydown: (event: KeyboardEvent) => void;
  calloutContent?: HTMLElement;
  calloutPlacement?: string;
  calloutBound?: boolean;
}

interface FocusIntent {
  element: HTMLElement;
  renderKey: string;
  markerKey: string;
}

export interface MapMarkerControllerOptions {
  map: LeafletMap;
  leaflet: LeafletModule;
  getSelectedMarkerId: () => QMapMarkerId | undefined;
  getClusteringOptions: () => MapMarkerClusteringOptions;
  prefersReducedMotion: () => boolean;
  onMarkerSelect: (marker: QMapMarker, originalEvent: MouseEvent | KeyboardEvent) => void;
  onClusterSelect: (detail: QMapClusterSelectDetail) => boolean;
}

/** Owns marker normalization, clustering, stable reconciliation, accessibility, and cleanup. */
export class MapMarkerController {
  private readonly layers = new Map<string, RenderedLayer>();
  private readonly markers = new Map<string, QMapMarker>();
  private readonly clusterIndex = new MapMarkerClusterIndex();
  private visibleItems = new Map<string, MapMarkerViewportItem>();
  private pendingFocusMarkerKey?: string;

  private readonly handleViewportChange = () => this.reconcile();

  constructor(private readonly options: MapMarkerControllerOptions) {
    options.map.on('moveend zoomend', this.handleViewportChange);
  }

  sync(markers: QMapMarkerInput): void {
    const normalized = getMapMarkers(markers);
    this.markers.clear();
    for (const marker of normalized) this.markers.set(getMapMarkerKey(marker.id), marker);

    const clustering = this.options.getClusteringOptions();
    if (clustering.enabled) this.clusterIndex.load(normalized, clustering);
    else this.clusterIndex.clear();
    this.reconcile();
  }

  syncSelection(): void {
    this.reconcile();
  }

  destroy(): void {
    this.options.map.off('moveend zoomend', this.handleViewportChange);
    for (const key of [...this.layers.keys()]) this.remove(key);
    this.visibleItems.clear();
    this.markers.clear();
    this.clusterIndex.clear();
  }

  private reconcile(): void {
    const focusIntent = this.captureFocusIntent();
    const items = this.getVisibleItems();
    this.visibleItems = new Map(items.map(item => [item.key, item]));

    for (const key of [...this.layers.keys()]) {
      if (!this.visibleItems.has(key)) this.remove(key);
    }

    for (const item of items) {
      const current = this.layers.get(item.key);
      if (current && current.kind !== item.kind) this.remove(item.key);
      const record = this.layers.get(item.key) ?? this.add(item);
      if (record) this.update(record, item);
    }

    const preservedFocus = focusIntent
      && this.layers.get(focusIntent.renderKey)?.element === focusIntent.element;
    if (this.pendingFocusMarkerKey) {
      const restored = this.restoreFocus(this.pendingFocusMarkerKey);
      if (restored) this.pendingFocusMarkerKey = undefined;
    } else if (focusIntent && !preservedFocus) {
      if (!this.restoreFocus(focusIntent.markerKey)) this.options.map.getContainer().focus();
    }
  }

  private getVisibleItems(): MapMarkerViewportItem[] {
    const clustering = this.options.getClusteringOptions();
    if (!clustering.enabled) {
      return [...this.markers].map(([key, marker]) => ({ kind: 'marker' as const, key, marker }));
    }

    const bounds = this.options.map.getBounds().pad(0.2);
    const south = Math.max(-90, bounds.getSouth());
    const north = Math.min(90, bounds.getNorth());
    const west = Math.max(-180, bounds.getWest());
    const east = Math.min(180, bounds.getEast());
    const safeBounds: [number, number, number, number] = east > west
      ? [west, south, east, north]
      : [-180, south, 180, north];
    return this.clusterIndex.getViewportItems(
      safeBounds,
      this.options.map.getZoom(),
      this.options.getSelectedMarkerId(),
    );
  }

  private add(item: MapMarkerViewportItem): RenderedLayer | undefined {
    const document = this.options.map.getContainer().ownerDocument;
    const content = item.kind === 'marker'
      ? createMarkerContent(document)
      : createClusterContent(document);
    const className = item.kind === 'marker' ? 'q-map-marker' : 'q-map-cluster';
    const label = item.kind === 'marker' ? item.marker.label : `${item.count} map markers`;
    const layer = this.options.leaflet.marker([this.getLatitude(item), this.getLongitude(item)], {
      bubblingMouseEvents: false,
      icon: this.options.leaflet.divIcon({
        className,
        html: content,
        iconAnchor: [0, 0],
        iconSize: [0, 0],
      }),
      keyboard: false,
      riseOnHover: true,
      riseOffset: 1000,
      title: label,
    });
    layer.addTo(this.options.map);
    const element = layer.getElement();
    if (!element) {
      layer.remove();
      return undefined;
    }

    const click = (event: MouseEvent) => {
      event.stopPropagation();
      this.activate(item.key, event);
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      this.activate(item.key, event);
    };
    element.addEventListener('click', click);
    element.addEventListener('keydown', keydown);

    const record: RenderedLayer = {
      kind: item.kind,
      layer,
      element,
      markerKeys: [],
      click,
      keydown,
    };
    this.layers.set(item.key, record);
    return record;
  }

  private update(record: RenderedLayer, item: MapMarkerViewportItem): void {
    record.layer.setLatLng([this.getLatitude(item), this.getLongitude(item)]);
    record.markerKeys = item.kind === 'marker'
      ? [getMapMarkerKey(item.marker.id)]
      : item.markerKeys;

    if (item.kind === 'marker') {
      const selected = this.isSelected(item.marker.id);
      updateMarkerPresentation(record.element, item.marker, selected);
      record.element.setAttribute('part', 'marker');
      record.element.setAttribute('role', 'button');
      record.element.setAttribute('tabindex', '0');
      record.element.setAttribute('aria-label', getMarkerAccessibleLabel(item.marker));
      record.element.setAttribute('aria-pressed', selected ? 'true' : 'false');
      record.element.setAttribute('data-marker-id', item.key);
      record.element.setAttribute('title', item.marker.label);
      this.syncCallout(record, item.marker, selected);
      return;
    }

    this.unbindCallout(record);
    updateClusterPresentation(record.element, item.count, item.containsSelection);
    record.element.setAttribute('part', 'cluster');
    record.element.setAttribute('role', 'button');
    record.element.setAttribute('tabindex', '0');
    record.element.setAttribute(
      'aria-label',
      `${item.count} map markers${item.containsSelection ? ', including the selected marker' : ''}`,
    );
    record.element.setAttribute('data-cluster-id', item.clusterId);
    record.element.setAttribute('title', `${item.count} map markers`);
    record.element.removeAttribute('aria-pressed');
  }

  private syncCallout(record: RenderedLayer, marker: QMapMarker, selected: boolean): void {
    const callout = marker.callout;
    const visible = callout && (callout.visibility !== 'selected' || selected);
    if (!callout || !visible) {
      this.unbindCallout(record);
      return;
    }

    const placement = callout.placement ?? 'auto';
    if (record.calloutBound && record.calloutPlacement !== placement) this.unbindCallout(record);
    record.calloutContent ??= createCalloutContent(record.element.ownerDocument);
    updateCalloutContent(record.calloutContent, callout);
    record.calloutPlacement = placement;

    if (!record.calloutBound) {
      record.layer.bindTooltip(record.calloutContent, {
        className: 'q-map-callout',
        direction: placement,
        interactive: false,
        opacity: 1,
        permanent: true,
      });
      record.calloutBound = true;
    }
    record.layer.openTooltip();
    const tooltip = record.layer.getTooltip()?.getElement();
    tooltip?.setAttribute('part', 'marker-callout');
    tooltip?.setAttribute('aria-hidden', 'true');
  }

  private unbindCallout(record: RenderedLayer): void {
    if (!record.calloutBound) return;
    record.layer.unbindTooltip();
    record.calloutBound = false;
  }

  private activate(key: string, originalEvent: MouseEvent | KeyboardEvent): void {
    const item = this.visibleItems.get(key);
    if (!item) return;
    if (item.kind === 'marker') {
      this.options.onMarkerSelect(item.marker, originalEvent);
      return;
    }
    this.activateCluster(item, originalEvent);
  }

  private activateCluster(item: MapMarkerViewportCluster, originalEvent: MouseEvent | KeyboardEvent): void {
    const expansionZoom = Math.min(
      this.options.map.getMaxZoom(),
      Math.max(this.options.map.getZoom() + 1, item.expansionZoom),
    );
    const prevented = this.options.onClusterSelect({
      clusterId: item.clusterId,
      markerIds: item.markerIds,
      latitude: item.latitude,
      longitude: item.longitude,
      expansionZoom,
      originalEvent,
    });
    if (prevented) return;

    if (originalEvent instanceof KeyboardEvent) {
      const selected = this.options.getSelectedMarkerId();
      const selectedKey = selected === undefined ? undefined : getMapMarkerKey(selected);
      this.pendingFocusMarkerKey = selectedKey && item.markerKeys.includes(selectedKey)
        ? selectedKey
        : item.markerKeys[0];
    }
    this.options.map.setView([item.latitude, item.longitude], expansionZoom, {
      animate: !this.options.prefersReducedMotion(),
    });
  }

  private captureFocusIntent(): FocusIntent | undefined {
    for (const [renderKey, record] of this.layers) {
      const root = record.element.getRootNode() as Document | ShadowRoot;
      if (root.activeElement !== record.element) continue;
      const selected = this.options.getSelectedMarkerId();
      const selectedKey = selected === undefined ? undefined : getMapMarkerKey(selected);
      return {
        element: record.element,
        renderKey,
        markerKey: selectedKey && record.markerKeys.includes(selectedKey)
          ? selectedKey
          : record.markerKeys[0],
      };
    }
    return undefined;
  }

  private restoreFocus(markerKey: string): boolean {
    const marker = this.layers.get(markerKey);
    if (marker?.kind === 'marker') {
      marker.element.focus();
      return true;
    }
    for (const record of this.layers.values()) {
      if (record.kind === 'cluster' && record.markerKeys.includes(markerKey)) {
        record.element.focus();
        return true;
      }
    }
    return false;
  }

  private isSelected(id: QMapMarkerId): boolean {
    const selectedId = this.options.getSelectedMarkerId();
    return selectedId !== undefined && getMapMarkerKey(selectedId) === getMapMarkerKey(id);
  }

  private getLatitude(item: MapMarkerViewportItem): number {
    return item.kind === 'marker' ? item.marker.latitude : item.latitude;
  }

  private getLongitude(item: MapMarkerViewportItem): number {
    return item.kind === 'marker' ? item.marker.longitude : item.longitude;
  }

  private remove(key: string): void {
    const record = this.layers.get(key);
    if (!record) return;
    record.element.removeEventListener('click', record.click);
    record.element.removeEventListener('keydown', record.keydown);
    this.unbindCallout(record);
    record.layer.remove();
    this.layers.delete(key);
  }
}
