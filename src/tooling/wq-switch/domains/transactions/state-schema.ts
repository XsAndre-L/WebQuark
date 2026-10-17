import type { PackageName } from '../workspace/catalog';
import type { BinEntry } from '../launchers/launcher-schema';

export interface Entry {
  name: PackageName;
  slot: string;
  backup: string;
  original: string;
  identity: string;
  target: string;
}

export interface State {
  version: 1;
  source: string;
  generation: string;
  entries: Entry[];
  bins?: BinEntry[];
}
