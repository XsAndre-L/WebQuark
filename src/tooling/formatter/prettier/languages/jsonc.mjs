import { format } from '../standalone.mjs';
import * as babel from '../plugins/babel.mjs';
import * as estree from '../plugins/estree.mjs';

export function formatSource(code) {
  return format(code, { parser: 'jsonc', plugins: [babel, estree],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
