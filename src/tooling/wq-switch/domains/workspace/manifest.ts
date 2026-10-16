import { join } from 'node:path';
import { json } from '../../infrastructure/filesystem/atomic-json';

export type Manifest = {
  name: string;
  version: string;
  private?: boolean;
  workspaces?: string[] | { packages: string[] };
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, unknown>;
  files?: string[];
  bin?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  scripts?: Record<string, string>;
};

/** Reads and parses the package.json manifest for a given directory root. */
export function manifest(root: string): Manifest {
  return json<Manifest>(join(root, 'package.json'));
}
