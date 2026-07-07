export interface CarouselEdgeState {
  isAtStart: boolean;
  isAtEnd: boolean;
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
