export type Artifact = { link: string } | { data: string; mode: number };

export interface BinEntry {
  file: string;
  original: Artifact | null;
  active?: Artifact | null;
}

export interface BinOperation {
  file: string;
  before: Artifact | null;
  after: Artifact | null;
}
