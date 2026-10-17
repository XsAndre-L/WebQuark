import type { State } from './state-schema';
import type { BinOperation } from '../launchers/launcher-schema';

export interface Operation {
  slot: string;
  before: string | null;
  after: string | null;
  move?: string;
}

export interface Journal {
  previous: State | null;
  next: State | null;
  operations: Operation[];
  bins?: BinOperation[];
}
