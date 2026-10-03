/** Syntax highlighting of literal source, independent of browser globals. */
export interface SyntaxToken {
  text: string;
  className?: 'code-comment' | 'code-value' | 'code-tag' | 'code-number' | 'code-attr';
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Each token and gap is an unchanged slice of the source; generated markup is never scanned. */
function scan(text: string, pattern: RegExp, classify: (match: RegExpExecArray) => SyntaxToken['className']): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let offset = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (offset < match.index) tokens.push({ text: text.slice(offset, match.index) });
    tokens.push({ text: match[0], className: classify(match) });
    offset = match.index + match[0].length;
  }
  if (offset < text.length) tokens.push({ text: text.slice(offset) });
  return tokens;
}

/** Keep unhighlighted runs together so long edits do not create a text node per character. */
function tokenWriter(text: string) {
  const tokens: SyntaxToken[] = [];
  let plainStart = 0;
  return {
    emit(start: number, end: number, className: SyntaxToken['className']) {
      if (plainStart < start) tokens.push({ text: text.slice(plainStart, start) });
      tokens.push({ text: text.slice(start, end), className });
      plainStart = end;
    },
    finish() {
      if (plainStart < text.length) tokens.push({ text: text.slice(plainStart) });
      return tokens;
    },
  };
}

function isLetter(char: string): boolean {
  return char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z';
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function isWord(char: string): boolean {
  return isLetter(char) || isDigit(char) || char === '_';
}

function skipWhitespace(text: string, offset: number): number {
  while (offset < text.length && /\s/.test(text[offset])) offset++;
  return offset;
}

function quotedEnd(text: string, start: number, escaped: boolean): number {
  const quote = text[start];
  let offset = start + 1;
  while (offset < text.length) {
    if (escaped && text[offset] === '\\') offset = Math.min(text.length, offset + 2);
    else if (text[offset++] === quote) break;
  }
  return offset;
}

/** Consume each name once instead of retrying an attribute lookahead at every suffix. */
function tokenizeHtml(text: string): SyntaxToken[] {
  const writer = tokenWriter(text);
  let offset = 0;
  while (offset < text.length) {
    const start = offset;
    const char = text[offset];
    if (text.startsWith('<!--', offset)) {
      const end = text.indexOf('-->', offset + 4);
      offset = end === -1 ? text.length : end + 3;
      writer.emit(start, offset, 'code-comment');
    } else if (char === '<' && isLetter(text[offset + (text[offset + 1] === '/' ? 2 : 1)])) {
      offset += text[offset + 1] === '/' ? 3 : 2;
      while (offset < text.length && (isWord(text[offset]) || text[offset] === ':' || text[offset] === '-')) offset++;
      writer.emit(start, offset, 'code-tag');
    } else if (char === '"' || char === "'") {
      // HTML uses entities for embedded quotes; a backslash does not escape its delimiter.
      offset = quotedEnd(text, start, false);
      writer.emit(start, offset, 'code-value');
    } else if (char === '>' || char === '/' && text[offset + 1] === '>') {
      offset += char === '/' ? 2 : 1;
      writer.emit(start, offset, 'code-tag');
    } else if (isWord(char) || char === ':' || char === '-') {
      offset++;
      while (offset < text.length && (isWord(text[offset]) || text[offset] === ':' || text[offset] === '-')) offset++;
      if (text[skipWhitespace(text, offset)] === '=') writer.emit(start, offset, 'code-attr');
    } else offset++;
  }
  return writer.finish();
}

const JAVASCRIPT_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case',
  'break', 'continue', 'class', 'export', 'import', 'from', 'new', 'this', 'typeof', 'instanceof',
  'try', 'catch', 'finally', 'throw', 'async', 'await', 'null', 'undefined', 'true', 'false',
]);

