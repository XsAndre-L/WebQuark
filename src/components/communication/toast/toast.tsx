import { Component, Method, Prop, State, Watch, h } from '@stencil/core';

import {
  registerToastHost,
  toast,
  unregisterToastHost,
  type QToastHostAdapter,
} from './toast-controller';
import type {
  QToastId,
  QToastItem,
  QToastOptions,
  QToastPosition,
  QToastRequest,
  QToastVariant,
} from './toast.types';
import { renderToastIcon } from './internals/icons';
import {
  DEFAULT_MAX_VISIBLE,
  enqueueToast,
  normalizeMaxVisible,
  promoteToCapacity,
  removeToast,
} from './internals/queue';
import { ToastTimerManager } from './internals/timers';

const DEFAULT_DURATIONS: Record<QToastVariant, number> = {
  info: 5_000,
  success: 5_000,
  warning: 8_000,
  danger: 0,
};

const EXIT_FALLBACK_MS = 250;
const ANNOUNCEMENT_GAP_MS = 50;
const ANNOUNCEMENT_HOLD_MS = 1_000;

/**
 * Global viewport toast host. Add exactly one instance near the application root,
 * then use the framework-neutral `toast` controller or the component methods.
 * @part stack - The visible toast stack.
 * @part item - A visible toast wrapper.
 * @part announcement - The shared polite live region.
 */
@Component({
  tag: 'q-toast',
  styleUrl: 'toast.css',
  shadow: true,
})
export class QToast {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  @Prop({ reflect: true }) position: QToastPosition = 'top-end';
  @Prop({ attribute: 'max-visible' }) maxVisible: number = DEFAULT_MAX_VISIBLE;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() visibleToasts: QToastItem[] = [];
  @State() announcementText: string = '';

  private pendingToasts: QToastItem[] = [];
  private readonly timers = new ToastTimerManager();
  private readonly exitFallbacks = new Map<
    QToastId,
    ReturnType<typeof setTimeout>
  >();
  private announcementQueue: string[] = [];
  private announcementTimer?: ReturnType<typeof setTimeout>;
  private isActiveHost: boolean = false;

  private readonly hostAdapter: QToastHostAdapter = {
    enqueue: (request, id) => this.enqueue(request, id),
    dismiss: (id) => this.dismissItem(id),
    clear: () => this.clearItems(),
  };

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  connectedCallback(): void {
    this.isActiveHost = registerToastHost(this.hostAdapter);

    if (this.isActiveHost) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  disconnectedCallback(): void {
    if (this.isActiveHost) {
      unregisterToastHost(this.hostAdapter);
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
      );
    }

    this.timers.clearAll();
    this.exitFallbacks.forEach((timeoutId) => clearTimeout(timeoutId));
    this.exitFallbacks.clear();
    this.clearAnnouncementTimer();
    this.announcementQueue = [];
    this.visibleToasts = [];
    this.pendingToasts = [];
    this.isActiveHost = false;
  }

  @Watch('maxVisible')
  handleMaxVisibleChange(): void {
    const result = promoteToCapacity(
      { visible: this.visibleToasts, pending: this.pendingToasts },
      this.maxVisible,
    );

    this.visibleToasts = result.visible;
    this.pendingToasts = result.pending;
    result.promoted.forEach((item) => this.activate(item));
  }

  // ======================== [4] PUBLIC METHODS (API) ===========================

  @Method()
  async info(
    title: string,
    description?: string,
    options?: QToastOptions,
  ): Promise<QToastId> {
    return toast.info(title, description, options);
  }

  @Method()
  async success(
    title: string,
    description?: string,
    options?: QToastOptions,
  ): Promise<QToastId> {
    return toast.success(title, description, options);
  }

  @Method()
  async warning(
    title: string,
    description?: string,
    options?: QToastOptions,
  ): Promise<QToastId> {
    return toast.warning(title, description, options);
  }

  @Method()
  async danger(
    title: string,
    description?: string,
    options?: QToastOptions,
  ): Promise<QToastId> {
    return toast.danger(title, description, options);
  }

  @Method()
  async error(
    title: string,
    description?: string,
    options?: QToastOptions,
  ): Promise<QToastId> {
    return toast.error(title, description, options);
  }

  @Method()
  async dismiss(id: QToastId): Promise<boolean> {
    return toast.dismiss(id);
  }

