import type { QCarouselSnapAlignment } from '../carousel.types';

export interface CarouselEdgeState {
  isAtStart: boolean;
  isAtEnd: boolean;
}

export interface CarouselMetrics {
  itemOffsets: number[];
  itemWidths: number[];
  containerWidth: number;
  maxScrollLeft: number;
  isScrollable: boolean;
  maxIndex: number;
}

export function getCarouselEdgeState(scrollLeft: number, startOffset: number, maxScrollLeft: number, tolerance = 5): CarouselEdgeState {
  return {
    isAtStart: scrollLeft <= startOffset + tolerance,
    isAtEnd: scrollLeft >= maxScrollLeft - tolerance,
  };
}

export function resolveCarouselTargetIndex(index: number, maxIndex: number, repeat: boolean): number | undefined {
  if (maxIndex <= 0) return undefined;
  if (repeat) {
    if (index < 0) return maxIndex;
    if (index > maxIndex) return 0;
    return index;
  }
  if (index < 0 || index > maxIndex) return undefined;
  return index;
}

export function getCarouselMetrics(container: HTMLElement, children: readonly HTMLElement[]): CarouselMetrics {
  const containerWidth = container.clientWidth;
  const maxScrollLeft = Math.max(0, container.scrollWidth - containerWidth);

  return {
    itemOffsets: children.map(child => child.offsetLeft - container.offsetLeft),
    itemWidths: children.map(child => child.clientWidth),
    containerWidth,
    maxScrollLeft,
    isScrollable: container.scrollWidth > containerWidth,
    maxIndex: Math.max(0, children.length - 1),
  };
}

export function getClosestCarouselIndex(options: {
  scrollLeft: number;
  itemOffsets: readonly number[];
  itemWidths: readonly number[];
  containerWidth: number;
  snapAlignment: QCarouselSnapAlignment;
}): number {
  let targetScroll = options.scrollLeft;
  if (options.snapAlignment === 'center') {
    targetScroll = options.scrollLeft + options.containerWidth / 2;
  } else if (options.snapAlignment === 'end') {
    targetScroll = options.scrollLeft + options.containerWidth;
  }

  let closestIndex = 0;
  let minDiff = Infinity;

  options.itemOffsets.forEach((offset, index) => {
    let comparisonOffset = offset;
    const itemWidth = options.itemWidths[index] || 0;

    if (options.snapAlignment === 'center') {
      comparisonOffset = offset + itemWidth / 2;
    } else if (options.snapAlignment === 'end') {
      comparisonOffset = offset + itemWidth;
    }

    const diff = Math.abs(comparisonOffset - targetScroll);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = index;
    }
  });

  return closestIndex;
}
