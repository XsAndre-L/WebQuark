import { extname } from 'node:path';

export type CaptureImageFormat = 'webp' | 'png';

export function normalizeCaptureFormat(input: unknown, label: string): CaptureImageFormat {
  if (input === undefined) return 'webp';
  if (input !== 'webp' && input !== 'png') throw new Error(`${label}.format must be webp or png; omitted format defaults to webp.`);
  return input;
}

export function assertCaptureOutput(output: unknown, format: CaptureImageFormat, label: string): asserts output is string {
  if (typeof output !== 'string' || !/^images\/[a-z0-9]+(?:-[a-z0-9]+)*-after\.(?:webp|png)$/.test(output) || captureFormatForPath(output) !== format) {
    throw new Error(`${label}.output must name a lowercase kebab-case -after.${format} screenshot inside images. Omitted format defaults to webp; PNG requires format: "png".`);
  }
}

export function captureFormatForPath(path: string): CaptureImageFormat {
  const extension = extname(path).toLowerCase();
  if (extension !== '.webp' && extension !== '.png') throw new Error(`Capture image must use .webp or .png: ${path}.`);
  return extension === '.webp' ? 'webp' : 'png';
}
