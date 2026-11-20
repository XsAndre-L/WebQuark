export interface SyntaxFormatResult {
  code: string;
  status: 'formatted' | 'unchanged' | 'invalid' | 'unsupported';
}
