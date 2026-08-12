import type { QMapViewportRect } from '../map.types';

export interface MapVisibilityTranslation {
  x: number;
  y: number;
}

const GEOMETRY_EPSILON = 0.01;
const SELECTED_MARKER_RING_OUTSET = 3;
const CLUSTER_RING_OUTSET = 4;
const SELECTED_CLUSTER_RING_OUTSET = 7;

/** Finds the shortest screen-space translation that fully exposes a target. */
export function getMinimalVisibleTranslation(
  target: QMapViewportRect,
  viewport: QMapViewportRect,
  occlusions: readonly QMapViewportRect[],
): MapVisibilityTranslation | undefined {
  const normalizedTarget = normalizeRect(target);
  const normalizedViewport = normalizeRect(viewport);
  if (!normalizedTarget || !normalizedViewport) return undefined;
  if (
    getWidth(normalizedTarget) > getWidth(normalizedViewport) + GEOMETRY_EPSILON
    || getHeight(normalizedTarget) > getHeight(normalizedViewport) + GEOMETRY_EPSILON
  ) return undefined;

  const clippedOcclusions = occlusions
    .map(normalizeRect)
    .filter((rect): rect is QMapViewportRect => rect !== undefined)
    .map(rect => intersectRects(rect, normalizedViewport))
    .filter((rect): rect is QMapViewportRect => rect !== undefined);
  const xCandidates = new Set<number>([
    0,
    normalizedViewport.left - normalizedTarget.left,
    normalizedViewport.right - normalizedTarget.right,
  ]);
  const yCandidates = new Set<number>([
    0,
    normalizedViewport.top - normalizedTarget.top,
    normalizedViewport.bottom - normalizedTarget.bottom,
  ]);

  for (const occlusion of clippedOcclusions) {
    xCandidates.add(occlusion.left - normalizedTarget.right);
    xCandidates.add(occlusion.right - normalizedTarget.left);
    yCandidates.add(occlusion.top - normalizedTarget.bottom);
    yCandidates.add(occlusion.bottom - normalizedTarget.top);
  }

  let best: MapVisibilityTranslation | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const x of xCandidates) {
    for (const y of yCandidates) {
      const translated = translateRect(normalizedTarget, x, y);
      if (!containsRect(normalizedViewport, translated)) continue;
      if (clippedOcclusions.some(occlusion => overlapsRect(translated, occlusion))) continue;
      const distance = x * x + y * y;
      if (distance + GEOMETRY_EPSILON < bestDistance) {
        best = { x, y };
        bestDistance = distance;
      }
    }
  }
  return best;
}

export function isRectFullyVisible(
  target: QMapViewportRect,
  viewport: QMapViewportRect,
  occlusions: readonly QMapViewportRect[],
): boolean {
  const normalizedTarget = normalizeRect(target);
  const normalizedViewport = normalizeRect(viewport);
  if (!normalizedTarget || !normalizedViewport) return false;
  if (!containsRect(normalizedViewport, normalizedTarget)) return false;
  return !occlusions.some(occlusion => {
    const normalizedOcclusion = normalizeRect(occlusion);
    return normalizedOcclusion ? overlapsRect(normalizedTarget, normalizedOcclusion) : false;
  });
}

/** Measures the intentional marker/cluster footprint without pulse or callout overflow. */
export function getRenderedMapItemRect(
  element: HTMLElement,
  kind: 'marker' | 'cluster',
): QMapViewportRect {
  const elementBounds = fromDomRect(element.getBoundingClientRect());

  if (kind === 'marker') {
    const ringOutset = Math.max(
      getMarkerRingOutset(element),
      element.classList.contains('is-selected') ? SELECTED_MARKER_RING_OUTSET : 0,
    );
    let bounds = expandRect(elementBounds, ringOutset);
    const badge = element.querySelector<HTMLElement>('.q-map-marker__badge:not([hidden])');
    if (badge) bounds = unionRects(bounds, fromDomRect(badge.getBoundingClientRect()));
    return bounds;
  }

  return expandRect(
    elementBounds,
    element.classList.contains('contains-selection')
      ? SELECTED_CLUSTER_RING_OUTSET
      : CLUSTER_RING_OUTSET,
  );
}

function normalizeRect(rect: QMapViewportRect): QMapViewportRect | undefined {
  const { top, right, bottom, left } = rect;
  if (![top, right, bottom, left].every(Number.isFinite)) return undefined;
  if (right <= left || bottom <= top) return undefined;
  return { top, right, bottom, left };
}

function getWidth(rect: QMapViewportRect): number {
  return rect.right - rect.left;
}

function getHeight(rect: QMapViewportRect): number {
  return rect.bottom - rect.top;
}

function fromDomRect(rect: DOMRect): QMapViewportRect {
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  };
}

function getMarkerRingOutset(element: HTMLElement): number {
  if (!element.classList.contains('ring-solid') && !element.classList.contains('ring-dashed')) return 0;
  const view = element.ownerDocument.defaultView;
  if (!view) return 7;
  const style = view.getComputedStyle(element, '::after');
  const outsets = [style.top, style.right, style.bottom, style.left]
    .map(value => Number.parseFloat(value))
    .filter(Number.isFinite)
    .map(value => Math.max(0, -value));
  return Math.max(7, ...outsets);
}

function expandRect(rect: QMapViewportRect, outset: number): QMapViewportRect {
  return {
    top: rect.top - outset,
    right: rect.right + outset,
    bottom: rect.bottom + outset,
    left: rect.left - outset,
  };
}

function unionRects(first: QMapViewportRect, second: QMapViewportRect): QMapViewportRect {
  return {
    top: Math.min(first.top, second.top),
    right: Math.max(first.right, second.right),
    bottom: Math.max(first.bottom, second.bottom),
    left: Math.min(first.left, second.left),
  };
}

function translateRect(
  rect: QMapViewportRect,
  x: number,
  y: number,
): QMapViewportRect {
  return {
    top: rect.top + y,
    right: rect.right + x,
    bottom: rect.bottom + y,
    left: rect.left + x,
  };
}

function intersectRects(
  first: QMapViewportRect,
  second: QMapViewportRect,
): QMapViewportRect | undefined {
  return normalizeRect({
    top: Math.max(first.top, second.top),
    right: Math.min(first.right, second.right),
    bottom: Math.min(first.bottom, second.bottom),
    left: Math.max(first.left, second.left),
  });
}

function containsRect(container: QMapViewportRect, target: QMapViewportRect): boolean {
  return target.left >= container.left - GEOMETRY_EPSILON
    && target.top >= container.top - GEOMETRY_EPSILON
    && target.right <= container.right + GEOMETRY_EPSILON
    && target.bottom <= container.bottom + GEOMETRY_EPSILON;
}

function overlapsRect(first: QMapViewportRect, second: QMapViewportRect): boolean {
  return first.left < second.right - GEOMETRY_EPSILON
    && first.right > second.left + GEOMETRY_EPSILON
    && first.top < second.bottom - GEOMETRY_EPSILON
    && first.bottom > second.top + GEOMETRY_EPSILON;
}
