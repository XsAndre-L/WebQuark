import { DEFAULT_FETCH_TIMEOUT_MS } from './constants';

export async function fetchIconSvg(url: string, fetchTimeout: number): Promise<string> {
  const timeout = Number.isFinite(fetchTimeout) && fetchTimeout > 0 ? fetchTimeout : DEFAULT_FETCH_TIMEOUT_MS;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timer = controller ? setTimeout(() => controller.abort(), timeout) : undefined;

  try {
    const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
    if (!response.ok) {
      throw new Error(`Failed to load icon SVG from ${url} (status: ${response.status})`);
    }
    return await response.text();
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
