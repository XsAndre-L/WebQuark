/**
 * @fileoverview Stable identity and resource reconciliation for rendered collections.
 */

export type CollectionIdentity = string | number;
export type CollectionIdentityInput =
  | CollectionIdentity
  | null
  | undefined;

export type CollectionIdentityWarningCode =
  | 'missing-identity'
  | 'invalid-identity'
  | 'duplicate-identity';

export interface CollectionIdentityWarning {
  code: CollectionIdentityWarningCode;
  message: string;
  index: number;
  identity: unknown;
  firstIndex?: number;
}

export type CollectionIdentityWarningHandler = (
  warning: CollectionIdentityWarning,
) => void;

export interface CollectionIdentityOptions {
  /** Optional component or collection name included in development warnings. */
  warningContext?: string;
  /** Override the default console warning handler, or provide a no-op to suppress warnings. */
  onWarning?: CollectionIdentityWarningHandler;
}

export interface IdentifiedCollectionItem<T> {
  item: T;
  index: number;
  identity: CollectionIdentity;
  key: string;
  usesFallback: boolean;
}

export type CollectionIdentityGetter<T> = (
  item: T,
  index: number,
) => CollectionIdentityInput;

export interface CollectionReconciliationContext {
  index: number;
  identity: CollectionIdentity;
  key: string;
  usesFallback: boolean;
}

export interface ReconcileByIdentityOptions<TItem, TResource>
  extends CollectionIdentityOptions {
  current: ReadonlyMap<string, TResource>;
  incoming: readonly TItem[];
  identify: CollectionIdentityGetter<TItem>;
  create: (
    item: TItem,
    context: CollectionReconciliationContext,
  ) => TResource;
  update?: (
    resource: TResource,
    item: TItem,
    context: CollectionReconciliationContext,
  ) => void;
  remove?: (resource: TResource, key: string) => void;
}

export interface ReconcileByIdentityResult<TResource> {
  byIdentity: Map<string, TResource>;
  ordered: TResource[];
}

/**
 * Adds stable, type-safe keys to items without mutating the source collection.
 */
export function identifyItems<T>(
  items: readonly T[],
  identify: CollectionIdentityGetter<T>,
  options: CollectionIdentityOptions = {},
): IdentifiedCollectionItem<T>[] {
  const identified: IdentifiedCollectionItem<T>[] = [];
  const firstIndexes = new Map<string, number>();
  const warn = options.onWarning ?? defaultWarningHandler;

  items.forEach((item, index) => {
    const rawIdentity: unknown = identify(item, index);
    const validIdentity = isCollectionIdentity(rawIdentity);

    if (!validIdentity) {
      const code: CollectionIdentityWarningCode =
        rawIdentity === null || rawIdentity === undefined
          ? 'missing-identity'
          : 'invalid-identity';

      warn({
        code,
        message: createWarningMessage(
          options.warningContext,
          code,
          index,
          rawIdentity,
        ),
        index,
        identity: rawIdentity,
      });

      identified.push(createFallbackItem(item, index));
      return;
    }

    const key = normalizeCollectionIdentity(rawIdentity);
    const firstIndex = firstIndexes.get(key);

    if (firstIndex !== undefined) {
      warn({
        code: 'duplicate-identity',
        message: createWarningMessage(
          options.warningContext,
          'duplicate-identity',
          index,
          rawIdentity,
          firstIndex,
        ),
        index,
        identity: rawIdentity,
        firstIndex,
      });

      identified.push(createFallbackItem(item, index));
      return;
    }

    firstIndexes.set(key, index);
    identified.push({
      item,
      index,
      identity: rawIdentity,
      key,
      usesFallback: false,
    });
  });

  return identified;
}

/**
 * Reuses resources with matching identities, creates additions, removes missing
 * resources, and returns resources in incoming collection order.
 */
export function reconcileByIdentity<TItem, TResource>(
  options: ReconcileByIdentityOptions<TItem, TResource>,
): ReconcileByIdentityResult<TResource> {
  const identified = identifyItems(options.incoming, options.identify, {
    warningContext: options.warningContext,
    onWarning: options.onWarning,
  });
  const byIdentity = new Map<string, TResource>();
  const ordered: TResource[] = [];

  identified.forEach(entry => {
    const context: CollectionReconciliationContext = {
      index: entry.index,
      identity: entry.identity,
      key: entry.key,
      usesFallback: entry.usesFallback,
    };

    let resource: TResource;

    if (options.current.has(entry.key)) {
      resource = options.current.get(entry.key) as TResource;
      options.update?.(resource, entry.item, context);
    } else {
      resource = options.create(entry.item, context);
    }

    byIdentity.set(entry.key, resource);
    ordered.push(resource);
  });

  options.current.forEach((resource, key) => {
    if (!byIdentity.has(key)) {
      options.remove?.(resource, key);
    }
  });

  return { byIdentity, ordered };
}

function createFallbackItem<T>(
  item: T,
  index: number,
): IdentifiedCollectionItem<T> {
  return {
    item,
    index,
    identity: `__webquark_collection_fallback_${index}`,
    key: `fallback:${index}`,
    usesFallback: true,
  };
}

function isCollectionIdentity(value: unknown): value is CollectionIdentity {
  return typeof value === 'string' || typeof value === 'number';
}

function normalizeCollectionIdentity(identity: CollectionIdentity): string {
  if (typeof identity === 'string') {
    return `string:${identity}`;
  }

  if (Number.isNaN(identity)) {
    return 'number:NaN';
  }

  if (Object.is(identity, -0)) {
    return 'number:-0';
  }

  return `number:${String(identity)}`;
}

function createWarningMessage(
  warningContext: string | undefined,
  code: CollectionIdentityWarningCode,
  index: number,
  identity: unknown,
  firstIndex?: number,
): string {
  const prefix = warningContext
    ? `[WebQuark Collection Identity: ${warningContext}]`
    : '[WebQuark Collection Identity]';

  if (code === 'duplicate-identity') {
    return `${prefix} Duplicate identity ${describeIdentity(identity)} at index ${index}; first used at index ${firstIndex}. A fallback key was used.`;
  }

  return `${prefix} Item at index ${index} returned ${describeIdentity(identity)}. Identities must be strings or numbers. A fallback key was used.`;
}

function describeIdentity(identity: unknown): string {
  if (typeof identity === 'string') {
    return `"${identity}"`;
  }

  if (
    identity === null ||
    identity === undefined ||
    typeof identity === 'number' ||
    typeof identity === 'boolean' ||
    typeof identity === 'bigint' ||
    typeof identity === 'symbol'
  ) {
    return String(identity);
  }

  return Object.prototype.toString.call(identity);
}

function defaultWarningHandler(warning: CollectionIdentityWarning): void {
  console.warn(warning.message);
}
