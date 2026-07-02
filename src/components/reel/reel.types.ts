export type QReelLayout = 'grid' | 'carousel';

export interface QReelMedia {
  src: string;
  label?: string;
  video: boolean;
  alt: string;
  triggerEl?: HTMLElement;
}

