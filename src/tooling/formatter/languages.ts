import type { FormatterLanguage } from '../../browser/components/data-display/syntax-box/internals/formatters/languages';

type Language = { parser: string; plugins: string[]; sample: string };
const javascript = ['babel', 'estree'];
const typescript = ['typescript', 'estree'];

export const languages: Record<FormatterLanguage, Language> = {
  html: { parser: 'html', plugins: ['html'], sample: '<q-button   slot="actions">OK</q-button>' },
  javascript: { parser: 'babel', plugins: javascript, sample: 'const x={n:1}' },
  css: { parser: 'css', plugins: ['postcss'], sample: 'p{color:red}' },
  json: { parser: 'json', plugins: javascript, sample: '{"x":1}' },
  typescript: { parser: 'typescript', plugins: typescript, sample: 'let x:number=1' },
  jsx: { parser: 'babel', plugins: javascript, sample: 'const x=<div/>' },
  tsx: { parser: 'typescript', plugins: typescript, sample: 'const x: JSX.Element=<div/>' },
  flow: { parser: 'flow', plugins: ['flow', 'estree'], sample: 'type T={x:string}' },
  json5: { parser: 'json5', plugins: javascript, sample: '{x:1}' },
  jsonc: { parser: 'jsonc', plugins: javascript, sample: '{"x":1 /* comment */}' },
  'json-stringify': { parser: 'json-stringify', plugins: javascript, sample: '{"x":1}' },
  postcss: { parser: 'css', plugins: ['postcss'], sample: 'p{color:red}' },
  less: { parser: 'less', plugins: ['postcss'], sample: '@size:2px;p{width:@size}' },
  scss: { parser: 'scss', plugins: ['postcss'], sample: '$size:2px;p{width:$size}' },
  angular: { parser: 'angular', plugins: ['html', 'angular', ...javascript], sample: '<p>{{ title }}</p>' },
  vue: { parser: 'vue', plugins: ['html', ...javascript, 'typescript'], sample: '<template><p>{{ title }}</p></template>' },
  lwc: { parser: 'lwc', plugins: ['html'], sample: '<template><p>{name}</p></template>' },
  mjml: { parser: 'mjml', plugins: ['html'], sample: '<mjml><mj-body></mj-body></mjml>' },
  handlebars: { parser: 'glimmer', plugins: ['glimmer'], sample: '<p   class="name">{{name}}</p>' },
  graphql: { parser: 'graphql', plugins: ['graphql'], sample: 'query Q{viewer{id}}' },
  markdown: { parser: 'markdown', plugins: ['markdown'], sample: '# Title' },
  mdx: { parser: 'mdx', plugins: ['markdown', ...javascript], sample: '# Title\n\n<Example />' },
  yaml: { parser: 'yaml', plugins: ['yaml'], sample: 'items: [a,b]' },
};
