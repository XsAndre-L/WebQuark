import { describe, expect, it } from 'vitest';
import { calculateImageCropGeometry, hasPartialImageCrop, isImageCropValid } from './image-crop';

describe('image crop geometry', () => {
  it('rejects malformed, non-finite, empty and out-of-source regions without clamping', () => {
    for (const crop of [null, {}, { x: 0, y: 0, width: 0, height: 0 },
      { x: -1, y: 0, width: 50, height: 50 }, { x: 60, y: 0, width: 41, height: 100 },
      { x: 0, y: 51, width: 100, height: 50 }, { x: NaN, y: 0, width: 50, height: 50 },
      { x: 0, y: 0, width: Infinity, height: 50 }, { x: '0', y: 0, width: 50, height: 50 }]) {
      expect(isImageCropValid(crop)).toBe(false);
      expect(calculateImageCropGeometry(800, 600, crop as any)).toBeUndefined();
    }
    expect(calculateImageCropGeometry(0, 600)).toBeUndefined();
    expect(calculateImageCropGeometry(800, NaN)).toBeUndefined();
    expect(calculateImageCropGeometry(800, 600, undefined, 0)).toBeUndefined();
  });

  it('treats omitted and explicit full-image crops identically and preserves contain letterboxing', () => {
    const full = { x: 0, y: 0, width: 100, height: 100 };
    expect(hasPartialImageCrop()).toBe(false);
    expect(hasPartialImageCrop(full)).toBe(false);
    const geometry = calculateImageCropGeometry(800, 600, undefined, 2)!;
    expect(calculateImageCropGeometry(800, 600, full, 2)).toEqual(geometry);
    expect(geometry.viewport.width).toBeCloseTo(100 * 2 / 3);
    expect(geometry.viewport.height).toBe(100);
    expect(geometry.image.width).toBe(100);
    expect(geometry.image.height).toBe(100);
  });

  it('uniformly scales decimal crops and clips the selected region in a different frame ratio', () => {
    const crop = { x: 20.5, y: 15, width: 65, height: 70 };
    const original = { ...crop };
    const geometry = calculateImageCropGeometry(1200, 800, crop, 2)!;
    expect(hasPartialImageCrop(crop)).toBe(true);
    expect(geometry.viewport.width).toBeCloseTo(780 / 560 / 2 * 100);
    expect(geometry.viewport.height).toBeCloseTo(100);
    expect(geometry.image.left).toBeCloseTo(-20.5 / 65 * 100);
    expect(geometry.image.top).toBeCloseTo(-15 / 70 * 100);
    // Pixel sizes reconstructed from percentages have the original image ratio.
    const imageWidth = 2 * geometry.viewport.width / 100 * geometry.image.width / 100;
    const imageHeight = geometry.viewport.height / 100 * geometry.image.height / 100;
    expect(imageWidth / imageHeight).toBeCloseTo(1.5);
    expect(crop).toEqual(original);
  });

  it('uses the complete file origin for edge, corner and middle selections', () => {
    for (const crop of [
      { x: 60, y: 0, width: 40, height: 100 },
      { x: 0, y: 55, width: 45, height: 45 },
      { x: 55, y: 55, width: 45, height: 45 },
      { x: 25, y: 25, width: 50, height: 50 },
    ]) {
      const geometry = calculateImageCropGeometry(1200, 800, crop)!;
      expect(geometry.aspectRatio).toBeCloseTo(1200 * crop.width / (800 * crop.height));
      expect(geometry.viewport.width).toBeCloseTo(100);
      expect(geometry.viewport.height).toBeCloseTo(100);
      expect(geometry.image.left).toBeCloseTo(-crop.x / crop.width * 100);
      expect(geometry.image.top).toBeCloseTo(-crop.y / crop.height * 100);
    }
  });
});
