import { describe, expect, it, vi } from 'vitest';
import { escapeHtml, highlight, tokenizeSyntax } from './syntax';
import { LANGUAGE_SOURCE, LITERAL_SOURCES, SYNTAX_LANGUAGES } from '../test/syntax-fixtures';

describe('literal syntax helpers', () => {
  it('highlights HTML names, values and comments without scanning quoted markup as tags', () => {
    const source = '<x-card data-note = "<b>&lt; 雪" disabled><!-- <i key=\'x\'> -->🐦</x-card>';
    const tokens = tokenizeSyntax(source, 'html');
    expect(tokens.map(token => token.text).join('')).toBe(source);
    expect(tokens.filter(token => token.className)).toEqual([
      { text: '<x-card', className: 'code-tag' },
      { text: 'data-note', className: 'code-attr' },
      { text: '"<b>&lt; 雪"', className: 'code-value' },
      { text: '>', className: 'code-tag' },
      { text: '<!-- <i key=\'x\'> -->', className: 'code-comment' },
      { text: '</x-card', className: 'code-tag' },
      { text: '>', className: 'code-tag' },
    ]);
  });
  it('uses HTML quote termination while preserving literal backslashes', () => {
    const source = String.raw`<a title="x\">`;
    expect(tokenizeSyntax(source, 'html').filter(token => token.className)).toEqual([
      { text: '<a', className: 'code-tag' },
      { text: 'title', className: 'code-attr' },
      { text: String.raw`"x\"`, className: 'code-value' },
      { text: '>', className: 'code-tag' },
    ]);
  });
  it('highlights JavaScript keywords, calls and numbers while treating strings/comments as whole tokens', () => {
    const quoted = String.raw`"keep \"const call(12)\" 雪"`;
    const template = '`keep \\` ${call(1)} 🐦`';
    const source = 'const message = ' + quoted + ';\r\n/* return call(3) */\tinvoke (' + template + ', 12.5); // new(4)';
    const tokens = tokenizeSyntax(source, 'javascript');
    expect(tokens.map(token => token.text).join('')).toBe(source);
    expect(tokens.filter(token => token.className)).toEqual([
      { text: 'const', className: 'code-tag' },
      { text: quoted, className: 'code-value' },
      { text: '/* return call(3) */', className: 'code-comment' },
      { text: 'invoke', className: 'code-attr' },
      { text: template, className: 'code-value' },
      { text: '12.5', className: 'code-number' },
      { text: '// new(4)', className: 'code-comment' },
    ]);
  });
  it('classifies whole JavaScript identifiers and respects Unicode line separators after comments', () => {
    expect(tokenizeSyntax('$const const$ 1const', 'javascript')).toEqual([{ text: '$const const$ 1const' }]);
    expect(tokenizeSyntax('// 雪\u2028const x = true;\u2029// 🐦', 'javascript').filter(token => token.className)).toEqual([
      { text: '// 雪', className: 'code-comment' },
      { text: 'const', className: 'code-tag' },
      { text: 'true', className: 'code-tag' },
      { text: '// 🐦', className: 'code-comment' },
    ]);
  });
  it.each([
    ['html', '<!-- unfinished <b key="x">', 'code-comment'],
    ['html', '"unfinished <b key=\'x\'>', 'code-value'],
    ['javascript', '/* unfinished const call(1)', 'code-comment'],
    ['javascript', String.raw`'unfinished \' call(1)`, 'code-value'],
    ['javascript', '`unfinished ${call(1)}', 'code-value'],
  ] as const)('keeps an incomplete %s comment or quote together: %s', (language, source, className) => {
    expect(tokenizeSyntax(source, language)).toEqual([{ text: source, className }]);
  });
  for (const language of ['html', 'javascript'] as const) {
    it.each(['a', ' ', '1'])(`${language}: keeps a long unmatched lexical run as one token: %s`, char => {
      const source = char.repeat(65536);
      const tokens = tokenizeSyntax(source, language);
      expect(tokens.map(token => token.text).join('')).toBe(source);
      expect(tokens).toHaveLength(1);
    });
    it(`${language}: consumes a long successful name without splitting it into suffixes`, () => {
      const name = 'a'.repeat(65536);
      const source = language === 'html' ? '<x ' + name + ' = "雪">' : name + ' \t(1)';
      const tokens = tokenizeSyntax(source, language);
      expect(tokens.map(token => token.text).join('')).toBe(source);
      expect(tokens).toContainEqual({ text: name, className: 'code-attr' });
      expect(tokens.length).toBeLessThan(8);
    });
  }
  it('highlights CSS selectors, properties, values, comments and escaped strings without rescanning strings', () => {
    const source = '.card:hover { /* } */ color: red; content: "a\\\";{}"; --accent: blue; }';
    const tokens = tokenizeSyntax(source, 'css');
    expect(tokens.map(token => token.text).join('')).toBe(source);
    expect(tokens).toContainEqual({ text: '.card:hover ', className: 'code-tag' });
    expect(tokens).toContainEqual({ text: ' color', className: 'code-attr' });
    expect(tokens).toContainEqual({ text: ' red', className: 'code-value' });
    expect(tokens).toContainEqual({ text: '/* } */', className: 'code-comment' });
    expect(tokens).toContainEqual({ text: '"a\\\";{}"', className: 'code-value' });
  });
  it.each([' ', 'a', '.unfinished:', '/* unfinished ', '"unfinished '])('handles long incomplete CSS runs in bounded time: %s', fragment => {
    const source = fragment.repeat(32768);
    const started = performance.now();
    const tokens = tokenizeSyntax(source, 'css');
    expect(tokens.map(token => token.text).join('')).toBe(source);
    // Generous for CI, but excludes the previous seconds-long suffix retries.
    expect(performance.now() - started).toBeLessThan(300);
  });
  it('escapes mixed raw/entity-looking source without trusting the entire string', () => {
    expect(escapeHtml('<b>&lt; &gt; &amp; &#39; "\'</b>')).toBe('&lt;b&gt;&amp;lt; &amp;gt; &amp;amp; &amp;#39; "\'&lt;/b&gt;');
    expect(escapeHtml('')).toBe('');
  });
  for (const language of SYNTAX_LANGUAGES) {
    it.each([...LITERAL_SOURCES, ['language spacing, strings and comments', LANGUAGE_SOURCE[language]], ['control characters', '\0\ud800\r\n\u2028\u2029']])(`${language}: unchanged token source for %s`, (_case, source) => {
      expect(tokenizeSyntax(source, language).map(token => token.text).join('')).toBe(source);
      expect(highlight(source, language)).not.toContain('<b>');
      expect(highlight(source, language)).not.toContain('<q-button>');
    });
    it(`${language}: preserves arbitrary deterministic source and empty input`, () => {
      let seed = 49;
      const alphabet = '<>"\'&;:=/\\*{}[]()\t \r\n\0\ud800雪🐦0123456789abcdef';
      for (let run = 0; run < 40; run++) {
        let source = '';
        for (let i = 0; i < 120; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; source += alphabet[seed % alphabet.length]; }
        expect(tokenizeSyntax(source, language).map(token => token.text).join('')).toBe(source);
      }
      expect(tokenizeSyntax('', language)).toEqual([]); expect(highlight('', language)).toBe('');
    });
  }
  it('imports and highlights without browser globals', async () => {
    vi.stubGlobal('document', undefined); vi.stubGlobal('DOMParser', undefined); vi.stubGlobal('XMLSerializer', undefined);
    try { vi.resetModules(); const syntax = await import('./syntax'); expect(syntax.highlightHtml('<b>&lt;</b>')).toContain('&amp;lt;'); }
    finally { vi.unstubAllGlobals(); }
  });
});
