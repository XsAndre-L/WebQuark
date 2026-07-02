import { focusFirstElement, safeFocus, waitForTransitionEnd } from '../../../../utils/dom';
import type { HandleDrawerOpenChangeOptions } from '../sidepanel.types';

export function handleDrawerOpenChange(options: HandleDrawerOpenChangeOptions): void {
  const { isOpen, drawerEl, previousActiveElement, setVisible, setAnimatedOpen, setPreviousActiveElement } = options;

  if (isOpen) {
    setPreviousActiveElement(document.activeElement as HTMLElement);
    setVisible(true);
    setTimeout(() => {
      setAnimatedOpen(true);
      if (drawerEl) {
        waitForTransitionEnd(drawerEl, () => {
          focusFirstElement(drawerEl);
        });
      }
    }, 50);
  } else {
    setAnimatedOpen(false);
    if (drawerEl) {
      waitForTransitionEnd(drawerEl, () => {
        setVisible(false);
        safeFocus(previousActiveElement);
      });
    } else {
      setVisible(false);
    }
  }
}
