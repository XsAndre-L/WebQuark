import { Component, Element, Event, EventEmitter, h, Prop, State, Watch } from '@stencil/core';
import type { Layer as LeafletLayer, LeafletMouseEvent, Map as LeafletMap } from 'leaflet';

import { MapBaseLayerController } from './internals/base-layer';
import {
  applyMapBounds,
  getInitialLeafletMapBounds,
  getMapBoundsViscosity,
  resolveMapBounds,
} from './internals/bounds';
import { hasGoogleMapsConfiguration, loadGoogleMapsApi } from './internals/google-maps';
import { loadGoogleMutantConstructor } from './internals/google-mutant';
import { loadMapLibreLayerFactory, waitForMapLibreLayerReady } from './internals/maplibre';
import { normalizeMapMarkerClusteringOptions } from './internals/marker-cluster-index';
import { MapMarkerController } from './internals/marker-controller';
import type {
  QMapBoundsInput,
  QMapClusterSelectDetail,
  QMapClickDetail,
  QMapErrorCode,
  QMapErrorDetail,
  QMapGoogleMapType,
  QMapMarkerId,
  QMapMarkerInput,
  QMapMarkerSelectDetail,
  QMapProvider,
  QMapStatus,
  QMapStatusChangeDetail,
} from './map.types';

type LeafletModule = typeof import('leaflet');

const GOOGLE_MAP_TYPES: QMapGoogleMapType[] = ['roadmap', 'satellite', 'terrain', 'hybrid'];
const SMOOTH_ZOOM_DELTA = 0.5;
const SMOOTH_ZOOM_SNAP = 0.25;
const SMOOTH_WHEEL_DEBOUNCE_MS = 16;
const SMOOTH_WHEEL_PIXELS_PER_LEVEL = 120;
const VECTOR_SYMBOL_FADE_DURATION_MS = 750;

/**
 * Framework-neutral interactive map powered by Leaflet.
 *
 * @slot empty - Content shown when the requested provider is missing required configuration.
 * @slot error - Content shown after provider initialization fails without a usable fallback.
 * @part surface - Outer clipped map surface.
 * @part canvas - Leaflet map canvas.
 * @part marker - Each interactive map marker.
 * @part cluster - Each interactive marker cluster.
 * @part marker-badge - A marker's optional status badge.
 * @part marker-callout - A marker's optional non-interactive callout.
 * @part attribution - Provider attribution text or link.
 * @part empty - Missing-configuration overlay.
 * @part error - Provider-error overlay.
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
 * @cssprop --q-map-marker-selected-shadow - Selected-marker elevation or glow shadow.
 * @cssprop --q-map-marker-cluster-size - Cluster diameter.
 * @cssprop --q-map-marker-ring-color - Optional solid or dashed status-ring color.
 * @cssprop --q-map-marker-pulse-color - Optional pulse color.
 * @cssprop --q-map-marker-content-gap - Space exposing the marker status color around image or text content.
 * @cssprop --q-map-marker-content-bg - Background behind marker image or fallback text.
 * @cssprop --q-map-marker-content-color - Marker fallback-text color.
 * @cssprop --q-map-attribution-bg - Attribution background.
 * @cssprop --q-map-attribution-color - Attribution foreground.
 */
@Component({
  tag: 'q-map',
  styleUrl: 'map.css',
  shadow: true,
})
export class QMap {
  @Element() el!: HTMLElement;

  /** Selects raster tiles, styled vector data, or Google imagery; non-tile failures may use tileUrl as a fallback. */
  @Prop() provider: QMapProvider = 'tiles';

  /** Supplies the tile URL template for the tiles provider and optional vector/Google fallback. */
  @Prop() tileUrl: string = '';

  /** Supplies a MapLibre Style Specification URL for the vector provider. */
  @Prop() vectorStyleUrl: string = '';

  /** Supplies the browser-restricted key used only when WebQuark must load Google Maps. */
  @Prop() googleApiKey: string = '';

  /** Chooses the Google base-map style, normalizing unsupported values to roadmap. */
  @Prop() googleMapType: QMapGoogleMapType = 'roadmap';

  /** Renders plain-text attribution whenever raster tiles or styled vectors are active. */
  @Prop() attribution: string = '';

  /** Links map attribution only when the value resolves to an HTTP(S) URL. */
  @Prop() attributionUrl: string = '';

  /** Controls viewport latitude; finite values are clamped to the geographic range. */
  @Prop() centerLatitude: number = 0;

  /** Controls viewport longitude; finite values are clamped to the geographic range. */
  @Prop() centerLongitude: number = 0;

  /** Controls the viewport zoom and is clamped between the normalized zoom limits. */
  @Prop() zoom: number = 2;

