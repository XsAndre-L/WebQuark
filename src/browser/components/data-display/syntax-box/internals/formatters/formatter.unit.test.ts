import { describe, expect, it, vi } from 'vitest';
import { formatCode, formatCss, formatHtml, formatJs, formatJson, formatSource, isFormatSupported } from './formatter';
import { MAX_JSON_FORMAT_DEPTH, MAX_JSON_FORMAT_INPUT, MAX_JSON_FORMAT_OUTPUT } from './json';
import { INVALID_JSON, JSON_EXPECTED, JSON_SOURCE, jsonTokens, NON_JSON_SOURCE } from '../../test/format-fixtures';

describe('explicit token-preserving formatter', () => {
  it('formats JSON with two-space/LF indentation', () => {
    expect(formatCode('{"a":1,"b":[2,3]}', 'json')).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });
  it('preserves raw numeric spelling, negative zero, duplicate members, order and escapes', () => {
    expect(formatJson(JSON_SOURCE)).toBe(JSON_EXPECTED); expect(jsonTokens(formatJson(JSON_SOURCE))).toEqual(jsonTokens(JSON_SOURCE));
    expect(formatSource(JSON_SOURCE, 'json').status).toBe('formatted');
    expect(formatSource(JSON_EXPECTED, 'json')).toEqual({ code: JSON_EXPECTED, status: 'unchanged' });
  });
  it.each(['{}', '[]', 'true', 'false', 'null', '-0', '1e400', '"  space  "', '"\\uD800"', '"\\uDEAD"', '"line\\r\\nnext"', '"//not a comment"'])('retains primitive/empty/escaped input %s', source => {
    expect(formatJson(source)).toBe(source); expect(formatSource(source, 'json').status).toBe('unchanged');
  });
  it.each(INVALID_JSON)('leaves %s exactly intact on rejected grammar', (_case, source) => {
    expect(formatSource(source, 'json')).toEqual({ code: source, status: 'invalid' }); expect(formatCode(source, 'json')).toBe(source);
  });
  it.each(NON_JSON_SOURCE)('routes %s through its embedded formatter', async (language, source) => {
    expect(isFormatSupported(language)).toBe(true);
    const result = await formatSource(source, language);
    expect(result.status).toBe('formatted');
    expect(await formatCode(result.code, language)).toBe(result.code);
  });
  it('retains named helpers and the JavaScript alias', async () => {
    expect(await formatHtml('Hello <b>world</b>!')).toContain('Hello <b>world</b>!');
    expect(await formatJs('const x=1')).toBe(await formatCode('const x=1', 'js'));
    expect(await formatCss('p{color:red}')).toContain('color: red;');
    expect(formatCode('literal', 'unknown')).toBe('literal'); expect(formatCode('', 'json')).toBe('');
    expect(isFormatSupported('JSON')).toBe(true);
  });
  it.each(['<q-button>', '<div><b>x</b>', '<q-button label="'])('keeps an incomplete HTML draft intact: %s', async code => {
    expect(await formatSource(code, 'html')).toEqual({ code, status: 'invalid' });
  });
  it('preserves text-only slots, outer spacing and literal element contents', async () => {
    const label = '  Save changes\r\n';
    expect(await formatSource(label, 'html')).toEqual({ code: label, status: 'unchanged' });
    const raw = ['pre', 'textarea', 'script', 'style'].map(name => `<${name}>\r\n  x  \r\n</${name}>`).join('');
    const source = '\t<div   id="log">' + raw + '</div>  ';
    const result = await formatSource(source, 'html');
    expect(result.status).toBe('formatted');
    expect(result.code.startsWith('\t<div id="log">')).toBe(true);
    expect(result.code.match(/\s+$/)?.[0]).toBe('  ');
    for (const tag of ['pre', 'textarea', 'script', 'style']) {
      expect(result.code).toContain(`<${tag}>\r\n  x  \r\n</${tag}`);
    }
    expect(await formatHtml(result.code)).toBe(result.code);
  });
  it('accepts HTML with optional end tags', async () => {
    expect((await formatSource('<ul><li>one<li>two</ul>', 'html')).status).toBe('formatted');
  });
  it('distinguishes a rejected Vue draft from a missing formatter', async () => {
    const source = '<template></bad>';
    const result = await formatSource(source, 'vue');
    expect(result.code).toBe(source);
    expect(['invalid', 'failed']).toContain(result.status);
  });
  it('never parses JSON through JavaScript values or stringifies values', () => {
    const parse = vi.spyOn(JSON, 'parse'); const stringify = vi.spyOn(JSON, 'stringify');
    try { const result = formatJson(JSON_SOURCE); expect(result).toBe(JSON_EXPECTED); expect(parse).not.toHaveBeenCalled(); expect(stringify).not.toHaveBeenCalled(); }
    finally { parse.mockRestore(); stringify.mockRestore(); }
  });
  it('preserves tokens and validity across deterministic JSON shape/value cases', () => {
    for (let i = 0; i < 80; i++) {
      const source = `{ "x":${i},"x":-${i},"a":[true,false,null,{"\\u0061":" value ${i} "}],"9":1e400,"2":-0 }`;
      const formatted = formatJson(source);
      expect(jsonTokens(formatted)).toEqual(jsonTokens(source)); expect(() => JSON.parse(formatted)).not.toThrow();
      expect(formatJson(formatted)).toBe(formatted);
    }
  });
  it('returns over-depth/input/output text unchanged instead of partially formatting', () => {
    const depth = '['.repeat(MAX_JSON_FORMAT_DEPTH + 1) + '0' + ']'.repeat(MAX_JSON_FORMAT_DEPTH + 1);
    const input = ' '.repeat(MAX_JSON_FORMAT_INPUT) + '0';
    const output = '['.repeat(MAX_JSON_FORMAT_DEPTH) + Array.from({ length: 9000 }, () => '0').join(',') + ']'.repeat(MAX_JSON_FORMAT_DEPTH);
    expect(output.length).toBeLessThan(MAX_JSON_FORMAT_INPUT); expect(MAX_JSON_FORMAT_OUTPUT).toBe(2_097_152);
    for (const source of [depth, input, output]) expect(formatSource(source, 'json')).toEqual({ code: source, status: 'unsupported' });
    const supportedDepth = '['.repeat(MAX_JSON_FORMAT_DEPTH) + '0' + ']'.repeat(MAX_JSON_FORMAT_DEPTH);
    expect(formatSource(supportedDepth, 'json').status).toBe('formatted');
    expect(jsonTokens(formatJson(supportedDepth))).toEqual(jsonTokens(supportedDepth));
  });
});
