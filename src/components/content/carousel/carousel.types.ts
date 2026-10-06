export type QCarouselSnapAlignment = 'start' | 'center' | 'end' | 'none';

export type QCarouselLayout = 'strip' | 'slideshow';

export interface QCarouselAutoplayChangeDetail {
  playing: boolean;
}

export type QCarouselTransition = 'slide' | 'crossfade' | 'instant';

export interface QCarouselSlideChangeDetail {
  index: number;
  element: HTMLElement;
}

