# WebQuark changelog

## 1.1.1

### Playground

- The [public component playground](https://xsandre-l.github.io/WebQuark/) deploys from `main`. Its loader, catalog, local icons, sample media, and bundled formatters work under the GitHub Pages project path.
- Sandbox, Variants, and Edge Cases show **Example HTML** and **Events** in one tabbed panel. Events keep recording while you read the code. The Sandbox formats generated HTML when its source changes and copies the displayed result.
- The Properties panel groups controls by category. Slot editors show their names, description tooltips, Format, and Reset in the editor header. The Sandbox output grows from 110 px on smaller screens to 250 px on a 1920 × 1080 viewport.

### Browser components

- `q-syntax-box` supports multiple mounted `q-syntax-view` children, per-view actions, and a custom `heading` slot for single-view panels. Tab changes preserve edits and event history.
- Syntax editors load bundled formatters for HTML, CSS, JavaScript, TypeScript, and the other supported languages on demand. Strict JSON formatting preserves the original tokens. [Supported languages](./docs/components/q-syntax-box.md#languages)
- Wrapped and stacked button labels retain vertical padding. Built-in icons scale inside circular icon-only buttons with inherited sizing. Long alerts and toasts wrap around the close action.
