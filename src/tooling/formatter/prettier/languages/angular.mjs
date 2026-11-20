import { format } from '../standalone.mjs';
import * as html from '../plugins/html.mjs';
import * as angular from '../plugins/angular.mjs';
import * as babel from '../plugins/babel.mjs';
import * as estree from '../plugins/estree.mjs';

export function formatSource(code) {
  return format(code, { parser: 'angular', plugins: [html, angular, babel, estree],
    htmlWhitespaceSensitivity: 'strict', embeddedLanguageFormatting: 'off' });
}
