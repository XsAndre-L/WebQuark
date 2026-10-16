import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { within } from '../../infrastructure/filesystem/path-safety';
import { manifest } from '../workspace';

/** Asserts that all declared main, module, types, bins, and export target files physically exist in the package. */
export function validatePackage(directory: string): void {
  const pkg = manifest(directory);
  const entries = [pkg.main, pkg.module, pkg.types, ...Object.values(pkg.bin ?? {})].filter((value): value is string => !!value);
  function visit(value: unknown): void {
    if (typeof value === 'string' && value.startsWith('./') && !value.includes('*')) entries.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  }
  visit(pkg.exports);
  for (const entry of entries) {
    const file = resolve(directory, entry);
    if (!within(directory, file) || !existsSync(file) || !statSync(file).isFile()) {
      throw new Error(`Missing or invalid build output: ${file}`);
    }
  }
  if (pkg.name === '@webquark/core' && !pkg.bin?.['wq-switch']) {
    throw new Error('Local WebQuark must include the wq-switch CLI. Update the checkout first.');
  }
}
