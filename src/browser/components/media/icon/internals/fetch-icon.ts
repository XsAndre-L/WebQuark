import { DEFAULT_FETCH_TIMEOUT_MS } from './constants';
import { MAX_ICON_SVG_BYTES } from './policy';

export async function fetchIconSvg(url: string, fetchTimeout: number): Promise<string> {
  const timeout = Number.isFinite(fetchTimeout) && fetchTimeout > 0 ? fetchTimeout : DEFAULT_FETCH_TIMEOUT_MS;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timer = controller ? setTimeout(() => controller.abort(), timeout) : undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
    if (!response.ok) throw new Error(`Failed to load icon SVG from ${url} (status: ${response.status})`);
    const declaredSize = response.headers?.get('content-length');
    if (declaredSize && Number(declaredSize) > MAX_ICON_SVG_BYTES) {
      controller?.abort();
      await response.body?.cancel().catch(() => undefined);
      throw new Error(`Icon SVG exceeds ${MAX_ICON_SVG_BYTES} bytes.`);
    }
    if (!response.body?.getReader) throw new Error('Icon SVG requires a bounded streaming response.');
    reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const chunks: string[] = [];
    let bytes = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > MAX_ICON_SVG_BYTES) throw new Error(`Icon SVG exceeds ${MAX_ICON_SVG_BYTES} bytes.`);
      chunks.push(decoder.decode(next.value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join('');
  } catch (error) {
    controller?.abort();
    if (reader) await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader?.releaseLock();
    if (timer !== undefined) clearTimeout(timer);
  }
}
