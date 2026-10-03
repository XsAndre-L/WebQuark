import { isFieldDisabled } from './form-field-state';

const pendingResets = new WeakMap<HTMLElement, Set<Promise<void>>>();

/** Reads/writes observe reset activations already queued by a click listener. */
export async function awaitResetActions(owner: HTMLElement): Promise<void> {
  const pending = pendingResets.get(owner);
  if (pending) await Promise.all(pending);
}

export function resolveResetOwner(control: HTMLElement, nativeOwner?: HTMLFormElement | null): HTMLFormElement | HTMLQFormElement | undefined {
  if (nativeOwner) return nativeOwner;
  if (control.hasAttribute('form')) {
    const root = control.getRootNode() as Document | ShadowRoot;
    const target = root.getElementById?.(control.getAttribute('form')!);
    return target?.tagName === 'FORM' ? target as HTMLFormElement : undefined;
  }
  // FACE/native ownership takes precedence over a nearer logical wrapper.
  const native = control.closest('form');
  if (native) return native;
  return control.closest('q-form') ?? undefined;
}

/** Run after qClick and native click dispatch so later listeners can still cancel. */
export function scheduleResetAction(control: HTMLElement, originalEvent: MouseEvent, emittedEvent?: Event, nativeOwner?: () => HTMLFormElement | null): void {
  const queuedOwner = resolveResetOwner(control, nativeOwner?.());
  let complete!: () => void;
  const pending = new Promise<void>(resolve => { complete = resolve; });
  if (queuedOwner) {
    const actions = pendingResets.get(queuedOwner) ?? new Set<Promise<void>>();
    actions.add(pending);
    pendingResets.set(queuedOwner, actions);
  }
  // Trusted event callbacks may flush microtasks between listeners. A task
  // boundary lets every click listener cancel before logical reset starts.
  setTimeout(async () => {
    try {
      const state = control as HTMLElement & { disabled?: boolean; loading?: boolean; href?: string };
      if (!control.isConnected || originalEvent.defaultPrevented || emittedEvent?.defaultPrevented || state.href || state.loading || isFieldDisabled(control, Boolean(state.disabled))) return;
      const owner = resolveResetOwner(control, nativeOwner?.());
      if (!owner) return;
      if (owner.tagName === 'Q-FORM') {
        await (owner as HTMLQFormElement).resetForm();
      } else {
        const prototype = owner.ownerDocument.defaultView?.HTMLFormElement?.prototype;
        prototype?.reset.call(owner);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (queuedOwner) pendingResets.get(queuedOwner)?.delete(pending);
      complete();
    }
  }, 0);
}
