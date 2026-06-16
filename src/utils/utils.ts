/**
 * @fileoverview General purpose utility functions for WebQuark.
 */

export function format(first?: string, middle?: string, last?: string): string {
  return (first || '') + (middle ? ` ${middle}` : '') + (last ? ` ${last}` : '');
}

/**
 * Safely parses a JSON string or returns the value if it's already an array or object.
 * @param value The value to parse (string, array, or object).
 * @param fallback The fallback value to return on failure.
 * @param componentName Optional name of the component for better error logging prefix.
 */
export function safeParseJson<T>(
  value: T | string | undefined | null,
  fallback: T,
  componentName?: string
): T {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      const prefix = componentName ? `${componentName}: ` : '';
      console.error(`${prefix}Failed to parse JSON string`, e);
      return fallback;
    }
  }
  return value as T;
}
