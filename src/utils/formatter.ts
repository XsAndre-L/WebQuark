/**
 * @fileoverview Modular auto-formatting utilities for WebQuark.
 */

/**
 * Formats a JSON string with 2-space indentation.
 */
export function formatJson(code: string): string {
  try {
    return JSON.stringify(JSON.parse(code), null, 2);
  } catch (e) {
    return code;
  }
}

/**
 * Formats CSS rules, block containers, and braces.
 */
export function formatCss(code: string): string {
  let formatted = '';
  let indentLevel = 0;
  
  const clean = code
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\{/g, ' {\n')
    .replace(/\}/g, '\n}\n')
    .replace(/\;/g, ';\n');
  
  const lines = clean.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    if (line === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    formatted += '  '.repeat(indentLevel) + line + '\n';
    
    if (line.endsWith('{')) {
      indentLevel++;
    }
  }
  return formatted.trim();
}

/**
 * Helper to format attributes of a tag. If there is more than one attribute,
 * it stacks them vertically on separate indented lines.
 */
function formatTagAttributes(tag: string, indent: number): string {
  const isSelfClosing = tag.endsWith('/>');
  const cleanTag = tag.trim().replace(/^<\/?/, '').replace(/\/?>$/, '').trim();
  
  const firstSpace = cleanTag.indexOf(' ');
  if (firstSpace === -1) {
    return tag;
  }
  
  const tagName = cleanTag.slice(0, firstSpace);
  const attrSection = cleanTag.slice(firstSpace).trim();
  
  const attrRegex = /([a-zA-Z0-9\-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  const attributes: string[] = [];
  let match;
  while ((match = attrRegex.exec(attrSection)) !== null) {
    const attrName = match[1];
    const attrVal = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : match[4]);
    if (attrVal !== undefined) {
      attributes.push(`${attrName}="${attrVal}"`);
    } else {
      attributes.push(attrName);
    }
  }
  
  if (attributes.length <= 1) {
    return tag;
  }
  
  const baseIndent = '  '.repeat(indent);
  const attrIndent = '  '.repeat(indent + 1);
  
  let result = `${baseIndent}<${tagName}\n`;
  result += attributes.map(attr => `${attrIndent}${attr}`).join('\n');
  result += `\n${baseIndent}${isSelfClosing ? '/>' : '>'}`;
  return result;
}

/**
 * Formats HTML tags, maintaining indentation levels for nested structures
 * while ignoring void elements (e.g. img, br, input).
 */
export function formatHtml(code: string): string {
  let formatted = '';
  let indentLevel = 0;
  
  const clean = code
    .replace(/>\s*</g, '>\n<')
    .replace(/(<[^>]+>)/g, '\n$1\n');
      
  const lines = clean.split('\n');
  const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    const isClosing = line.startsWith('</');
    const isOpening = line.startsWith('<') && !line.startsWith('</') && !line.startsWith('<!--');
    
    let isVoid = false;
    if (isOpening) {
      const tagNameMatch = line.match(/^<([a-zA-Z0-9\-]+)/);
      if (tagNameMatch) {
        const tagName = tagNameMatch[1].toLowerCase();
        if (voidTags.includes(tagName)) {
          isVoid = true;
        }
      }
    }
    
    if (isClosing) {
      indentLevel = Math.max(0, indentLevel - 1);
      formatted += '  '.repeat(indentLevel) + line + '\n';
    } else if (line.startsWith('<!--')) {
      formatted += '  '.repeat(indentLevel) + line + '\n';
    } else if (line.startsWith('<')) {
      const formattedTag = formatTagAttributes(line, indentLevel);
      if (formattedTag === line) {
        formatted += '  '.repeat(indentLevel) + line + '\n';
      } else {
        formatted += formattedTag + '\n';
      }

      const isSelfClosing = line.endsWith('/>');
      if (!isSelfClosing && !isVoid) {
        indentLevel++;
      }
    } else {
      formatted += '  '.repeat(indentLevel) + line + '\n';
    }
  }
  return formatted.trim();
}

/**
 * Formats simple JavaScript code block braces and rule statements.
 */
export function formatJs(code: string): string {
  let formatted = '';
  let indentLevel = 0;
  
  const clean = code
    .replace(/\s+/g, ' ')
    .replace(/\{/g, ' {\n')
    .replace(/\}/g, '\n}\n')
    .replace(/\;/g, ';\n');
      
  const lines = clean.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    if (line === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    formatted += '  '.repeat(indentLevel) + line + '\n';
    
    if (line.endsWith('{')) {
      indentLevel++;
    }
  }
  return formatted.trim();
}

/**
 * Main auto-formatter entrypoint.
 */
export function formatCode(code: string, language: string): string {
  if (!code) return '';
  switch (language.toLowerCase()) {
    case 'json':
      return formatJson(code);
    case 'html':
      return formatHtml(code);
    case 'css':
      return formatCss(code);
    case 'javascript':
    case 'js':
      return formatJs(code);
    default:
      return code;
  }
}
