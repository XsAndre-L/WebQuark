/**
 * Utility functions for color parsing and conversion in the WebQuark Playground.
 */

/**
 * Converts an rgb() or rgba() color string to a standard hex string (#RRGGBB).
 * If the value is already a hex string, it is returned directly.
 */
export function convertToHex(rgbVal: string): string {
  if (!rgbVal) return '#000000';
  rgbVal = rgbVal.trim();
  if (rgbVal.startsWith('#')) {
    return rgbVal;
  }
  const match = rgbVal.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  return rgbVal;
}
