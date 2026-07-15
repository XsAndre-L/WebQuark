import { Component, Element, Event, EventEmitter, h, Prop, State, Watch } from '@stencil/core';
import type { GridLayer as LeafletGridLayer, Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

import { loadGoogleMapsApi } from './internals/google-maps';
import { loadGoogleMutantConstructor } from './internals/google-mutant';
import { getMapMarkerKey, getMapMarkers } from './internals/markers';
import type {
  QMapGoogleMapType,
  QMapMarker,
  QMapMarkerId,
  QMapMarkerInput,
  QMapMarkerSelectDetail,
  QMapMarkerVariant,
  QMapProvider,
} from './map.types';

type LeafletModule = typeof import('leaflet');

interface LeafletWindow extends Window {
  L_DISABLE_3D?: boolean;
}

interface MarkerElementListeners {
  element: HTMLElement;
  click: (event: MouseEvent) => void;
  keydown: (event: KeyboardEvent) => void;
}

const MARKER_VARIANTS: QMapMarkerVariant[] = ['default', 'success', 'warning', 'danger', 'muted'];
const GOOGLE_MAP_TYPES: QMapGoogleMapType[] = ['roadmap', 'satellite', 'terrain', 'hybrid'];

/**
 * Framework-neutral interactive map powered by Leaflet.
 *
 * @slot empty - Content shown when the selected map provider is not configured.
 * @part surface - Outer clipped map surface.
 * @part canvas - Leaflet map canvas.
 * @part marker - Each interactive map marker.
 * @part attribution - Provider attribution text or link.
 * @part empty - Missing-configuration overlay.
 * @cssprop --q-map-height - Component height.
 * @cssprop --q-map-min-height - Minimum component height.
 * @cssprop --q-map-bg - Background behind map tiles.
 * @cssprop --q-map-border - Outer border.
 * @cssprop --q-map-radius - Outer corner radius.
 * @cssprop --q-map-marker-size - Marker diameter.
 * @cssprop --q-map-marker-color - Default marker color.
 * @cssprop --q-map-marker-success - Success marker color.
 * @cssprop --q-map-marker-warning - Warning marker color.
 * @cssprop --q-map-marker-danger - Danger marker color.
 * @cssprop --q-map-marker-muted - Muted marker color.
 * @cssprop --q-map-marker-selected-color - Selected-marker ring color.
 * @cssprop --q-map-attribution-bg - Attribution background.
 * @cssprop --q-map-attribution-color - Attribution foreground.
 */
@Component({
  tag: 'q-map',
  styleUrl: 'map.css',
  shadow: true,
})
export class QMap {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  @Element() el!: HTMLElement;

  /** Map imagery provider. */
  @Prop() provider: QMapProvider = 'tiles';

  /** URL template used by the tiles provider and as an optional Google-provider fallback. */
  @Prop() tileUrl: string = '';

  /** Browser-restricted Google Maps JavaScript API key used by the Google provider. */
  @Prop() googleApiKey: string = '';

  /** Google base-map style used by the Google provider. */
  @Prop() googleMapType: QMapGoogleMapType = 'roadmap';

  /** Plain-text tile-provider attribution. */
  @Prop() attribution: string = '';

  /** Optional HTTP(S) destination for the attribution text. */
  @Prop() attributionUrl: string = '';

  /** Initial and controlled center latitude. */
  @Prop() centerLatitude: number = 0;

  /** Initial and controlled center longitude. */
  @Prop() centerLongitude: number = 0;

  /** Initial and controlled zoom level. */
  @Prop() zoom: number = 2;

  /** Lowest permitted zoom level. */
  @Prop() minZoom: number = 0;

  /** Highest permitted zoom level. */
  @Prop() maxZoom: number = 19;

  /** Marker records, or a JSON string containing marker records. */
  @Prop() markers: QMapMarkerInput = [];

  /** Identifier of the marker rendered in the selected state. */
  @Prop() selectedMarkerId?: QMapMarkerId;

  /** Accessible name for the interactive map region. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string = 'Interactive map';

  /** Emitted after Leaflet and the initial provider setup have completed. */
  @Event() qReady!: EventEmitter<void>;

  /** Emitted when a marker is activated with a pointer or keyboard. */
  @Event() qMarkerSelect!: EventEmitter<QMapMarkerSelectDetail>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private leaflet?: LeafletModule;
  private map?: LeafletMap;
  private baseLayer?: LeafletGridLayer;
  private canvas?: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private resizeFrame?: number;
  private initializationToken = 0;
  private baseLayerToken = 0;
  @State() private isUsingTileFallback = false;
  private hasLoaded = false;
  private connected = false;
  private markerLayers = new Map<string, LeafletMarker>();
  private markerRecords = new Map<string, QMapMarker>();
  private markerListeners = new Map<string, MarkerElementListeners>();

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  connectedCallback() {
    this.connected = true;
    if (this.hasLoaded) void this.initializeMap();
  }

  componentDidLoad() {
    this.hasLoaded = true;
    void this.initializeMap();
  }

  disconnectedCallback() {
    this.connected = false;
    this.initializationToken += 1;
    this.destroyMap();
  }

  @Watch('provider')
  @Watch('tileUrl')
  @Watch('googleApiKey')
  @Watch('googleMapType')
  handleBaseLayerChange() {
    if (!this.map) {
      void this.initializeMap();
      return;
    }

    void this.syncBaseLayer();
  }

  @Watch('markers')
  handleMarkersChange() {
    this.syncMarkers();
  }

  @Watch('selectedMarkerId')
  handleSelectedMarkerChange() {
    this.syncSelectedMarkers();
  }

  @Watch('centerLatitude')
  @Watch('centerLongitude')
  @Watch('zoom')
  handleViewChange() {
    this.syncView();
  }

  @Watch('minZoom')
  @Watch('maxZoom')
  handleZoomLimitsChange() {
    if (!this.map) return;

    const { minimum, maximum } = this.getZoomLimits();
    this.map.setMinZoom(minimum);
    this.map.setMaxZoom(maximum);
    this.syncView();
    void this.syncBaseLayer();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private setCanvas = (element: HTMLDivElement | null) => {
    this.canvas = element || undefined;
  };

  private async initializeMap() {
    if (this.map || !this.canvas || !this.connected || typeof window === 'undefined') return;

    const token = ++this.initializationToken;
    (window as LeafletWindow).L_DISABLE_3D = true;

    try {
      const leaflet = this.leaflet || (await import('leaflet'));
      this.leaflet = leaflet;

      if (token !== this.initializationToken || !this.canvas || !this.connected || !this.el.isConnected) return;

      const { minimum, maximum } = this.getZoomLimits();
      this.map = leaflet.map(this.canvas, {
        attributionControl: false,
        fadeAnimation: false,
        inertia: false,
        keyboard: true,
        markerZoomAnimation: false,
        maxZoom: maximum,
        minZoom: minimum,
        trackResize: false,
        zoomAnimation: false,
        zoomControl: true,
      });

      this.syncView();
      await this.syncBaseLayer();

      if (token !== this.initializationToken || !this.map || !this.connected) return;

      this.syncMarkers();
      this.observeResize();
      this.map.invalidateSize({ animate: false, pan: false });
      this.qReady.emit();
    } catch (error) {
      if (token === this.initializationToken) {
        this.destroyMap();
        console.error('QMap: Leaflet failed to initialize', error);
      }
    }
  }

  private getZoomLimits(): { minimum: number; maximum: number } {
    const minimum = Number.isFinite(this.minZoom) ? this.minZoom : 0;
    const requestedMaximum = Number.isFinite(this.maxZoom) ? this.maxZoom : 19;
    return { minimum, maximum: Math.max(minimum, requestedMaximum) };
  }

  private getCenter(): [number, number] {
    const latitude = Number.isFinite(this.centerLatitude) ? Math.max(-90, Math.min(90, this.centerLatitude)) : 0;
    const longitude = Number.isFinite(this.centerLongitude) ? Math.max(-180, Math.min(180, this.centerLongitude)) : 0;
    return [latitude, longitude];
  }

  private getZoom(): number {
    const { minimum, maximum } = this.getZoomLimits();
    const zoom = Number.isFinite(this.zoom) ? this.zoom : minimum;
    return Math.max(minimum, Math.min(maximum, zoom));
  }

  private getProvider(): QMapProvider {
    return this.provider === 'google' ? 'google' : 'tiles';
  }

  private getGoogleMapType(): QMapGoogleMapType {
    return GOOGLE_MAP_TYPES.includes(this.googleMapType) ? this.googleMapType : 'roadmap';
  }

  private syncView() {
    if (!this.map) return;
    this.map.setView(this.getCenter(), this.getZoom(), { animate: false });
  }

  private async syncBaseLayer(): Promise<void> {
    const map = this.map;
    const leaflet = this.leaflet;
    const token = ++this.baseLayerToken;

    this.isUsingTileFallback = false;
    this.removeBaseLayer();
    if (!map || !leaflet) return;

    try {
      const layer = await this.createBaseLayer(leaflet);
      if (!layer) return;

      if (token !== this.baseLayerToken || map !== this.map || !this.connected) {
        layer.remove();
        return;
      }

      this.baseLayer = layer;
      layer.addTo(map);
    } catch (error) {
      if (token !== this.baseLayerToken) return;

      this.removeBaseLayer();
      console.error(`QMap: ${this.getProvider()} map provider failed to initialize`, error);

      if (this.getProvider() === 'google') this.useTileFallback(map, leaflet);
    }
  }

  private async createBaseLayer(leaflet: LeafletModule): Promise<LeafletGridLayer | undefined> {
    const { minimum, maximum } = this.getZoomLimits();

    if (this.getProvider() === 'google') {
      const apiKey = this.googleApiKey.trim();
      if (!apiKey) return undefined;

      await loadGoogleMapsApi(apiKey);
      const GoogleMutant = await loadGoogleMutantConstructor(leaflet);
      return new GoogleMutant({
        type: this.getGoogleMapType(),
        minZoom: minimum,
        maxZoom: maximum,
      });
    }

    return this.createTileLayer(leaflet);
  }

  private createTileLayer(leaflet: LeafletModule): LeafletGridLayer | undefined {
    const tileUrl = this.tileUrl.trim();
    if (!tileUrl) return undefined;

    const { minimum, maximum } = this.getZoomLimits();
    return leaflet.tileLayer(tileUrl, {
      attribution: '',
      minZoom: minimum,
      maxZoom: maximum,
    });
  }

  private useTileFallback(map: LeafletMap, leaflet: LeafletModule) {
    const layer = this.createTileLayer(leaflet);
    if (!layer) return;

    try {
      this.baseLayer = layer;
      layer.addTo(map);
      this.isUsingTileFallback = true;
    } catch (error) {
      this.removeBaseLayer();
      console.error('QMap: fallback tile provider failed to initialize', error);
    }
  }

  private removeBaseLayer() {
    this.baseLayer?.remove();
    this.baseLayer = undefined;
  }

  private syncMarkers() {
    if (!this.map || !this.leaflet) return;

    const nextRecords = new Map<string, QMapMarker>();
    for (const marker of getMapMarkers(this.markers)) nextRecords.set(getMapMarkerKey(marker.id), marker);
    this.markerRecords = nextRecords;

    for (const key of this.markerLayers.keys()) {
      if (!nextRecords.has(key)) this.removeMarker(key);
    }

    for (const [key, marker] of nextRecords) {
      const layer = this.markerLayers.get(key);
      if (layer) {
        layer.setLatLng([marker.latitude, marker.longitude]);
        this.updateMarkerElement(key, marker);
      } else {
        this.addMarker(key, marker);
      }
    }
  }

  private addMarker(key: string, marker: QMapMarker) {
    if (!this.map || !this.leaflet) return;

    const markerContent = document.createElement('span');
    markerContent.className = 'q-map-marker__center';
    markerContent.setAttribute('aria-hidden', 'true');

    const icon = this.leaflet.divIcon({
      className: 'q-map-marker',
      html: markerContent,
      iconAnchor: [0, 0],
      iconSize: [0, 0],
    });
    const layer = this.leaflet.marker([marker.latitude, marker.longitude], {
      icon,
      keyboard: false,
      riseOnHover: true,
      riseOffset: 1000,
      title: marker.label,
    });
    layer.addTo(this.map);
    this.markerLayers.set(key, layer);

    const element = layer.getElement();
    if (!element) return;

    const click = (event: MouseEvent) => this.selectMarker(key, event);
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      this.selectMarker(key, event);
    };

    element.addEventListener('click', click);
    element.addEventListener('keydown', keydown);
    this.markerListeners.set(key, { element, click, keydown });
    this.updateMarkerElement(key, marker);
  }

  private updateMarkerElement(key: string, marker: QMapMarker) {
    const element = this.markerListeners.get(key)?.element;
    if (!element) return;

    for (const variant of MARKER_VARIANTS) element.classList.remove(`variant-${variant}`);
    element.classList.add(`variant-${marker.variant || 'default'}`);
    element.classList.toggle('is-selected', this.isMarkerSelected(marker.id));
    element.setAttribute('part', 'marker');
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-label', marker.label);
    element.setAttribute('aria-pressed', this.isMarkerSelected(marker.id) ? 'true' : 'false');
    element.setAttribute('data-marker-id', key);
    element.setAttribute('title', marker.label);
  }

  private syncSelectedMarkers() {
    for (const [key, marker] of this.markerRecords) this.updateMarkerElement(key, marker);
  }

  private isMarkerSelected(id: QMapMarkerId): boolean {
    return this.selectedMarkerId !== undefined && getMapMarkerKey(this.selectedMarkerId) === getMapMarkerKey(id);
  }

  private selectMarker(key: string, originalEvent: MouseEvent | KeyboardEvent) {
    const marker = this.markerRecords.get(key);
    if (marker) this.qMarkerSelect.emit({ marker, originalEvent });
  }

  private removeMarker(key: string) {
    const listeners = this.markerListeners.get(key);
    if (listeners) {
      listeners.element.removeEventListener('click', listeners.click);
      listeners.element.removeEventListener('keydown', listeners.keydown);
      this.markerListeners.delete(key);
    }

    const layer = this.markerLayers.get(key);
    if (layer) {
      layer.remove();
      this.markerLayers.delete(key);
    }
  }

  private observeResize() {
    if (!this.canvas || typeof ResizeObserver === 'undefined') return;

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
    this.resizeObserver.observe(this.canvas);
  }

  private scheduleResize() {
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      this.map?.invalidateSize({ animate: false, debounceMoveend: true, pan: false });
    });
  }

  private destroyMap() {
    this.baseLayerToken += 1;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    if (this.resizeFrame !== undefined) {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = undefined;
    }

    for (const key of [...this.markerLayers.keys()]) this.removeMarker(key);
    this.markerRecords.clear();
    this.removeBaseLayer();
    this.map?.remove();
    this.map = undefined;
  }

  private renderAttribution() {
    if (this.getProvider() !== 'tiles' && !this.isUsingTileFallback) return null;

    const attribution = this.attribution.trim();
    if (!attribution) return null;

    const attributionUrl = this.getAttributionUrl();
    if (!attributionUrl) return <span class="map-attribution" part="attribution">{attribution}</span>;

    return (
      <a class="map-attribution" part="attribution" href={attributionUrl} target="_blank" rel="noopener noreferrer">
        {attribution}
        <span class="visually-hidden"> (opens in a new tab)</span>
      </a>
    );
  }

  private getAttributionUrl(): string | undefined {
    const value = this.attributionUrl.trim();
    if (!value) return undefined;

    try {
      const url = new URL(value, this.el.ownerDocument.baseURI);
      return url.protocol === 'https:' || url.protocol === 'http:' ? value : undefined;
    } catch {
      return undefined;
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const isEmpty = this.getProvider() === 'google'
      ? this.googleApiKey.trim().length === 0
      : this.tileUrl.trim().length === 0;

    return (
      <div class="map-surface" part="surface">
        <div class="map-canvas" part="canvas" role="region" aria-label={this.ariaLabel} ref={this.setCanvas} />
        {isEmpty && (
          <div class="map-empty" part="empty" role="status">
            <slot name="empty">Map provider is not configured.</slot>
          </div>
        )}
        {this.renderAttribution()}
      </div>
    );
  }
}
