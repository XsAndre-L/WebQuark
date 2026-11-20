import { format } from '../standalone.mjs';
import * as markdown from '../plugins/markdown.mjs';
import * as babel from '../plugins/babel.mjs';
import * as estree from '../plugins/estree.mjs';

export function formatSource(code) {
  return format(code, { parser: 'mdx', plugins: [markdown, babel, estree],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
