export type ReleaseApplication = string;
export type VisualLocation = { application: ReleaseApplication; route: string };
export type VisualSubject = { kind: 'page' | 'component'; label?: string; key?: string };
export type ResolvedVisualLocation = VisualLocation & { pageLabel: string; navigation: string[]; access: string[] };
export type ResolvedVisualSubject = VisualSubject & { label: string };
export type VisualGuidance = { text: string; readerSteps?: string[]; sourceRevision: string };
export type ResolvedVisualMetadata = { location: ResolvedVisualLocation; subject: ResolvedVisualSubject; guidance: VisualGuidance };
export interface VisualMetadataAdapter {
  id: string;
  revision: string;
  applications: readonly string[];
  resolve(root: string, record: Record<string, unknown>, context: string): Promise<ResolvedVisualMetadata>;
}
