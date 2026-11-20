import { format } from '../standalone.mjs';
import * as typescript from '../plugins/typescript.mjs';
import * as estree from '../plugins/estree.mjs';

export function formatSource(code) {
  return format(code, { parser: 'typescript', plugins: [typescript, estree],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
