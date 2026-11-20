import { formatPrettierSource } from './util/prettier';

export async function formatHtml(code: string): Promise<string> {
  return (await formatPrettierSource(code, 'html')).code;
}
