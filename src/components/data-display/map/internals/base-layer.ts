import type { QMapGoogleMapType, QMapProvider } from '../map.types';

export interface RemovableMapLayer {
  remove(): unknown;
}

export interface MapBaseLayerOperations<TLayer extends RemovableMapLayer> {
  attach(layer: TLayer, provider: QMapProvider): Promise<unknown> | unknown;
  createGoogle(config: QMapBaseLayerConfig): Promise<TLayer>;
  createTiles(config: QMapBaseLayerConfig): TLayer;
  createVector(config: QMapBaseLayerConfig): Promise<TLayer>;
}

export interface QMapBaseLayerConfig {
  requestedProvider: QMapProvider;
  tileUrl: string;
  vectorStyleUrl: string;
  googleApiKey: string;
  googleApiAvailable: boolean;
  googleMapType: QMapGoogleMapType;
  minZoom: number;
  maxZoom: number;
}

interface ActiveLayer<TLayer> {
  layer: TLayer;
  provider: QMapProvider;
  usingFallback: boolean;
}

interface ActiveLayerState {
  activeProvider?: QMapProvider;
  usingFallback: boolean;
}

export type QMapBaseLayerSyncResult =
  | ({ kind: 'empty' } & ActiveLayerState)
  | ({ kind: 'ready'; warning?: unknown } & Required<ActiveLayerState>)
  | ({ kind: 'error'; error: unknown; fallbackError?: unknown } & ActiveLayerState)
  | { kind: 'stale' };

type LayerAttempt<TLayer> =
  | { kind: 'ready'; candidate: TLayer }
  | { kind: 'error'; error: unknown }
  | { kind: 'stale' };

type LayerCommitResult =
  | ({ kind: 'ready' } & Required<ActiveLayerState>)
  | ({ kind: 'error'; error: unknown } & ActiveLayerState)
  | { kind: 'stale' };

/** Coordinates asynchronous provider creation and atomic base-layer replacement. */
export class MapBaseLayerController<TLayer extends RemovableMapLayer> {
  private revision = 0;
  private active?: ActiveLayer<TLayer>;

  constructor(private readonly operations: MapBaseLayerOperations<TLayer>) {}

  getActiveState(): ActiveLayerState {
    return {
      activeProvider: this.active?.provider,
      usingFallback: this.active?.usingFallback ?? false,
    };
  }

  async sync(config: QMapBaseLayerConfig): Promise<QMapBaseLayerSyncResult> {
    const revision = ++this.revision;
    if (!this.isConfigured(config)) {
      this.clearActiveLayer();
      return { kind: 'empty', activeProvider: undefined, usingFallback: false };
    }

    const primary = await this.createCandidate(config.requestedProvider, config, revision);
    if (primary.kind === 'stale') return primary;

    const primaryResult = primary.kind === 'ready'
      ? await this.commit(primary.candidate, config.requestedProvider, false, revision)
      : primary;
    if (primaryResult.kind === 'stale' || primaryResult.kind === 'ready') return primaryResult;

    if (config.requestedProvider === 'tiles' || !config.tileUrl.trim()) {
      return { kind: 'error', error: primaryResult.error, ...this.getActiveState() };
    }

    const fallback = await this.createCandidate('tiles', config, revision);
    if (fallback.kind === 'stale') return fallback;
    if (fallback.kind === 'error') {
      return { kind: 'error', error: primaryResult.error, fallbackError: fallback.error, ...this.getActiveState() };
    }

    const result = await this.commit(fallback.candidate, 'tiles', true, revision);
    if (result.kind === 'ready') return { ...result, warning: primaryResult.error };
    if (result.kind === 'error') {
      return { kind: 'error', error: primaryResult.error, fallbackError: result.error, ...this.getActiveState() };
    }
    return result;
  }

  destroy(): void {
    this.revision += 1;
    this.clearActiveLayer();
  }

  private isConfigured(config: QMapBaseLayerConfig): boolean {
    if (config.requestedProvider === 'google') {
      return config.googleApiAvailable || config.googleApiKey.trim().length > 0;
    }
    if (config.requestedProvider === 'vector') {
      return config.vectorStyleUrl.trim().length > 0;
    }
    return config.tileUrl.trim().length > 0;
  }

  private async createCandidate(
    provider: QMapProvider,
    config: QMapBaseLayerConfig,
    revision: number,
  ): Promise<LayerAttempt<TLayer>> {
    try {
      const candidate = provider === 'google'
        ? await this.operations.createGoogle(config)
        : provider === 'vector'
          ? await this.operations.createVector(config)
          : this.operations.createTiles(config);

      if (revision !== this.revision) {
        this.removeLayer(candidate);
        return { kind: 'stale' };
      }
      return { kind: 'ready', candidate };
    } catch (error) {
      return revision === this.revision ? { kind: 'error', error } : { kind: 'stale' };
    }
  }

  private async commit(
    candidate: TLayer,
    provider: QMapProvider,
    usingFallback: boolean,
    revision: number,
  ): Promise<LayerCommitResult> {
    if (revision !== this.revision) {
      this.removeLayer(candidate);
      return { kind: 'stale' };
    }

    try {
      await this.operations.attach(candidate, provider);
    } catch (error) {
      this.removeLayer(candidate);
      return { kind: 'error', error, ...this.getActiveState() };
    }

    if (revision !== this.revision) {
      this.removeLayer(candidate);
      return { kind: 'stale' };
    }

    const previous = this.active;
    this.active = { layer: candidate, provider, usingFallback };
    if (previous?.layer !== candidate) this.removeLayer(previous?.layer);

    return { kind: 'ready', activeProvider: provider, usingFallback };
  }

  private clearActiveLayer(): void {
    this.removeLayer(this.active?.layer);
    this.active = undefined;
  }

  private removeLayer(layer: TLayer | undefined): void {
    if (!layer) return;
    try {
      layer.remove();
    } catch {
      // Cleanup is best-effort; Leaflet may already have detached the layer.
    }
  }
}
