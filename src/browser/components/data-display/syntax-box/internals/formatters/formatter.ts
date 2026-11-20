import type { SyntaxFormatResult } from './formatter.types';
import { formatJsonSource } from './json';
import { formatterLanguage } from './languages';
import { formatPrettierSource } from './util/prettier';

export type { SyntaxFormatResult } from './formatter.types';
export { formatHtml } from './html';
export { formatJs } from './javascript';
export { formatCss } from './css';
export { formatJson } from './json';

export function isFormatSupported(language: string): boolean {
  return formatterLanguage(language) !== undefined;
}

export function formatSource(code: string, language: 'json'): SyntaxFormatResult;
export function formatSource(code: string, language: string): SyntaxFormatResult | Promise<SyntaxFormatResult>;
export function formatSource(code: string, language: string): SyntaxFormatResult | Promise<SyntaxFormatResult> {
  const selected = formatterLanguage(language);
  if (!selected) return { code, status: 'unsupported' };
  return selected === 'json' ? formatJsonSource(code) : formatPrettierSource(code, selected);
}

export function formatCode(code: string, language: string): string | Promise<string> {
  const result = formatSource(code, language);
  return result instanceof Promise ? result.then(value => value.code) : result.code;
}
