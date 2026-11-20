import { format } from '../standalone.mjs';
import * as html from '../plugins/html.mjs';

export function formatSource(code) {
  return format(code, { parser: 'lwc', plugins: [html],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
