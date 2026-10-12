interface QToastTimer {
  callback: () => void;
  remaining: number;
  startedAt: number;
  timeoutId?: ReturnType<typeof setTimeout>;
  pauseReasons: Set<string>;
}

export class ToastTimerManager {
  private readonly timers = new Map<string, QToastTimer>();

  start(id: string, duration: number, callback: () => void): void {
    this.clear(id);

    if (duration === 0) {
      return;
    }

    const timer: QToastTimer = {
      callback,
      remaining: duration,
      startedAt: Date.now(),
      pauseReasons: new Set(),
    };

    this.timers.set(id, timer);
    this.schedule(id, timer);
  }

  pause(id: string, reason: string): void {
    const timer = this.timers.get(id);
    if (!timer || timer.pauseReasons.has(reason)) {
      return;
    }

    if (timer.pauseReasons.size === 0) {
      timer.remaining = Math.max(
        0,
        timer.remaining - (Date.now() - timer.startedAt),
      );
      if (timer.timeoutId !== undefined) {
        clearTimeout(timer.timeoutId);
        timer.timeoutId = undefined;
      }
    }

    timer.pauseReasons.add(reason);
  }

  resume(id: string, reason: string): void {
    const timer = this.timers.get(id);
    if (
      !timer ||
      !timer.pauseReasons.delete(reason) ||
      timer.pauseReasons.size > 0
    ) {
      return;
    }

    if (timer.remaining === 0) {
      this.finish(id, timer);
      return;
    }

    timer.startedAt = Date.now();
    this.schedule(id, timer);
  }

  pauseAll(reason: string): void {
    this.timers.forEach((_timer, id) => this.pause(id, reason));
  }

  resumeAll(reason: string): void {
    this.timers.forEach((_timer, id) => this.resume(id, reason));
  }

  clear(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) {
      return;
    }

    if (timer.timeoutId !== undefined) {
      clearTimeout(timer.timeoutId);
    }
    this.timers.delete(id);
  }

  clearAll(): void {
    this.timers.forEach((_timer, id) => this.clear(id));
  }

  private schedule(id: string, timer: QToastTimer): void {
    timer.startedAt = Date.now();
    timer.timeoutId = setTimeout(() => this.finish(id, timer), timer.remaining);
  }

  private finish(id: string, timer: QToastTimer): void {
    if (this.timers.get(id) !== timer) {
      return;
    }

    this.timers.delete(id);
    timer.callback();
  }
}
