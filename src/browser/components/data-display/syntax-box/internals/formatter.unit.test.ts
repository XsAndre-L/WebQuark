import { describe, expect, it, vi } from 'vitest';
import { formatCode, formatCss, formatHtml, formatJs, formatJson, formatSource, isFormatSupported,
  MAX_JSON_FORMAT_DEPTH, MAX_JSON_FORMAT_INPUT, MAX_JSON_FORMAT_OUTPUT } from './formatter';
import { INVALID_JSON, JSON_EXPECTED, JSON_SOURCE, jsonTokens, UNSUPPORTED_SOURCE } from '../test/format-fixtures';

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
  it.each(UNSUPPORTED_SOURCE)('keeps whitespace-sensitive %s source intact', (language, source) => {
    expect(isFormatSupported(language)).toBe(false); expect(formatSource(source, language)).toEqual({ code: source, status: 'unsupported' });
    expect(formatCode(source, language)).toBe(source);
  });
  it('retains named helper signatures and the js alias as conservative unchanged-source routes', () => {
    expect(formatHtml(UNSUPPORTED_SOURCE[0][1])).toBe(UNSUPPORTED_SOURCE[0][1]);
    expect(formatJs(UNSUPPORTED_SOURCE[1][1])).toBe(UNSUPPORTED_SOURCE[1][1]);
    expect(formatCss(UNSUPPORTED_SOURCE[2][1])).toBe(UNSUPPORTED_SOURCE[2][1]);
    expect(formatCode(UNSUPPORTED_SOURCE[1][1], 'js')).toBe(UNSUPPORTED_SOURCE[1][1]);
    expect(formatCode('literal', 'unknown')).toBe('literal'); expect(formatCode('', 'json')).toBe('');
    expect(isFormatSupported('JSON')).toBe(true);
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