  /** Controls whether the built-in plus/minus zoom control is rendered. */
  @Prop() zoomControls: boolean = true;

  /** Sets the lowest permitted zoom; non-finite values normalize to zero. */
  @Prop() minZoom: number = 0;

  /** Sets the highest permitted zoom and never resolves below minZoom. */
  @Prop() maxZoom: number = 19;

  /** Constrains panning from a bounds object or JSON string; malformed updates preserve the last valid boundary. */
  @Prop() maxBounds?: QMapBoundsInput;

  /** Controls drag resistance at maxBounds and is clamped from zero to one. */
  @Prop() maxBoundsViscosity: number = 1;

  /** Reconciles marker records from an array or JSON string using type-stable IDs. */
  @Prop() markers: QMapMarkerInput = [];

  /** Groups nearby markers while preserving their stable source IDs. */
  @Prop() clusterMarkers: boolean = false;

  /** Sets the clustering radius in screen pixels and is clamped from 1 to 200. */
  @Prop() clusterRadius: number = 48;

  /** Sets the minimum number of nearby markers needed to form a cluster. */
  @Prop() clusterMinPoints: number = 2;

  /** Sets the last zoom level where clusters may remain; defaults to one below maxZoom. */
  @Prop() clusterMaxZoom?: number;

  /** Controls which marker exposes its selected visual and aria-pressed state. */
  @Prop() selectedMarkerId?: QMapMarkerId;

  /** Provides the accessible name announced for the interactive map region. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = 'Interactive map';

  /** Fires after Leaflet setup and the initial provider attempt complete. */
  @Event() qReady!: EventEmitter<void>;

  /** Reports genuine map-background clicks after Leaflet excludes drags and interactive layers. */
  @Event() qMapClick!: EventEmitter<QMapClickDetail>;

  /** Reports marker activation without mutating selectedMarkerId. */
  @Event() qMarkerSelect!: EventEmitter<QMapMarkerSelectDetail>;

  /** Reports cluster activation before the default centre-and-zoom action. */
  @Event({ cancelable: true }) qClusterSelect!: EventEmitter<QMapClusterSelectDetail>;

  /** Reports provider lifecycle transitions, including the active fallback provider. */
  @Event() qStatusChange!: EventEmitter<QMapStatusChangeDetail>;

  /** Reports serializable configuration and initialization failures. */
  @Event() qError!: EventEmitter<QMapErrorDetail>;

  @State() private providerStatus: QMapStatus = 'initializing';
  @State() private activeProvider?: QMapProvider;
  @State() private usingFallback = false;
  @State() private errorMessage?: string;

