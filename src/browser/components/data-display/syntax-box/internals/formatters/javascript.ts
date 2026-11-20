import { formatPrettierSource } from './util/prettier';

export async function formatJs(code: string): Promise<string> {
  return (await formatPrettierSource(code, 'javascript')).code;
}
