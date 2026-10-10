import { createHash } from 'node:crypto';
import { captureFormatForPath } from '../shared/capture-format.js';
export { captureReportSchemaVersion, captureToolRevision } from './revision.js';
export { captureFormatForPath, normalizeCaptureFormat, assertCaptureOutput, type CaptureImageFormat } from '../shared/capture-format.js';
import sharp from 'sharp';

/** The original PNG buffer remains unchanged when PNG is explicitly selected. */
export async function encodeCaptureImage(png: Buffer, outputPath: string): Promise<Buffer> {
  return captureFormatForPath(outputPath) === 'png' ? png : sharp(png).webp({ lossless: true }).toBuffer();
}

/** Inspect final bytes, never their filename alone or an intermediate screenshot. */
export async function inspectCaptureImage(bytes: Buffer, path: string) {
  const format = captureFormatForPath(path);
  let width: number, height: number;
  if (format === 'png') {
    if (bytes.length < 45 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
      || bytes.readUInt32BE(8) !== 13 || bytes.toString('ascii', 12, 16) !== 'IHDR'
      || bytes.subarray(-12).toString('hex') !== '0000000049454e44ae426082') throw new Error(`Captured PNG dimensions/header are invalid or disagree with its extension: ${path}.`);
    width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20);
  } else {
    if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP'
      || bytes.readUInt32LE(4) + 8 !== bytes.length) throw new Error(`Captured WebP header/length is invalid or disagrees with its extension: ${path}.`);
    try {
      const decoder = sharp(bytes, { failOn: 'warning' });
      const metadata = await decoder.metadata();
      if (metadata.format !== 'webp' || (metadata.pages !== undefined && metadata.pages !== 1)) throw new Error('Capture requires a static WebP image.');
      const decoded = await decoder.raw().toBuffer({ resolveWithObject: true });
      width = decoded.info.width; height = decoded.info.height;
      if (width !== metadata.width || height !== metadata.height) throw new Error('Decoded dimensions disagree with metadata.');
    } catch (error) { throw new Error(`Captured WebP cannot be decoded as a complete static image: ${path}.`, { cause: error }); }
  }
  if (width <= 0 || height <= 0) throw new Error(`Captured ${format} dimensions are invalid: ${path}.`);
  return { format, sha256: createHash('sha256').update(bytes).digest('hex'), width, height };
}
