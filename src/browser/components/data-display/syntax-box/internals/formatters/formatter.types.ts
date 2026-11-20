export interface SyntaxFormatResult {
  code: string;
  status: 'formatted' | 'unchanged' | 'invalid' | 'unsupported' | 'unavailable' | 'failed';
}
