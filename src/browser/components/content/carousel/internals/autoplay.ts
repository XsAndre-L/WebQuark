export interface CarouselAutoplayConfig {
  enabled: boolean;
  navigable: boolean;
  suspended: boolean;
  reducedMotion: boolean;
  interval: number;
  timing?: 'interval' | 'completion' | 'pending';
  visitKey?: string;
  advanceSuspended?: boolean;
}

/** Separates persistent playback intent from temporary hover/visibility suspension. */
export class CarouselAutoplay {
  private config: CarouselAutoplayConfig = {
    enabled: false,
    navigable: false,
    suspended: true,
    reducedMotion: false,
    interval: 5000,
  };
  private requested = false;
  private timer?: ReturnType<typeof setTimeout>;
  private completed = false;

  constructor(
    private readonly advance: () => boolean,
    private readonly changed: (playing: boolean, requested: boolean) => void,
  ) {}

  configure(config: CarouselAutoplayConfig): void {
    const interval = Number.isFinite(config.interval) && config.interval > 0 ? config.interval : 5000;
    const visitChanged = config.visitKey !== this.config.visitKey;
    const timingChanged = interval !== this.config.interval || config.timing !== this.config.timing || visitChanged;
    if (visitChanged)
      this.completed = false;
    if (!config.enabled)
      this.requested = false;
    else if (!this.config.enabled)
      this.requested = !config.reducedMotion;
    else if (config.reducedMotion && !this.config.reducedMotion)
      this.requested = false;

    this.config = { ...config, interval };
    if (timingChanged)
      this.clearTimer();
    this.sync();
  }

  play(): void {
    if (!this.config.enabled)
      return;

    this.requested = true;
    this.sync();
  }

  pause(): void {
    this.requested = false;
    this.sync();
  }

  disconnect(): void {
    this.config = { ...this.config, suspended: true };
    this.sync();
  }

  complete(visitKey: string): void {
    if (this.config.timing !== 'completion' || visitKey !== this.config.visitKey)
      return;

    this.completed = true;
    this.sync();
  }

  private sync(): void {
    const playing = this.requested && this.config.enabled && this.config.navigable && !this.config.suspended;
    const advancing = playing && !this.config.advanceSuspended;
    this.changed(playing, this.requested);

    if (!advancing || this.config.timing === 'pending') {
      this.clearTimer();
      return;
    }

    if (this.config.timing === 'completion') {
      this.clearTimer();
      if (this.completed) {
        this.completed = false;
        if (!this.advance())
          this.pause();
      }
      return;
    }

    if (this.timer === undefined) {
      this.timer = setTimeout(() => {
        this.timer = undefined;
        if (!this.advance())
          this.pause();
        else
          this.sync();
      }, this.config.interval);
    }
  }

  private clearTimer(): void {
    if (this.timer === undefined)
      return;

    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
