export function getSyntaxBoxCopyText(code: string | undefined, fallbackText: string | null | undefined): string {
  return code !== undefined ? code : fallbackText || '';
}

export async function writeClipboardText(text: string): Promise<void> {
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
    throw new Error('Clipboard API unavailable');
  }

  await navigator.clipboard.writeText(text);
}