/** Consume strings/comments before identifiers so their contents are never scanned as code. */
function tokenizeJavascript(text: string): SyntaxToken[] {
  const writer = tokenWriter(text);
  let offset = 0;
  while (offset < text.length) {
    const start = offset;
    const char = text[offset];
    if (char === '/' && text[offset + 1] === '/') {
      offset += 2;
      while (offset < text.length && !/[\r\n\u2028\u2029]/.test(text[offset])) offset++;
      writer.emit(start, offset, 'code-comment');
    } else if (char === '/' && text[offset + 1] === '*') {
      const end = text.indexOf('*/', offset + 2);
      offset = end === -1 ? text.length : end + 2;
      writer.emit(start, offset, 'code-comment');
    } else if (char === '"' || char === "'" || char === '`') {
      offset = quotedEnd(text, start, true);
      writer.emit(start, offset, 'code-value');
    } else if (isLetter(char) || char === '_' || char === '$') {
      offset++;
      while (offset < text.length && (isWord(text[offset]) || text[offset] === '$')) offset++;
      if (JAVASCRIPT_KEYWORDS.has(text.slice(start, offset))) writer.emit(start, offset, 'code-tag');
      else if (text[skipWhitespace(text, offset)] === '(') writer.emit(start, offset, 'code-attr');
    } else if (isDigit(char)) {
      while (offset < text.length && isDigit(text[offset])) offset++;
      if (text[offset] === '.' && isDigit(text[offset + 1])) {
        offset++;
        while (offset < text.length && isDigit(text[offset])) offset++;
      }
      if (isWord(text[offset]) || text[offset] === '$') {
        // An unfinished number/identifier is one plain run, not a highlighted suffix.
        while (offset < text.length && (isWord(text[offset]) || text[offset] === '$')) offset++;
      } else writer.emit(start, offset, 'code-number');
    } else offset++;
  }
  return writer.finish();
}

/** Consume CSS once, including incomplete edits; never retry a selector suffix. */
function tokenizeCss(text: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let mode: 'selector' | 'property' | 'value' = 'selector';
  let depth = 0;
  let offset = 0;
  const emit = (start: number, end: number, className?: SyntaxToken['className']) => {
    if (end > start) tokens.push({ text: text.slice(start, end), className });
  };
  while (offset < text.length) {
    const start = offset;
    const char = text[offset];
    if (char === '/' && text[offset + 1] === '*') {
      const end = text.indexOf('*/', offset + 2);
      offset = end === -1 ? text.length : end + 2;
      emit(start, offset, 'code-comment');
    } else if (char === '"' || char === "'") {
      offset++;
      while (offset < text.length) {
        if (text[offset] === '\\') offset = Math.min(text.length, offset + 2);
        else if (text[offset++] === char) break;
      }
      emit(start, offset, 'code-value');
    } else if (char === '{' || char === '}' || char === ';' || (char === ':' && mode === 'property')) {
      offset++;
      emit(start, offset);
      if (char === '{') { depth++; mode = 'property'; }
      else if (char === '}') { depth = Math.max(0, depth - 1); mode = depth ? 'property' : 'selector'; }
      else if (char === ';') mode = depth ? 'property' : 'selector';
      else mode = 'value';
    } else {
      // Each character belongs to exactly one run or lexical token.
      while (offset < text.length) {
        const next = text[offset];
        if (next === '"' || next === "'" || next === '{' || next === '}' || next === ';' ||
          (next === ':' && mode === 'property') || (next === '/' && text[offset + 1] === '*')) break;
        offset++;
      }
      emit(start, offset, mode === 'selector' ? 'code-tag' : mode === 'property' ? 'code-attr' : 'code-value');
    }
  }
  return tokens;
}

export function tokenizeSyntax(text: string, language: 'html' | 'javascript' | 'css' | 'json'): SyntaxToken[] {
  switch (language) {
    case 'html':
      return tokenizeHtml(text);
    case 'javascript':
      return tokenizeJavascript(text);
    case 'css':
      return tokenizeCss(text);
    case 'json':
      return scan(text, /("(?:[^"\\]|\\[\s\S])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b)/g,
        match => match[1] ? /^\s*:/.test(text.slice(match.index + match[0].length)) ? 'code-tag' : 'code-value' : 'code-attr');
    default:
      return text ? [{ text }] : [];
  }
}

/** HTML-string callers escape each raw segment once; components can render the same tokens as text nodes. */
export function highlight(text: string, language: 'html' | 'javascript' | 'css' | 'json'): string {
  return tokenizeSyntax(text, language).map(token => token.className
    ? `<span class="${token.className}">${escapeHtml(token.text)}</span>`
    : escapeHtml(token.text)).join('');
}

export const highlightHtml = (text: string): string => highlight(text, 'html');
export const highlightJavascript = (text: string): string => highlight(text, 'javascript');
export const highlightCss = (text: string): string => highlight(text, 'css');
export const highlightJson = (text: string): string => highlight(text, 'json');
