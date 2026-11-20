import type { SyntaxFormatResult } from './formatter.types';

export const MAX_JSON_FORMAT_INPUT = 1_048_576;
export const MAX_JSON_FORMAT_OUTPUT = 2_097_152;
export const MAX_JSON_FORMAT_DEPTH = 128;

class FormatLimitError extends Error {}

/** Validates JSON grammar while emitting original tokens, never JavaScript values. */
function layoutJson(source: string): string {
  if (source.length > MAX_JSON_FORMAT_INPUT) {
    throw new FormatLimitError();
  }

  let index = 0;
  let outputLength = 0;
  const parts: string[] = [];

  const emit = (text: string) => {
    outputLength += text.length;
    if (outputLength > MAX_JSON_FORMAT_OUTPUT) {
      throw new FormatLimitError();
    }
    parts.push(text);
  };

  const whitespace = () => {
    while (/[\x20\t\r\n]/.test(source.charAt(index)) && index < source.length) {
      index++;
    }
  };

  const requireCharacter = (character: string) => {
    if (source[index++] !== character) {
      throw new SyntaxError('Invalid JSON.');
    }
    whitespace();
  };

  const stringToken = (): string => {
    const start = index;
    if (source[index++] !== '"') {
      throw new SyntaxError('Invalid JSON string.');
    }

    while (index < source.length) {
      const character = source[index++];
      if (character === '"') {
        return source.slice(start, index);
      }
      if (character.charCodeAt(0) < 0x20) {
        throw new SyntaxError('Invalid JSON string.');
      }

      if (character === '\\') {
        const escaped = source[index++];
        if (escaped === 'u') {
          if (!/^[\da-fA-F]{4}$/.test(source.slice(index, index + 4))) {
            throw new SyntaxError('Invalid JSON escape.');
          }
          index += 4;
        } else if (!escaped || !'"\\/bfnrt'.includes(escaped)) {
          throw new SyntaxError('Invalid JSON escape.');
        }
      }
    }

    throw new SyntaxError('Unterminated JSON string.');
  };

  const newline = (depth: number) => emit('\n' + '  '.repeat(depth));

  const value = (depth: number): void => {
    whitespace();
    const character = source[index];

    if (character === '{' || character === '[') {
      if (depth >= MAX_JSON_FORMAT_DEPTH) {
        throw new FormatLimitError();
      }

      const object = character === '{';
      const close = object ? '}' : ']';
      index++;
      emit(character);
      whitespace();

      if (source[index] === close) {
        index++;
        emit(close);
        return;
      }

      newline(depth + 1);
      while (true) {
        if (object) {
          emit(stringToken());
          whitespace();
          requireCharacter(':');
          emit(': ');
        }

        value(depth + 1);
        whitespace();

        if (source[index] === close) {
          index++;
          newline(depth);
          emit(close);
          return;
        }

        requireCharacter(',');
        emit(',');
        newline(depth + 1);
      }
    }

    if (character === '"') {
      emit(stringToken());
      return;
    }

    for (const literal of ['true', 'false', 'null']) {
      if (source.startsWith(literal, index)) {
        index += literal.length;
        emit(literal);
        return;
      }
    }

    const start = index;
    while (index < source.length && /[\d.eE+-]/.test(source[index])) {
      index++;
    }

    const token = source.slice(start, index);
    if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token)) {
      throw new SyntaxError('Invalid JSON value.');
    }
    emit(token);
  };

  value(0);
  whitespace();
  if (index !== source.length) {
    throw new SyntaxError('Trailing JSON content.');
  }
  return parts.join('');
}

export function formatJsonSource(code: string): SyntaxFormatResult {
  try {
    const formatted = layoutJson(code);
    return { code: formatted, status: formatted === code ? 'unchanged' : 'formatted' };
  } catch (error) {
    return { code, status: error instanceof FormatLimitError ? 'unsupported' : 'invalid' };
  }
}

export function formatJson(code: string): string {
  return formatJsonSource(code).code;
}
