import type {
  QToastController,
  QToastId,
  QToastOptions,
  QToastRequest,
  QToastVariant,
} from './toast.types';

export interface QToastHostAdapter {
  enqueue(request: QToastRequest, id: QToastId): void;
  dismiss(id: QToastId): boolean;
  clear(): number;
}

interface BufferedToast {
  id: QToastId;
  request: QToastRequest;
}

const MAX_BUFFERED_TOASTS = 50;
const TOAST_RUNTIME_KEY = '__webquarkToastRuntimeV1__';

interface QToastRuntimeState {
  activeHost?: QToastHostAdapter;
  bufferedToasts: BufferedToast[];
  nextId: number;
}

type QToastRuntimeGlobal = typeof globalThis & {
  [TOAST_RUNTIME_KEY]?: QToastRuntimeState;
};

const getRuntimeState = (): QToastRuntimeState => {
  const runtime = globalThis as QToastRuntimeGlobal;

  if (!runtime[TOAST_RUNTIME_KEY]) {
    Object.defineProperty(runtime, TOAST_RUNTIME_KEY, {
      value: {
        bufferedToasts: [],
        nextId: 0,
      } satisfies QToastRuntimeState,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }

  return runtime[TOAST_RUNTIME_KEY];
};

const assertClientRuntime = (): void => {
  if (typeof document === 'undefined') {
    throw new Error(
      'WebQuark toast methods are client-only. Call them after the document is available.',
    );
  }
};

const normalizeRequest = (
  variant: QToastVariant,
  title: string,
  description?: string,
  options: QToastOptions = {},
): QToastRequest => {
  const normalizedTitle = title.trim();
  const normalizedDescription = description?.trim();

  if (!normalizedTitle) {
    throw new TypeError('Toast title must not be empty.');
  }

  if (
    options.duration !== undefined &&
    (!Number.isFinite(options.duration) || options.duration < 0)
  ) {
    throw new RangeError(
      'Toast duration must be a finite number of milliseconds at least 0.',
    );
  }

  return {
    title: normalizedTitle,
    description: normalizedDescription || undefined,
    variant,
    duration: options.duration,
    dismissible: options.dismissible,
  };
};

const createId = (): QToastId => {
  const runtime = getRuntimeState();
  runtime.nextId += 1;
  return `q-toast-${Date.now().toString(36)}-${runtime.nextId.toString(36)}`;
};

const show = (
  variant: QToastVariant,
  title: string,
  description?: string,
  options?: QToastOptions,
): QToastId => {
  assertClientRuntime();

  const id = createId();
  const request = normalizeRequest(variant, title, description, options);
  const runtime = getRuntimeState();

  if (runtime.activeHost) {
    runtime.activeHost.enqueue(request, id);
    return id;
  }

  if (runtime.bufferedToasts.length >= MAX_BUFFERED_TOASTS) {
    throw new RangeError(
      `Cannot buffer more than ${MAX_BUFFERED_TOASTS} toasts before <q-toast> connects.`,
    );
  }

  runtime.bufferedToasts = [...runtime.bufferedToasts, { id, request }];
  return id;
};

export const registerToastHost = (host: QToastHostAdapter): boolean => {
  const runtime = getRuntimeState();

  if (runtime.activeHost && runtime.activeHost !== host) {
    console.error(
      'WebQuark QToast: only one global <q-toast> host may be connected at a time.',
    );
    return false;
  }

  runtime.activeHost = host;
  const pending = runtime.bufferedToasts;
  runtime.bufferedToasts = [];
  pending.forEach(({ request, id }) => host.enqueue(request, id));
  return true;
};

export const unregisterToastHost = (host: QToastHostAdapter): void => {
  const runtime = getRuntimeState();
  if (runtime.activeHost === host) {
    runtime.activeHost = undefined;
  }
};

export const toast: QToastController = Object.freeze({
  info: (title, description, options) =>
    show('info', title, description, options),
  success: (title, description, options) =>
    show('success', title, description, options),
  warning: (title, description, options) =>
    show('warning', title, description, options),
  danger: (title, description, options) =>
    show('danger', title, description, options),
  error: (title, description, options) =>
    show('danger', title, description, options),
  dismiss: (id) => {
    assertClientRuntime();
    const runtime = getRuntimeState();

    if (runtime.activeHost) {
      return runtime.activeHost.dismiss(id);
    }

    const initialLength = runtime.bufferedToasts.length;
    runtime.bufferedToasts = runtime.bufferedToasts.filter(
      (item) => item.id !== id,
    );
    return runtime.bufferedToasts.length !== initialLength;
  },
  clear: () => {
    assertClientRuntime();
    const runtime = getRuntimeState();

    if (runtime.activeHost) {
      return runtime.activeHost.clear();
    }

    const count = runtime.bufferedToasts.length;
    runtime.bufferedToasts = [];
    return count;
  },
});
