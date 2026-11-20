import { parsers } from './plugins/html.mjs';
import { formatSource as formatMarkup } from './languages/html.mjs';

const rawElements = new Set(['pre', 'textarea', 'script', 'style']);
const optionalEndTags = new Set([
  'html', 'head', 'body', 'li', 'dt', 'dd', 'p', 'rt', 'rp', 'optgroup', 'option',
  'colgroup', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
]);

async function inspectFragment(source) {
  const tree = await parsers.html.parse(source, { parser: 'html' });
  const regions = [];

  function visit(node) {
    if (node.kind === 'element') {
      const closing = node.endSourceSpan;
      if (!closing && !node.isVoid && !node.isSelfClosing && !optionalEndTags.has(node.name)) {
        throw new SyntaxError('Incomplete HTML element');
      }
      if (closing && rawElements.has(node.name)) {
        regions.push({ name: node.name, start: node.startSourceSpan.end.offset, end: closing.start.offset });
        return;
      }
    }
    node.children?.forEach(visit);
  }
  visit(tree);
  return regions;
}

export async function formatSource(source) {
  // A text-only slot can use its leading and trailing spaces as part of a label.
  if (!/<[a-z!?/]/i.test(source)) return source;
  const body = source.trim();
  const original = await inspectFragment(body);
  let formatted = (await formatMarkup(body)).trim();
  if (original.length) {
    const result = await inspectFragment(formatted);
    if (original.length !== result.length) return source;
    for (let i = original.length - 1; i >= 0; i--) {
      if (original[i].name !== result[i].name) return source;
      formatted = formatted.slice(0, result[i].start) +
        body.slice(original[i].start, original[i].end) + formatted.slice(result[i].end);
    }
  }
  const offset = source.indexOf(body);
  return source.slice(0, offset) + formatted + source.slice(offset + body.length);
}
