import { format } from '../standalone.mjs';
import * as markdown from '../plugins/markdown.mjs';

export function formatSource(code) {
  return format(code, { parser: 'markdown', plugins: [markdown],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
