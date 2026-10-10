import type { ResolvedVisualMetadata } from './location.js';

export const categoryNames = ['Added', 'Changed', 'Fixed', 'Removed'] as const;

export type ChangeCategory = (typeof categoryNames)[number];
export type ImageCrop = { x: number; y: number; width: number; height: number };
export const imageFramingAnchors = [
  'top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right',
] as const;
export type ImageFraming = { anchor: (typeof imageFramingAnchors)[number]; width: number; height: number };
/** Generated image references contain canonical crop rectangles, never presets. */
export type ImageReference = { src: string; alt: string; crop?: ImageCrop };
export type ReleaseSummaryAnchor = { category: ChangeCategory; summary: string };
type ReleaseVisualDetails = Partial<ResolvedVisualMetadata> & {
  id: string;
  title: string;
  description?: string;
  aspectRatio?: number;
  afterSummary?: ReleaseSummaryAnchor;
};
export type ReleaseVisual = ReleaseVisualDetails & (
  | { kind: 'image'; image: ImageReference }
  | { kind?: 'comparison'; before: ImageReference; after: ImageReference }
);
export type ReleaseEntry = {
  version: string;
  date: string | null;
  unreleased?: true;
  categories: { name: ChangeCategory; summaries: string[] }[];
  visuals: ReleaseVisual[];
};

