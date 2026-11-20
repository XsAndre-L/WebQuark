import { format } from '../standalone.mjs';
import * as html from '../plugins/html.mjs';
import * as babel from '../plugins/babel.mjs';
import * as estree from '../plugins/estree.mjs';
import * as typescript from '../plugins/typescript.mjs';

export function formatSource(code) {
  return format(code, { parser: 'vue', plugins: [html, babel, estree, typescript],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
