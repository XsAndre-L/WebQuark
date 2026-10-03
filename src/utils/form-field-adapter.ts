/** Private FACE protocol. No consumer shadow traversal or parallel value store. */
export const formFieldProtocol = Symbol.for('webquark.form-field.v1');

export type CustomFieldKind = 'text' | 'selection' | 'toggle';
export interface CustomFormField {
  kind: CustomFieldKind;
  owner(): HTMLFormElement | null;
  active(): boolean;
  value(): string | boolean | null;
  assign(value: string | boolean): void;
  reconcile(): void;
  reset(): void;
  validate(report: boolean): boolean;
}

interface FieldConnection {
  version: 1;
  waiting: Set<() => void>;
  field?: CustomFormField;
}

export const FORM_FIELD_READY_TIMEOUT_MS = 5000;

function connection(host: HTMLElement): FieldConnection {
  const target = host as HTMLElement & { [formFieldProtocol]?: FieldConnection };
  if (!target[formFieldProtocol]) {
    Object.defineProperty(target, formFieldProtocol, { value: { version: 1, waiting: new Set() } });
  }
  return target[formFieldProtocol]!;
}

export function registerFormField(host: HTMLElement, field: CustomFormField): void {
  const state = connection(host);
  state.field = field;
  for (const done of Array.from(state.waiting)) done();
}

export function readFormField(host: HTMLElement): CustomFormField | undefined {
  const state = (host as HTMLElement & { [formFieldProtocol]?: FieldConnection })[formFieldProtocol];
  return state?.version === 1 ? state.field : undefined;
}

export function awaitFormField(host: HTMLElement, signal?: AbortSignal, timeoutMs = FORM_FIELD_READY_TIMEOUT_MS): Promise<void> {
  const state = connection(host);
  if (state.field || signal?.aborted) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      state.waiting.delete(done);
      signal?.removeEventListener('abort', done);
    };
    const done = () => {
      cleanup();
      resolve();
    };
    const timeout = setTimeout(() => {
      cleanup();
      const error = new Error(`Form field ${host.tagName.toLowerCase()} did not become ready within ${FORM_FIELD_READY_TIMEOUT_MS}ms.`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);
    state.waiting.add(done);
    signal?.addEventListener('abort', done, { once: true });
  });
}
