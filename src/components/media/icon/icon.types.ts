export type QIconName = string;
export type QIconLibrary = 'lucide' | 'font-awesome' | 'fontawesome' | 'local' | (string & {});
export type QIconSize = 'sm' | 'md' | 'lg' | number | (string & {});
export type QIconColor = 'currentColor' | (string & {});
export type QIconLocalPath = string;

export type QIconAttributes = Readonly<Record<string, string>>;

/** Framework-neutral SVG node data compatible with `@lucide/icons`. */
export type QIconNode = readonly [
  tagName: string,
  attributes: QIconAttributes,
  children?: readonly QIconNode[],
];

/**
 * Trusted, compile-time icon data. `size` describes a square view box; use
 * `width` and `height` for a non-square view box.
 */
export interface QIconDefinition {
  name?: string;
  node: readonly QIconNode[];
  size?: number;
  width?: number;
  height?: number;
  attributes?: QIconAttributes;
}

/** Explicit application-owned name-to-definition mapping. */
export type QIconRegistry = Readonly<Record<string, QIconDefinition>>;

export interface QIconConfiguration {
  /** Prevent every URL and fetch fallback when a name is not registered. */
  strict: boolean;
}