  @Method()
  async clear(): Promise<number> {
    return toast.clear();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.timers.pauseAll('document-hidden');
    } else {
      this.timers.resumeAll('document-hidden');
    }
  };

  private enqueue(request: QToastRequest, id: QToastId): void {
    const item: QToastItem = {
      id,
      title: request.title,
      description: request.description,
      variant: request.variant,
      duration: request.duration ?? DEFAULT_DURATIONS[request.variant],
      dismissible: request.dismissible ?? true,
      exiting: false,
    };
    const result = enqueueToast(
      { visible: this.visibleToasts, pending: this.pendingToasts },
      item,
      this.maxVisible,
    );

    this.visibleToasts = result.visible;
    this.pendingToasts = result.pending;
    if (result.shown) {
      this.activate(item);
    }
  }

  private dismissItem(id: QToastId): boolean {
    const visible = this.visibleToasts.find((item) => item.id === id);

    if (visible) {
      if (!visible.exiting) {
        this.timers.clear(id);
        this.visibleToasts = this.visibleToasts.map((item) =>
          item.id === id ? { ...item, exiting: true } : item,
        );
        this.scheduleRemoval(id);
      }
      return true;
    }

    const result = removeToast(
      { visible: this.visibleToasts, pending: this.pendingToasts },
      id,
      this.maxVisible,
    );
    this.pendingToasts = result.pending;
    return result.removed !== undefined;
  }

  private clearItems(): number {
    const count =
      this.visibleToasts.filter((item) => !item.exiting).length +
      this.pendingToasts.length;
    this.pendingToasts = [];
    this.visibleToasts.forEach((item) => {
      this.timers.clear(item.id);
      if (!item.exiting) {
        this.scheduleRemoval(item.id);
      }
    });
    this.visibleToasts = this.visibleToasts.map((item) => ({
      ...item,
      exiting: true,
    }));
    this.clearAnnouncementTimer();
    this.announcementQueue = [];
    this.announcementText = '';
    return count;
  }

  private activate(item: QToastItem): void {
    this.timers.start(item.id, item.duration, () => this.dismissItem(item.id));
    if (document.hidden) {
      this.timers.pause(item.id, 'document-hidden');
    }
    this.queueAnnouncement(
      item.description ? `${item.title}. ${item.description}` : item.title,
    );
  }

  private scheduleRemoval(id: QToastId): void {
    if (this.prefersReducedMotion()) {
      queueMicrotask(() => this.finalizeRemoval(id));
      return;
    }

    const existing = this.exitFallbacks.get(id);
    if (existing !== undefined) {
      clearTimeout(existing);
    }
    this.exitFallbacks.set(
      id,
      setTimeout(() => this.finalizeRemoval(id), EXIT_FALLBACK_MS),
    );
  }

  private finalizeRemoval(id: QToastId): void {
    const fallback = this.exitFallbacks.get(id);
    if (fallback !== undefined) {
      clearTimeout(fallback);
      this.exitFallbacks.delete(id);
    }

    const result = removeToast(
      { visible: this.visibleToasts, pending: this.pendingToasts },
      id,
      this.maxVisible,
    );
    this.visibleToasts = result.visible;
    this.pendingToasts = result.pending;
    result.promoted.forEach((item) => this.activate(item));
  }

  private handleAnimationEnd = (event: AnimationEvent, id: QToastId): void => {
    if (event.animationName === 'q-toast-exit') {
      this.finalizeRemoval(id);
    }
  };

  private queueAnnouncement(message: string): void {
    this.announcementQueue.push(message);
    if (this.announcementTimer === undefined) {
      this.showNextAnnouncement();
    }
  }

  private showNextAnnouncement(): void {
    const next = this.announcementQueue.shift();
    if (!next) {
      this.announcementText = '';
      this.announcementTimer = undefined;
      return;
    }

    this.announcementText = '';
    this.announcementTimer = setTimeout(() => {
      this.announcementText = next;
      this.announcementTimer = setTimeout(() => {
        this.announcementTimer = undefined;
        this.showNextAnnouncement();
      }, ANNOUNCEMENT_HOLD_MS);
    }, ANNOUNCEMENT_GAP_MS);
  }

  private clearAnnouncementTimer(): void {
    if (this.announcementTimer !== undefined) {
      clearTimeout(this.announcementTimer);
      this.announcementTimer = undefined;
    }
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const maxVisible = normalizeMaxVisible(this.maxVisible);

    return (
      <div class="viewport">
        <div
          class="stack"
          part="stack"
          role="region"
          aria-label="Notifications"
          style={{ '--q-toast-max-visible': `${maxVisible}` }}
        >
          {this.visibleToasts.map((item) => (
            <div
              class={{
                'toast-item': true,
                [`variant-${item.variant}`]: true,
                'is-exiting': item.exiting,
              }}
              part="item"
              key={item.id}
              onAnimationEnd={(event) =>
                this.handleAnimationEnd(event, item.id)
              }
              onMouseEnter={() => this.timers.pause(item.id, 'hover')}
              onMouseLeave={() => this.timers.resume(item.id, 'hover')}
              onFocusin={() => this.timers.pause(item.id, 'focus')}
              onFocusout={(event) => {
                const current = event.currentTarget as HTMLElement;
                if (!current.contains(event.relatedTarget as Node | null)) {
                  this.timers.resume(item.id, 'focus');
                }
              }}
            >
              <q-alert
                heading={item.title}
                variant={item.variant}
                dismissible={item.dismissible}
                dismissLabel={`Dismiss ${item.title}`}
                announcement="off"
                onQDismiss={() => this.dismissItem(item.id)}
              >
                {renderToastIcon(item.variant)}
                {item.description}
              </q-alert>
            </div>
          ))}
        </div>

        <div
          class="announcement"
          part="announcement"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {this.announcementText}
        </div>
      </div>
    );
  }
}
