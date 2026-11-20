# Syntax Box views

Give Sandbox and each Variants and Edge Cases card one output panel. Open **Example HTML** first and show its Copy action. **Events** shows the same example's live log and Clear action. The shared Syntax Box owns the tabs so other WebQuark consumers can use the same behavior.

## 1. Extend Syntax Box

Support direct `q-syntax-view` children. A box's existing `code`, `value`, editable mode, or ordinary slotted content can still supply its first view. Keep the existing standalone API.

| Content | Result |
| --- | --- |
| Bare box or ordinary single-view usage | Existing shell with its content and no tabs |
| One explicit child | One view with its controls and no tabs |
| Two explicit children inside a container with a heading | Exactly two tabs in declaration order |
| Parent with its own content and one child | Two tabs with the parent first |
| Parent with its own content and two children | Three tabs with the parent first |

Count only direct view children. Whitespace between children, named header actions, a container heading, and the internals of nested boxes do not add a view. An explicitly supplied empty source or empty child is a declared view. Clearing text, resetting a form, and loading a snippet asynchronously must preserve the declared structure.

## 2. Preserve identity, focus, and actions

1. Track each view independently of its label, position, and form field name. Provide a readable fallback for an unnamed tab. Duplicate headings and multiple boxes on one page must work independently.
2. Keep every view mounted. Updating content, renaming, reordering, and inserting views must preserve selection. When the active view is removed, select its next surviving neighbor, falling back to the previous one. Remove the tab bar when one remains.
3. Use WebQuark Tabs for pointer and keyboard selection. Associate each tab with its own named panel. Only the active panel and its actions participate in keyboard navigation. Restore visible focus if the selected or focused element disappears. Ordinary data updates must leave focus alone.
4. Keep code, formatting, clipboard feedback, custom actions and scroll position local to their view. A background log can follow new entries without scrolling the code panel. Completing an earlier copy or snippet request must not apply its result to another view or card.
5. Preserve single-view plain mode. In multi-view mode, keep the selector accessible and ensure long headings and the current action remain reachable at narrow widths.

## 3. Preserve the editor and form contracts

- Keep edits, caret position and each editor's initial reset value. Tab selection must never appear as a code edit. Preserve real input and commit events, including when clicking a tab blurs an edited textarea.
- Each named, enabled editable view owns one form field. Keep enabled editors included while hidden. Honor reset, required, disabled and fieldset behavior for both native forms and WebQuark Form. A container with no editor contributes no field.
- Reveal an invalid hidden editor for interactive validation and focus it. A passive validity check can inspect every field without changing the current tab.
- Keep the host's `code` and `value` attached to its own content. Child editor changes and tab names must never overwrite these properties.

## 4. Migrate the playground

1. Create one shared output renderer with a Syntax Box containing two explicit children. Declare Example HTML first, even while its snippet is loading. Keep the built-in Copy action with that view. Put the existing small WebQuark Clear button and the log's accessible name with Events.
2. Mount the shared renderer once in Sandbox and once per card in the common Variants and Edge Cases card renderer. Editing a property updates its preview and snippet. Switching output tabs keeps the preview mounted and leaves the outer playground tab selected.
3. Continue recording during HTML viewing. Preserve each example's 100-entry limit, empty state and independent Clear behavior. Discard stale snippet completions after navigation or disposal.
4. Remove the old two-box layout. Reuse the library's padding, text spacing and action styles. Expose the new view in the playground catalog and document composing both styles of Syntax Box.

## 5. Focused acceptance checks

| Check | Expected result |
| --- | --- |
| Standalone box, single child, two children, mixed parent and children | Counts match the table, including empty values, nested boxes, duplicated headings and form resets |
| Edit, switch, rename, reorder, remove | The remaining editor keeps its text and selection. Focus stays visible, tab associations remain unique, and selection follows the removal rule |
| Native form and WebQuark Form with two editors | Both enabled values submit once, reset restores each initial value, and interactive validation reveals the invalid view |
| Switch during Copy or an incoming event | Feedback, copied text, log contents and scrolling belong to the originating view. An output tab click emits no editor change |
| Sandbox, Variants and Edge Cases on desktop and at narrow width | One output shell per example. HTML opens first. Copy and Clear are available in their respective views. Other cards, live properties and outer navigation retain their state |
