import { focusFirstElement, getDeepActiveElement, safeFocus } from '../../../../utils/dom';
import type { HandleDrawerOpenChangeOptions } from '../sidepanel.types';

/** Only the drawer's own transform finishes its lifecycle, never a child's fade. */
function waitForDrawerTransition(element: HTMLElement, callback: () => void): () => void {
  const style = getComputedStyle(element);
  const properties = style.transitionProperty.split(',').map(value => value.trim());
  const times = (value: string) => value.split(',').map(time =>
    parseFloat(time) * (time.trim().endsWith('ms') ? 1 : 1000) || 0);
  const durations = times(style.transitionDuration);
  const delays = times(style.transitionDelay);
  const duration = Math.max(0, ...properties.map((property, index) =>
    property === 'transform' || property === 'all'
      ? durations[index % durations.length] + delays[index % delays.length]
      : 0));
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cleanup = () => {
    cancelled = true;
    if (timer !== undefined) clearTimeout(timer);
    element.removeEventListener('transitionend', onEnd);
  };
  const finish = () => {
    if (cancelled) return;
    cleanup();
    callback();
  };
  const onEnd = (event: TransitionEvent) => {
    if (event.target === element && event.propertyName === 'transform') finish();
  };
  if (duration === 0) {
    queueMicrotask(finish);
  } else {
    element.addEventListener('transitionend', onEnd);
    timer = setTimeout(finish, duration + 50);
  }
  return cleanup;
}

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
    if (!previousActiveElement) setPreviousActiveElement(getDeepActiveElement() as HTMLElement | null);
    setVisible(true);
    firstFrame = requestAnimationFrame(() => {
      firstFrame = undefined;
      secondFrame = requestAnimationFrame(() => {
        secondFrame = undefined;
        if (cancelled)
          return;
        setAnimatedOpen(true);
        if (drawerEl) {
          transitionCleanup = waitForDrawerTransition(drawerEl, () => {
            if (!cancelled) {
              focusFirstElement(drawerEl);
            }
          });
        }
      });
    });
  }
  else {
    setAnimatedOpen(false);
    if (drawerEl) {
      transitionCleanup = waitForDrawerTransition(drawerEl, () => {
        if (cancelled)
          return;
        setVisible(false);
        safeFocus(previousActiveElement);
        setPreviousActiveElement(null);
      });
    }
    else {
      setVisible(false);
      setPreviousActiveElement(null);
    }
  }
  return cleanup;
}
