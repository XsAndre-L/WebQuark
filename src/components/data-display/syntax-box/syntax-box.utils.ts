export type SyntaxBoxEditorKeyAction =
  | { type: 'none' }
  | { type: 'blur' }
  | { type: 'indent'; value: string; caret: number };

type EditorKeyEvent = Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'>;

export function getSyntaxBoxEditorKeyAction(event: EditorKeyEvent, value: string, start: number, end: number): SyntaxBoxEditorKeyAction {
  if (event.key === 'Escape') {
    return { type: 'blur' };
  }

  if (event.key !== 'Tab' || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
    return { type: 'none' };
  }

  const spaces = '  ';
  return {
    type: 'indent',
    value: value.substring(0, start) + spaces + value.substring(end),
    caret: start + spaces.length,
  };
}