  private leaflet?: LeafletModule;
  private map?: LeafletMap;
  private canvas?: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private resizeFrame?: number;
  private initializationToken = 0;
  private layerController?: MapBaseLayerController<LeafletLayer>;
  private markerController?: MapMarkerController;
  private lastInvalidBoundsInput?: QMapBoundsInput;
  private reportedRequestedProvider?: QMapProvider;
  private hasLoaded = false;
  private connected = false;

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
  @Watch('vectorStyleUrl')
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
    this.markerController?.sync(this.markers);
  }

  @Watch('clusterMarkers')
  @Watch('clusterRadius')
  @Watch('clusterMinPoints')
  @Watch('clusterMaxZoom')
  handleMarkerClusteringChange() {
    this.markerController?.sync(this.markers);
  }

  @Watch('selectedMarkerId')
  handleSelectedMarkerChange() {
    this.markerController?.syncSelection();
  }

  @Watch('centerLatitude')
  @Watch('centerLongitude')
  @Watch('zoom')
  handleViewChange() {
    this.syncView(true);
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
    this.markerController?.sync(this.markers);
  }

  @Watch('maxBounds')
  @Watch('maxBoundsViscosity')
  handleBoundsChange() {
    this.syncBounds(true);
  }

  @Watch('zoomControls')
  handleZoomControlsChange() {
    if (!this.map) return;
    this.destroyMap();
    void this.initializeMap();
  }

  private setCanvas = (element: HTMLDivElement | null) => {
    this.canvas = element ?? undefined;
  };

  private handleMapClick = (event: LeafletMouseEvent): void => {
    this.qMapClick.emit({
      latitude: event.latlng.lat,
      longitude: event.latlng.lng,
      originalEvent: event.originalEvent,
    });
  };

  private async initializeMap(): Promise<void> {
    if (this.map || !this.canvas || !this.connected || typeof window === 'undefined') return;

    const token = ++this.initializationToken;
    this.setProviderStatus('initializing', undefined, false, true);

    try {
      const leaflet = this.leaflet ?? (await import('leaflet'));
      this.leaflet = leaflet;
      if (token !== this.initializationToken || !this.canvas || !this.connected || !this.el.isConnected) return;

      const { minimum, maximum } = this.getZoomLimits();
      const boundsResolution = resolveMapBounds(this.maxBounds);
      const smoothMotion = !this.prefersReducedMotion();
      this.map = leaflet.map(this.canvas, {
        attributionControl: false,
        fadeAnimation: smoothMotion,
        inertia: false,
        keyboard: true,
        markerZoomAnimation: smoothMotion,
        maxBounds: getInitialLeafletMapBounds(boundsResolution),
        maxBoundsViscosity: getMapBoundsViscosity(this.maxBoundsViscosity),
        maxZoom: maximum,
        minZoom: minimum,
        trackResize: false,
        wheelDebounceTime: smoothMotion ? SMOOTH_WHEEL_DEBOUNCE_MS : 40,
        wheelPxPerZoomLevel: smoothMotion ? SMOOTH_WHEEL_PIXELS_PER_LEVEL : 60,
        zoomAnimation: smoothMotion,
        zoomControl: this.zoomControls,
        zoomDelta: smoothMotion ? SMOOTH_ZOOM_DELTA : 1,
        zoomSnap: smoothMotion ? SMOOTH_ZOOM_SNAP : 1,
      });
      if (boundsResolution.kind === 'invalid') this.reportInvalidBounds(boundsResolution.message);
      else this.lastInvalidBoundsInput = undefined;

      this.bindMapEvents(this.map);
      this.createControllers(this.map, leaflet);
      this.syncView();
      await this.syncBaseLayer();
      if (token !== this.initializationToken || !this.map || !this.connected) return;

      this.markerController?.sync(this.markers);
      this.observeResize();
      this.map.invalidateSize({ animate: false, pan: false });
      this.qReady.emit();
    } catch (error) {
      if (token !== this.initializationToken) return;
      this.destroyMap();
      this.errorMessage = 'Map failed to initialize.';
      this.setProviderStatus('error', undefined, false);
      this.reportError('leaflet-initialization-failed', error, false);
    }
  }

  private bindMapEvents(map: LeafletMap): void {
    map.on('click', this.handleMapClick);
  }

  private unbindMapEvents(map: LeafletMap): void {
    map.off('click', this.handleMapClick);
  }

  private createControllers(map: LeafletMap, leaflet: LeafletModule): void {
    this.layerController = new MapBaseLayerController<LeafletLayer>({
      attach: async (layer, provider) => {
        layer.addTo(map);
        if (provider === 'vector') await waitForMapLibreLayerReady(layer);
      },
      createGoogle: async config => {
        await loadGoogleMapsApi(config.googleApiKey);
        const GoogleMutant = await loadGoogleMutantConstructor(leaflet);
        return new GoogleMutant({
          type: config.googleMapType,
          minZoom: config.minZoom,
          maxZoom: config.maxZoom,
        });
      },
      createTiles: config => leaflet.tileLayer(config.tileUrl, {
        attribution: '',
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
      }),
      createVector: async config => {
        const createMapLibreLayer = await loadMapLibreLayerFactory(leaflet);
        return createMapLibreLayer({
          attributionControl: false,
          fadeDuration: VECTOR_SYMBOL_FADE_DURATION_MS,
          interactive: false,
          maxTileCacheZoomLevels: 6,
          maxZoom: config.maxZoom,
          minZoom: config.minZoom,
          padding: 0.2,
          style: config.vectorStyleUrl,
          updateInterval: 16,
        });
      },
    });
    this.markerController = new MapMarkerController({
      map,
      leaflet,
      getSelectedMarkerId: () => this.selectedMarkerId,
      getClusteringOptions: () => normalizeMapMarkerClusteringOptions(
        this.clusterMarkers,
        this.clusterRadius,
        this.clusterMinPoints,
        this.clusterMaxZoom,
        map.getMaxZoom(),
      ),
      prefersReducedMotion: () => this.prefersReducedMotion(),
      onMarkerSelect: (marker, originalEvent) => this.qMarkerSelect.emit({ marker, originalEvent }),
      onClusterSelect: detail => this.qClusterSelect.emit(detail).defaultPrevented,
    });
  }

  private async syncBaseLayer(): Promise<void> {
    const controller = this.layerController;
    if (!controller) return;

    const requestedProvider = this.getProvider();
    const current = controller.getActiveState();
    this.errorMessage = undefined;
    this.setProviderStatus('initializing', current.activeProvider, current.usingFallback);
    const { minimum, maximum } = this.getZoomLimits();
    const result = await controller.sync({
      requestedProvider,
      tileUrl: this.tileUrl.trim(),
      vectorStyleUrl: this.vectorStyleUrl.trim(),
      googleApiKey: this.googleApiKey.trim(),
      googleApiAvailable: hasGoogleMapsConfiguration(),
      googleMapType: this.getGoogleMapType(),
      minZoom: minimum,
      maxZoom: maximum,
    });
    if (controller !== this.layerController || result.kind === 'stale') return;

    if (result.kind === 'empty') {
      this.setProviderStatus('empty', undefined, false);
      return;
    }
    if (result.kind === 'ready') {
      if (result.warning) this.reportError('provider-initialization-failed', result.warning, true);
      this.setProviderStatus('ready', result.activeProvider, result.usingFallback);
      return;
    }

    this.reportError('provider-initialization-failed', result.error, true);
    if (result.fallbackError) this.reportError('fallback-initialization-failed', result.fallbackError, true);
    this.errorMessage = result.activeProvider
      ? 'The requested map provider failed. The previous map remains available.'
      : 'Map imagery failed to load.';
    this.setProviderStatus('error', result.activeProvider, result.usingFallback);
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
    return this.provider === 'google' || this.provider === 'vector' ? this.provider : 'tiles';
  }

  private getGoogleMapType(): QMapGoogleMapType {
    return GOOGLE_MAP_TYPES.includes(this.googleMapType) ? this.googleMapType : 'roadmap';
  }

  private syncView(animate = false): void {
    this.map?.setView(this.getCenter(), this.getZoom(), {
      animate: animate && !this.prefersReducedMotion(),
    });
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private syncBounds(reportInvalid: boolean): void {
    if (!this.map) return;
    const resolution = resolveMapBounds(this.maxBounds);
    applyMapBounds(this.map, resolution, this.maxBoundsViscosity);
    if (resolution.kind === 'invalid') {
      if (reportInvalid) this.reportInvalidBounds(resolution.message);
    } else {
      this.lastInvalidBoundsInput = undefined;
    }
  }

  private reportInvalidBounds(message: string): void {
    if (this.lastInvalidBoundsInput === this.maxBounds) return;
    this.lastInvalidBoundsInput = this.maxBounds;
    this.reportError('invalid-max-bounds', new Error(message), true);
  }

  private setProviderStatus(
    status: QMapStatus,
    activeProvider: QMapProvider | undefined,
    usingFallback: boolean,
    force = false,
  ): void {
    const changed = status !== this.providerStatus
      || activeProvider !== this.activeProvider
      || usingFallback !== this.usingFallback
      || this.getProvider() !== this.reportedRequestedProvider;
    this.providerStatus = status;
    this.activeProvider = activeProvider;
    this.usingFallback = usingFallback;
    this.reportedRequestedProvider = this.getProvider();
    if (changed || force) {
      this.qStatusChange.emit({
        status,
        requestedProvider: this.getProvider(),
        activeProvider,
        usingFallback,
      });
    }
  }

  private reportError(code: QMapErrorCode, error: unknown, recoverable: boolean): void {
    this.qError.emit({
      code,
      message: error instanceof Error ? error.message : String(error),
      requestedProvider: this.getProvider(),
      recoverable,
    });
  }

  private observeResize(): void {
    if (!this.canvas || typeof ResizeObserver === 'undefined') return;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
    this.resizeObserver.observe(this.canvas);
  }

  private scheduleResize(): void {
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      this.map?.invalidateSize({ animate: false, debounceMoveend: true, pan: false });
      this.syncBounds(false);
    });
  }

  private destroyMap(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    if (this.resizeFrame !== undefined) {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = undefined;
    }

    this.markerController?.destroy();
    this.markerController = undefined;
    this.layerController?.destroy();
    this.layerController = undefined;
    const map = this.map;
    if (map) {
      this.unbindMapEvents(map);
      map.remove();
    }
    this.map = undefined;
  }

  private renderAttribution() {
    if (this.activeProvider !== 'tiles' && this.activeProvider !== 'vector') return null;
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

  render() {
    return (
      <div class="map-surface" part="surface">
        <div
          class="map-canvas"
          part="canvas"
          role="region"
          aria-label={this.ariaLabel}
          aria-busy={this.providerStatus === 'initializing' ? 'true' : undefined}
          ref={this.setCanvas}
        />
        <q-icon class="map-icon-registration" aria-hidden="true" />
        {this.providerStatus === 'empty' && (
          <div class="map-empty" part="empty" role="status">
            <slot name="empty">Map provider is not configured.</slot>
          </div>
        )}
        {this.providerStatus === 'error' && (
          <div class="map-empty map-error" part="error" role="alert">
            <slot name="error">{this.errorMessage ?? 'Map imagery is unavailable.'}</slot>
          </div>
        )}
        {this.renderAttribution()}
      </div>
    );
  }
}
