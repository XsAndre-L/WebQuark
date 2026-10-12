export interface CarouselAutoplayConfig {
  enabled: boolean;
  navigable: boolean;
  suspended: boolean;
  reducedMotion: boolean;
  interval: number;
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
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly advance: () => boolean,
    private readonly changed: (playing: boolean, requested: boolean) => void,
  ) {}

  configure(config: CarouselAutoplayConfig): void {
    const interval = Number.isFinite(config.interval) && config.interval > 0 ? config.interval : 5000;
    const timingChanged = interval !== this.config.interval;
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

  private sync(): void {
    const playing = this.requested && this.config.enabled && this.config.navigable && !this.config.suspended;
    if (!playing)
      this.clearTimer();
    else if (this.timer === undefined) {
      this.timer = setInterval(() => {
        if (!this.advance())
          this.pause();
      }, this.config.interval);
    }
    this.changed(playing, this.requested);
  }

  private clearTimer(): void {
    if (this.timer === undefined)
      return;

    clearInterval(this.timer);
    this.timer = undefined;
  }
}
