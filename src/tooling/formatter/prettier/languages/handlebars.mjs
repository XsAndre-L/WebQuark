import { format } from '../standalone.mjs';
import * as glimmer from '../plugins/glimmer.mjs';

export function formatSource(code) {
  return format(code, { parser: 'glimmer', plugins: [glimmer],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
