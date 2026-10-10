/** Rectangle measured in percentages of the complete source image. */
export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** CSS percentage bounds relative to the containing box. */
export interface ImageCropBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ImageCropGeometry {
  aspectRatio: number;
  /** Centered selected-region viewport relative to the frame; clip its overflow. */
  viewport: ImageCropBox;
  /** Complete image relative to the viewport, uniformly scaled. */
  image: ImageCropBox;
}

const fullImage: ImageCrop = { x: 0, y: 0, width: 100, height: 100 };

/** Validate without changing or clamping an author's rectangle. */
export function isImageCropValid(crop: unknown): crop is ImageCrop {
  if (!crop || typeof crop !== 'object') return false;
  const { x, y, width, height } = crop as ImageCrop;
  return [x, y, width, height].every(value => typeof value === 'number' && Number.isFinite(value))
    && x >= 0 && y >= 0 && width > 0 && height > 0
    && x + width <= 100 && y + height <= 100;
}

export function hasPartialImageCrop(crop?: ImageCrop): boolean {
  return isImageCropValid(crop)
    && (crop.x !== 0 || crop.y !== 0 || crop.width !== 100 || crop.height !== 100);
}

/**
 * Contain a selected region without stretching or exposing pixels outside it.
 * Omit frameAspectRatio to use the region's natural ratio. Invalid input returns
 * undefined; callers can show their unavailable state instead of guessing.
 */
export function calculateImageCropGeometry(
  naturalWidth: number,
  naturalHeight: number,
  crop?: ImageCrop,
  frameAspectRatio?: number,
): ImageCropGeometry | undefined {
  if (!Number.isFinite(naturalWidth) || naturalWidth <= 0
    || !Number.isFinite(naturalHeight) || naturalHeight <= 0
    || (crop !== undefined && !isImageCropValid(crop))
    || (frameAspectRatio !== undefined && (!Number.isFinite(frameAspectRatio) || frameAspectRatio <= 0))) return undefined;

  const region = crop ?? fullImage;
  const regionWidth = naturalWidth * region.width / 100;
  const regionHeight = naturalHeight * region.height / 100;
  const aspectRatio = frameAspectRatio ?? regionWidth / regionHeight;
  // Normalize the frame height to 1; percentages keep the result responsive.
  const scale = Math.min(aspectRatio / regionWidth, 1 / regionHeight);
  const width = scale * regionWidth / aspectRatio * 100;
  const height = scale * regionHeight * 100;
  const geometry = {
    aspectRatio,
    viewport: { left: (100 - width) / 2, top: (100 - height) / 2, width, height },
    image: {
      left: -region.x / region.width * 100,
      top: -region.y / region.height * 100,
      width: 100 / region.width * 100,
      height: 100 / region.height * 100,
    },
  };
  return Object.values(geometry.viewport).every(Number.isFinite)
    && Object.values(geometry.image).every(Number.isFinite)
    && Number.isFinite(aspectRatio) && aspectRatio > 0 ? geometry : undefined;
}
