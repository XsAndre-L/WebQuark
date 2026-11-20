import { format } from '../standalone.mjs';
import * as flow from '../plugins/flow.mjs';
import * as estree from '../plugins/estree.mjs';

export function formatSource(code) {
  return format(code, { parser: 'flow', plugins: [flow, estree],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
