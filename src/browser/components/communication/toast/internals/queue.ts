import type { QToastItem } from '../toast.types';

export const DEFAULT_MAX_VISIBLE = 3;
export const MAX_PENDING_TOASTS = 50;

export interface QToastQueueState {
  visible: QToastItem[];
  pending: QToastItem[];
}

export interface QToastRemovalResult extends QToastQueueState {
  removed?: QToastItem;
  promoted: QToastItem[];
}

export const normalizeMaxVisible = (value: number): number => {
  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_VISIBLE;
  }

  return Math.max(1, Math.trunc(value));
};

export const enqueueToast = (
  state: QToastQueueState,
  toast: QToastItem,
  maxVisible: number,
): QToastQueueState & { shown: boolean } => {
  if (state.visible.length < normalizeMaxVisible(maxVisible)) {
    return {
      visible: [...state.visible, toast],
      pending: state.pending,
      shown: true,
    };
  }

  if (state.pending.length >= MAX_PENDING_TOASTS) {
    throw new RangeError(
      `Cannot queue more than ${MAX_PENDING_TOASTS} pending toasts.`,
    );
  }

  return {
    visible: state.visible,
    pending: [...state.pending, toast],
    shown: false,
  };
};

export const removeToast = (
  state: QToastQueueState,
  id: string,
  maxVisible: number,
): QToastRemovalResult => {
  const visibleIndex = state.visible.findIndex((toast) => toast.id === id);

  if (visibleIndex === -1) {
    const pendingIndex = state.pending.findIndex((toast) => toast.id === id);

    if (pendingIndex === -1) {
      return { ...state, promoted: [] };
    }

    const pending = [...state.pending];
    const [removed] = pending.splice(pendingIndex, 1);
    return { visible: state.visible, pending, removed, promoted: [] };
  }

  const visible = [...state.visible];
  const [removed] = visible.splice(visibleIndex, 1);
  const pending = [...state.pending];
  const promoted: QToastItem[] = [];
  const capacity = normalizeMaxVisible(maxVisible);

  while (visible.length < capacity && pending.length > 0) {
    const next = pending.shift();
    if (next) {
      visible.push(next);
      promoted.push(next);
    }
  }

  return { visible, pending, removed, promoted };
};

export const promoteToCapacity = (
  state: QToastQueueState,
  maxVisible: number,
): QToastQueueState & { promoted: QToastItem[] } => {
  const visible = [...state.visible];
  const pending = [...state.pending];
  const promoted: QToastItem[] = [];
  const capacity = normalizeMaxVisible(maxVisible);

  while (visible.length < capacity && pending.length > 0) {
    const next = pending.shift();
    if (next) {
      visible.push(next);
      promoted.push(next);
    }
  }

  return { visible, pending, promoted };
};
