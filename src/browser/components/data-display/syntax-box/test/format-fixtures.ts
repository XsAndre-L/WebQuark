export const JSON_SOURCE = '{\r\n "10":9007199254740993,"2":-0,"same":1,"same":2,"array":[1e400,2.3000,-0,1E+03],"text":"  \\u0061 \\/ \\"quote\\" 雪 🐦  "\r\n}';
export const JSON_EXPECTED = '{\n  "10": 9007199254740993,\n  "2": -0,\n  "same": 1,\n  "same": 2,\n  "array": [\n    1e400,\n    2.3000,\n    -0,\n    1E+03\n  ],\n  "text": "  \\u0061 \\/ \\"quote\\" 雪 🐦  "\n}';
export const INVALID_JSON = [
  ['commented JSON', '{/* preserve comment */"a":1}'],
  ['line comment', '{"a":1 // keep\r\n}'],
  ['trailing comma', '{"a":1,}'], ['unfinished', '{"a":'], ['missing comma', '[1 2]'],
  ['missing colon', '{"a" 1}'], ['unquoted member', '{a:1}'], ['extra document', '{} []'],
  ['leading zero', '[01]'], ['nonfinite', '[NaN,Infinity]'], ['invalid escape', '"\\x20"'],
  ['short Unicode escape', '"\\u123"'], ['raw string newline', '"keep\r\nline"'],
  ['BOM', '\ufeff{"a":1}'], ['whitespace only', ' \t\r\n '],
] as const;
export const NON_JSON_SOURCE = [
  ['html', '<p   class="message">Hello <b>world</b> !</p>\r\n<pre> keep  \t spaces\r\n</pre><!-- keep comment -->'],
  ['javascript', '// keep\r\nfunction f(){return\n"x";} const t = ` a  ${1}\r\n b;{} `; /[{};]/.test(t);'],
  ['css', '/* keep */\r\n.a { content: "  x; { y }  "; --text: a  b; }\r\n'],
] as const;

/** Independent token equality checks retain punctuation and raw numeric/string spellings. */
export function jsonTokens(source: string): string[] {
  return source.match(/"(?:\\[\s\S]|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:]/g) ?? [];
}
