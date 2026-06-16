/**
 * @fileoverview Syntax highlighting utilities for q-syntax-box.
 */

export function escapeHtml(text: string): string {
  if (!text) return '';
  if (text.includes('&lt;') || text.includes('&gt;') || text.includes('&amp;')) {
    return text;
  }
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function highlightHtml(text: string): string {
  let esc = escapeHtml(text);
  return esc
    // Match comments: <!-- ... -->
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="code-comment">$1</span>')
    // Match attribute values: double quotes or single quotes
    .replace(/(&quot;.*?&quot;)/gi, '<span class="code-value">$1</span>')
    .replace(/(&#39;.*?&#39;)/gi, '<span class="code-value">$1</span>')
    // Match attributes: whitespace followed by name, then =
    .replace(/(\s[a-z0-9-]+)=/gi, ' <span class="code-attr">$1</span>=')
    // Match tag start: </?tagname
    .replace(/(&lt;\/?[a-z0-9-]+)/gi, '<span class="code-tag">$1</span>')
    // Match close tags: >
    .replace(/(&gt;)/g, '<span class="code-tag">&gt;</span>');
}

export function highlightJavascript(text: string): string {
  let esc = escapeHtml(text);
  const tokenRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|export|import|from|new|this|typeof|instanceof|try|catch|finally|throw|async|await|null|undefined|true|false)\b)|(\b\d+\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b(?=\s*\())/g;

  return esc.replace(tokenRegex, (match, comment, str, keyword, num, fn) => {
    if (comment) {
      return `<span class="code-comment">${comment}</span>`;
    }
    if (str) {
      return `<span class="code-value">${str}</span>`;
    }
    if (keyword) {
      return `<span class="code-tag">${keyword}</span>`;
    }
    if (num) {
      return `<span class="code-number">${num}</span>`;
    }
    if (fn) {
      return `<span class="code-attr">${fn}</span>`;
    }
    return match;
  });
}

export function highlightCss(text: string): string {
  let esc = escapeHtml(text);
  const tokenRegex = /(\/\*[\s\S]*?\*\/)|((?:^|\})[^{]*\{)|(\b[a-zA-Z\-]+\b\s*:)|(:\s*[^;\}]+)|("[^"]*"|'[^']*')/g;

  return esc.replace(tokenRegex, (match, comment, selectorRule, property, value, str) => {
    if (comment) {
      return `<span class="code-comment">${comment}</span>`;
    }
    if (selectorRule) {
      const braceIdx = selectorRule.indexOf('{');
      const selector = selectorRule.slice(0, braceIdx);
      return `<span class="code-tag">${selector}</span>{`;
    }
    if (property) {
      const propName = property.replace(':', '').trim();
      return `<span class="code-attr">${propName}</span>:`;
    }
    if (value) {
      const valText = value.slice(1);
      return `:<span class="code-value">${valText}</span>`;
    }
    if (str) {
      return `<span class="code-value">${str}</span>`;
    }
    return match;
  });
}

export function highlightJson(text: string): string {
  let esc = escapeHtml(text);
  const tokenRegex = /("[^"]*")\s*:|(:\s*"[^"]*")|("[^"]*")|(\b(?:true|false|null|\d+(?:\.\d+)?)\b)/g;

  return esc.replace(tokenRegex, (match, key, valWithColon, standaloneStr, literal) => {
    if (key) {
      return `<span class="code-tag">${key}</span>:`;
    }
    if (valWithColon) {
      const val = valWithColon.slice(valWithColon.indexOf(':') + 1).trim();
      return `: <span class="code-value">${val}</span>`;
    }
    if (standaloneStr) {
      return `<span class="code-value">${standaloneStr}</span>`;
    }
    if (literal) {
      return `<span class="code-attr">${literal}</span>`;
    }
    return match;
  });
}

export function highlight(text: string, language: 'html' | 'javascript' | 'css' | 'json'): string {
  if (!text) return '';
  switch (language) {
    case 'html':
      return highlightHtml(text);
    case 'javascript':
      return highlightJavascript(text);
    case 'css':
      return highlightCss(text);
    case 'json':
      return highlightJson(text);
    default:
      return escapeHtml(text);
  }
}
