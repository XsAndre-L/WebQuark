import { formatPrettierSource } from './util/prettier';

export async function formatCss(code: string): Promise<string> {
  return (await formatPrettierSource(code, 'css')).code;
}
