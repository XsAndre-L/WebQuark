import { format } from '../standalone.mjs';
import * as graphql from '../plugins/graphql.mjs';

export function formatSource(code) {
  return format(code, { parser: 'graphql', plugins: [graphql],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
