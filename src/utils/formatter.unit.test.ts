import { expect, describe, it } from 'vitest';
import { formatCode } from './formatter';

describe('formatCode utility', () => {
  it('formats JSON strings correctly', () => {
    const raw = '{"a":1,"b":[2,3]}';
    const expected = `{
  "a": 1,
  "b": [
    2,
    3
  ]
}`;
    expect(formatCode(raw, 'json')).toBe(expected);
  });

  it('formats CSS selectors and rules', () => {
    const raw = '.class{display:flex;color:red;}';
    const expected = `.class {
  display: flex;
  color: red;
}`;
    expect(formatCode(raw, 'css')).toBe(expected);
  });

  it('formats HTML nested tag tags and self-closing tags', () => {
    const raw = '<div><span>test</span><input type="text"/></div>';
    const expected = `<div>
  <span>
    test
  </span>
  <input type="text"/>
</div>`;
    expect(formatCode(raw, 'html')).toBe(expected);
  });

  it('formats HTML elements with multiple attributes beneath one another', () => {
    const raw = '<div class="demo" id="main" style="color: red;"><span>test</span></div>';
    const expected = `<div
  class="demo"
  id="main"
  style="color: red;"
>
  <span>
    test
  </span>
</div>`;
    expect(formatCode(raw, 'html')).toBe(expected);
  });

  it('formats simple JavaScript blocks', () => {
    const raw = 'function test(){console.log("hello");}';
    const expected = `function test() {
  console.log("hello");
}`;
    expect(formatCode(raw, 'javascript')).toBe(expected);
  });
});
