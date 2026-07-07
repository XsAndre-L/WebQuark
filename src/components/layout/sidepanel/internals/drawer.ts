import { focusFirstElement, getDeepActiveElement, safeFocus, waitForTransitionEnd } from '../../../../utils/dom';
import type { HandleDrawerOpenChangeOptions } from '../sidepanel.types';

export function handleDrawerOpenChange(options: HandleDrawerOpenChangeOptions): () => void {
  const { isOpen, drawerEl, previousActiveElement, setVisible, setAnimatedOpen, setPreviousActiveElement } = options;
  let cancelled = false;
  let firstFrame: number | undefined;
  let secondFrame: number | undefined;
  let transitionCleanup: (() => void) | undefined;

  const cleanup = () => {
    cancelled = true;

    if (firstFrame !== undefined) {
      cancelAnimationFrame(firstFrame);
      firstFrame = undefined;
    }

    if (secondFrame !== undefined) {
      cancelAnimationFrame(secondFrame);
      secondFrame = undefined;
    }

    if (transitionCleanup) {
      transitionCleanup();
      transitionCleanup = undefined;
    }
  };

  if (isOpen) {
    setPreviousActiveElement(getDeepActiveElement() as HTMLElement | null);
    setVisible(true);
    firstFrame = requestAnimationFrame(() => {
      firstFrame = undefined;
      secondFrame = requestAnimationFrame(() => {
        secondFrame = undefined;
        if (cancelled) return;

        setAnimatedOpen(true);
        if (drawerEl) {
          transitionCleanup = waitForTransitionEnd(drawerEl, () => {
            if (!cancelled) {
              focusFirstElement(drawerEl);
            }
          });
        }
      });
    });
  } else {
    setAnimatedOpen(false);
    if (drawerEl) {
      transitionCleanup = waitForTransitionEnd(drawerEl, () => {
        if (cancelled) return;

        setVisible(false);
        safeFocus(previousActiveElement);
        setPreviousActiveElement(null);
      });
    } else {
      setVisible(false);
      setPreviousActiveElement(null);
    }
  }

  return cleanup;
}
