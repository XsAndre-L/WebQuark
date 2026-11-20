import type { SyntaxFormatResult } from './formatter.types';
import { formatJsonSource } from './json';

export type { SyntaxFormatResult } from './formatter.types';
export { formatHtml } from './html';
export { formatJs } from './javascript';
export { formatCss } from './css';
export { formatJson } from './json';

const sourceFormatters = new Map<string, (code: string) => SyntaxFormatResult>([
  ['json', formatJsonSource],
]);

function getFormatter(language: string) {
  return typeof language === 'string' ? sourceFormatters.get(language.toLowerCase()) : undefined;
}

export function isFormatSupported(language: string): boolean {
  return getFormatter(language) !== undefined;
}

export function formatSource(code: string, language: string): SyntaxFormatResult {
  const format = getFormatter(language);
  return format ? format(code) : { code, status: 'unsupported' };
}

export function formatCode(code: string, language: string): string {
  return formatSource(code, language).code;
}
