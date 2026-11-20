// The keys are the language values accepted by both Syntax Box and Syntax View.
export const formatterLanguages = {
  html: 'HTML', javascript: 'JavaScript', css: 'CSS', json: 'JSON',
  typescript: 'TypeScript', jsx: 'JSX', tsx: 'TSX', flow: 'Flow',
  json5: 'JSON5', jsonc: 'JSON with Comments', 'json-stringify': 'JSON.stringify',
  postcss: 'PostCSS', less: 'Less', scss: 'SCSS',
  angular: 'Angular', vue: 'Vue', lwc: 'Lightning Web Components', mjml: 'MJML',
  handlebars: 'Handlebars', graphql: 'GraphQL', markdown: 'Markdown', mdx: 'MDX', yaml: 'YAML',
} as const;

export type FormatterLanguage = keyof typeof formatterLanguages;

export function formatterLanguage(value: string): FormatterLanguage | undefined {
  const key = typeof value === 'string' ? value.toLowerCase() : '';
  if (key === 'js') return 'javascript';
  return Object.prototype.hasOwnProperty.call(formatterLanguages, key) ? key as FormatterLanguage : undefined;
}
