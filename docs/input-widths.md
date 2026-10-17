# Input widths

`q-input`, `q-dropdown`, and `q-textarea` share an optional `width` property:
`xs`, `sm`, `md`, `lg`, `xl`, `xxl`, or `full`. Width is independent of `size`, which
controls height and internal density. Omitted, empty and invalid widths preserve
the existing full-width layout.

Copy this block into a project's shared theme stylesheet and change the values
to establish one project-wide scale. These are WebQuark's defaults:

```css
:root {
  --q-input-width-xs: 5rem;
  --q-input-width-sm: 7.5rem;
  --q-input-width-md: 11.25rem;
  --q-input-width-lg: 15rem;
  --q-input-width-xl: 18.125rem;
  --q-input-width-xxl: 22.5rem;
}
```

At a 16px root font size, these are 80, 120, 180, 240, 290 and 360px. Rem values
follow root font scaling; projects requiring fixed dimensions can use px values.
The scale is shared across light/dark themes and compact/comfortable density.
Scope the same variables to a container for a local override. `full` always uses
100% rather than a theme token.

```html
<q-input width="sm" size="lg" label="Quantity"></q-input>
<q-dropdown width="lg" placeholder="Choose a task"></q-dropdown>
<q-textarea width="full" label="Notes"></q-textarea>
```

Named widths cannot exceed the containing block and use border-box sizing.
Flex/grid parents still control allocation: set `minmax(0, 1fr)` for grid tracks
that must shrink. Long content can wrap or truncate within the available space.
Normal consumer host CSS, such as `q-input { width: 18rem; }`, takes precedence
over the width property; removing that CSS restores the selected width.

The public `QInputWidth` type is exported from `@webquark/browser` and through
`@webquark/core/browser`. Angular and React wrappers expose the same property.
