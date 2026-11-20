import type { SyntaxFormatResult } from '../formatter.types';
import type { FormatterLanguage } from '../languages';

export async function formatPrettierSource(code: string, language: FormatterLanguage): Promise<SyntaxFormatResult> {
  let format: (code: string) => Promise<string>;
  try {
    const formatter = await import('@webquark/browser/formatters/runtime');
    format = await formatter.loadFormatter(language);
  } catch {
    return { code, status: 'unavailable' };
  }

  try {
    const formatted = await format(code);
    return { code: formatted, status: formatted === code ? 'unchanged' : 'formatted' };
  } catch (error) {
    return { code, status: error instanceof SyntaxError ? 'invalid' : 'failed' };
  }
}
