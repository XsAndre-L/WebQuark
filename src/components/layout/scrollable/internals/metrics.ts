export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  maxScrollTop: number;
}

export interface ThumbLayout {
  height: number;
  translateY: number;
  isScrollable: boolean;
}

export function getScrollMetrics(viewport: HTMLElement | undefined): ScrollMetrics {
  if (!viewport) {
    return {
      scrollTop: 0,
      scrollHeight: 0,
      clientHeight: 0,
      maxScrollTop: 0,
    };
  }

  const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
  return {
    scrollTop: viewport.scrollTop,
    scrollHeight: viewport.scrollHeight,
    clientHeight: viewport.clientHeight,
    maxScrollTop,
  };
}

export function getThumbLayout(options: {
  metrics: ScrollMetrics;
  trackHeight: number;
  thumbHeight: number;
  minThumbHeight: number;
}): ThumbLayout {
  const { metrics, trackHeight, minThumbHeight } = options;

  if (metrics.scrollHeight <= metrics.clientHeight || metrics.maxScrollTop <= 0) {
    return {
      height: 0,
      translateY: 0,
      isScrollable: false,
    };
  }

  const calculatedHeight = (metrics.clientHeight * metrics.clientHeight) / metrics.scrollHeight;
  const height = Math.max(minThumbHeight, calculatedHeight);
  const resolvedThumbHeight = options.thumbHeight || height;
  const maxThumbTranslate = Math.max(0, trackHeight - resolvedThumbHeight);
  const translateY = maxThumbTranslate > 0 ? (metrics.scrollTop / metrics.maxScrollTop) * maxThumbTranslate : 0;

  return {
    height,
    translateY,
    isScrollable: true,
  };
}

export function clampScrollTop(scrollTop: number, metrics: ScrollMetrics): number {
  return Math.max(0, Math.min(metrics.maxScrollTop, scrollTop));
}

export function getKeyboardScrollTarget(options: {
  key: string;
  scrollTop: number;
  clientHeight: number;
  maxScrollTop: number;
  step: number;
}): number | undefined {
  const pageStep = Math.max(options.step, options.clientHeight - options.step);

  switch (options.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return options.scrollTop + options.step;
    case 'ArrowUp':
    case 'ArrowLeft':
      return options.scrollTop - options.step;
    case 'PageDown':
      return options.scrollTop + pageStep;
    case 'PageUp':
      return options.scrollTop - pageStep;
    case 'Home':
      return 0;
    case 'End':
      return options.maxScrollTop;
    default:
      return undefined;
  }
}
