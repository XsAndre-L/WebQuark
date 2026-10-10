import { focusFirstElement, safeFocus, waitForTransitionEnd } from '../../../../utils/dom';

export interface DialogLifecycleState {
  openAnimationFrame?: number;
  openSecondAnimationFrame?: number;
  transitionCleanup?: () => void;
}

export function cancelDialogOpenAnimation(state: DialogLifecycleState): void {
  if (state.openAnimationFrame !== undefined) {
    cancelAnimationFrame(state.openAnimationFrame);
    state.openAnimationFrame = undefined;
  }

  if (state.openSecondAnimationFrame !== undefined) {
    cancelAnimationFrame(state.openSecondAnimationFrame);
    state.openSecondAnimationFrame = undefined;
  }
}

export function clearDialogTransitionWait(state: DialogLifecycleState): void {
  if (state.transitionCleanup) {
    state.transitionCleanup();
    state.transitionCleanup = undefined;
  }
}

export function waitForDialogTransition(
  state: DialogLifecycleState,
  dialogEl: HTMLElement | undefined,
  callback: () => void
): void {
  if (!dialogEl) {
    callback();
    return;
  }

  clearDialogTransitionWait(state);
  state.transitionCleanup = waitForTransitionEnd(dialogEl, () => {
    state.transitionCleanup = undefined;
    callback();
  });
}

export function scheduleDialogOpenAnimation(options: {
  state: DialogLifecycleState;
  dialogEl: HTMLElement | undefined;
  isOpen: () => boolean;
  setAnimatedOpen: (open: boolean) => void;
}): void {
  cancelDialogOpenAnimation(options.state);
  clearDialogTransitionWait(options.state);

  options.state.openAnimationFrame = requestAnimationFrame(() => {
    options.state.openAnimationFrame = undefined;
    options.state.openSecondAnimationFrame = requestAnimationFrame(() => {
      options.state.openSecondAnimationFrame = undefined;
      if (!options.isOpen()) return;

      options.setAnimatedOpen(true);
      waitForDialogTransition(options.state, options.dialogEl, () => {
        if (options.isOpen()) {
          focusFirstElement(options.dialogEl);
        }
      });
    });
  });
}

export function closeDialogAfterTransition(options: {
  state: DialogLifecycleState;
  dialogEl: HTMLElement | undefined;
  previousActiveElement: HTMLElement | null;
  setVisible: (visible: boolean) => void;
  setPreviousActiveElement: (element: HTMLElement | null) => void;
}): void {
  waitForDialogTransition(options.state, options.dialogEl, () => {
    options.setVisible(false);
    safeFocus(options.previousActiveElement);
    options.setPreviousActiveElement(null);
  });
}
