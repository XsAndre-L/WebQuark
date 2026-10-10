export const SYNTAX_LANGUAGES = ['html', 'javascript', 'css', 'json'] as const;
export const LANGUAGE_SOURCE = {
  html: '\t<div  title = "&lt; raw <b> &amp;"\tdata-x=\'雪\'>\r\n<!-- <i> &gt; -->  🐦</div>\r',
  javascript: ' // &lt; <b>\r\nconst  value = "<span>&amp; 雪";\r\n/* keep  comment */\tcall(`a ${1} 🐦`);\r',
  css: '/* &lt; <b> */\r\n.demo, .雪 {\r\n\tcolor  :   red ; content : "<span>&amp; 🐦";\r\n}\r',
  json: '{\r\n\t"&lt;<b>"  :  "雪 \\"quote\\" 🐦", "same": -0, "same": 9007199254740993, "a": [2,1]  \r\n}\r',
};
export const LITERAL_SOURCES = [
  ['mixed raw markup and entities', '<b title="raw">&lt;&gt;&amp;&#39;&#x3C; & text</b>'],
  ['generated-looking markup', '<span class="code-value">&lt; &amp;</span><!-- <q-button> -->'],
  ['whitespace and Unicode', ' \t\r\n\r\n雪 🐦 é\u00a0\ufeff  \r'],
  ['unfinished and entity-looking input', '<div title="unterminated &lt; &#0; &#13; &bogus; << "'],
] as const;
export const normalizeDomNewlines = (text: string): string => text.replace(/\r\n?/g, '\n');
