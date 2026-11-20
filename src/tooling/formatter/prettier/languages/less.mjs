import { format } from '../standalone.mjs';
import * as postcss from '../plugins/postcss.mjs';

export function formatSource(code) {
  return format(code, { parser: 'less', plugins: [postcss],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
