import { format } from '../standalone.mjs';
import * as yaml from '../plugins/yaml.mjs';

export function formatSource(code) {
  return format(code, { parser: 'yaml', plugins: [yaml],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
