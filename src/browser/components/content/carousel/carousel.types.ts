export type QCarouselSnapAlignment = 'start' | 'center' | 'end' | 'none';

export type QCarouselLayout = 'strip' | 'slideshow';

export type QCarouselAutoplayBehavior = 'pauseOnInteraction' | 'continuous';

export type QCarouselSlideTiming = 'fixedInterval' | 'finishVideos';

export interface QCarouselPlaybackChangeDetail {
  playing: boolean;
  requested: boolean;
}

export interface QCarouselAutoplayChangeDetail {
  playing: boolean;
}

export type QCarouselTransition = 'slide' | 'crossfade' | 'instant';

export interface QCarouselSlideChangeDetail {
  index: number;
  element: HTMLElement;
}

