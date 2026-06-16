# 🧩 Component Specification: `q-syntax-box`

The `<q-syntax-box>` is a custom syntax highlighting code viewer block component. It supports HTML, CSS, JavaScript, and JSON highlighting out of the box. It features panel (header + scroll viewport) and plain formats, a clipboard copy mechanism, custom scroll heights, and slotted header action spaces.

---

## 1. Component API (Properties & Attributes)

| Property | Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `variant` | `variant` | `"panel" \| "plain"` | `'panel'` | Layout wrapper style. Panel shows header title and action buttons. |
| `language` | `language` | `"css" \| "html" \| "javascript" \| "json"` | `'html'` | Syntax parser mode for highlighting code tokens. |
| `code` | `code` | `string` | `undefined` | The raw code string to highlight. If omitted, highlights default slotted text. |
| `heading` | `heading` | `string` | `undefined` | Header title displayed in the panel variant header box. |
| `copyable` | `copyable` | `boolean` | `false` | Renders a copy-to-clipboard action button in the panel header. |
| `height` | `height` | `string` | `undefined` | Height constraint of the code block. Voids panel height to trigger scrolls. |

---

## 2. Slots

*   **Default Slot**: Slots the raw code to display and highlight when the `code` property is not defined.
*   `actions`: Slots additional interactive elements (e.g. action buttons) in the panel header on the right side.

---

## 3. Events

None

---

## 4. Visual Variants

*   **Panel Layout (`variant="panel"`)**: Renders a wrapper containing a header band (displaying the heading title and action/copy controls) above the scrolling code window. Features rounded corners and distinct borders.
*   **Plain Layout (`variant="plain"`)**: Renders only the highlighted preformatted code container, omitting headers or container wrappers.
*   **Token Highlight Themes**: Employs distinct highlight colors for comments (`--q-syntax-comment`), keywords/tags (`--q-syntax-tag`), attributes (`--q-syntax-attr`), strings/values (`--q-syntax-value`), and numeric literals (`--q-syntax-number`).

---

## 5. Typography & Font Styles

*   **Global Font Stack**: Monospace stack (mapped to `ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace`).
*   **Code block text**:
    *   Font size: `0.85rem` (Varies: `0.75rem` in `.variant-card-code`).
    *   Font weight: `400` (Normal) or `600` (Bold for keywords/tags).
    *   Line-height: `1.5`.
    *   Color: `var(--q-syntax-text, #c9d1d9)`.

---

## 6. CSS Variable Mapping

| Variable Name | Default Value | Purpose |
| :--- | :--- | :--- |
| `--q-syntax-bg` | `#0d1117` | Main code viewport background color. |
| `--q-syntax-border` | `#21262d` | Container and divider border color. |
| `--q-syntax-header-bg` | `#161b22` | Header band background color. |
| `--q-syntax-text` | `#c9d1d9` | Standby color of plain unformatted text. |
| `--q-syntax-comment` | `#8b949e` | Highlight color for code comments (italicized). |
| `--q-syntax-tag` | `#ff7b72` | Highlight color for keywords and HTML/CSS tags. |
| `--q-syntax-attr` | `#79c0ff` | Highlight color for attributes and JS function calls. |
| `--q-syntax-value` | `#a5d6ff` | Highlight color for string values and CSS values. |
| `--q-syntax-number` | `#f0883e` | Highlight color for numeric literals. |
| `--q-radius-lg` | `12px` | Border radius of panel container. |
| `--q-radius-md` | `8px` | Border radius in custom classes. |

---

## 7. HTML/TSX Structure (Shadow DOM Layout)

```tsx
@Component({
  tag: 'q-syntax-box',
  styleUrl: 'q-syntax-box.css',
  shadow: true,
})
export class QSyntaxBox {
  @Element() el!: HTMLElement;

  @Prop() variant: 'panel' | 'plain' = 'panel';
  @Prop() language: 'html' | 'javascript' | 'css' | 'json' = 'html';
  @Prop() code?: string;
  @Prop() heading?: string;
  @Prop() copyable: boolean = false;
  @Prop() height?: string;

  @State() copied: boolean = false;

  private scrollableEl?: any;

  @Method()
  async scrollToBottom() {
    if (this.scrollableEl && typeof this.scrollableEl.scrollToBottom === 'function') {
      await this.scrollableEl.scrollToBottom();
    }
  }

  render() {
    const resolvedHeight = this.height !== undefined ? this.height : (this.variant === 'panel' ? '110px' : 'auto');
    const isScrollable = resolvedHeight !== 'auto' && resolvedHeight !== '';

    const content = this.code !== undefined ? (
      <pre class="code-body">
        <code innerHTML={this.highlight(this.code, this.language)}></code>
      </pre>
    ) : (
      <slot></slot>
    );

    const bodyContent = isScrollable ? (
      <q-scrollable height={resolvedHeight} ref={(el) => (this.scrollableEl = el)}>
        {content}
      </q-scrollable>
    ) : (
      content
    );

    if (this.variant === 'panel') {
      return (
        <Host class="q-syntax-box-panel">
          <div class="panel-container">
            <div class="panel-header">
              <span>{this.heading}</span>
              <div class="panel-actions">
                <slot name="actions"></slot>
                {this.copyable && (
                  <q-button variant="ghost" size="sm" onClick={this.copyCode}>
                    <q-icon name={this.copied ? "check" : "copy"} size="sm"></q-icon>
                    <q-tooltip content={this.copied ? "Copied!" : "Copy"}></q-tooltip>
                  </q-button>
                )}
              </div>
            </div>
            {bodyContent}
          </div>
        </Host>
      );
    }

    return (
      <Host class="q-syntax-box-plain">
        <div class="plain-container">
          {bodyContent}
        </div>
      </Host>
    );
  }
}
```

---

## 8. Unreal Engine / Webview Compatibility Notes

*   **Integrated `<q-scrollable>` Component**: To handle scroll boundaries on code files within CEF, the component incorporates a custom `<q-scrollable>` container. This prevents frame latency during quick scrolling.
*   **Security Context for Clipboard Copies**: The copy feature calls `navigator.clipboard.writeText`. For game engine environments, this API requires a secure context (HTTPS or custom schemes configured as secure in CEF initialization parameters) to work properly.
*   **Performance regex Parsers**: Token highlighting is calculated at render time using precompiled javascript regular expression matching. This is extremely lightweight, preventing lags compared to heavy libraries (like PrismJS).
*   **ASCII HTML Escaping**: Code values are escaped (`&lt;`, `&gt;`, `&amp;`) before tags are injected. This prevents DOM parsing exploits in webviews.

---

## 9. Developer Guidelines & Examples

### Example 1: HTML Code Panel with Copy Button
```html
<q-syntax-box 
  variant="panel" 
  language="html" 
  heading="index.html" 
  copyable="true" 
  code='<div class="header">
  <h1>Welcome to WebQuark!</h1>
</div>'>
</q-syntax-box>
```

### Example 2: Scrollable JavaScript Block
```html
<q-syntax-box 
  variant="panel" 
  language="javascript" 
  heading="App Config" 
  height="150px"
  code='const config = {
  apiEndpoint: "https://api.webquark.dev",
  timeout: 5000,
  debugMode: true,
  allowedMethods: ["GET", "POST", "DELETE"]
};
console.log("Configuration Loaded:", config);'>
</q-syntax-box>
```

### Example 3: Plain Highlighted JSON Output
```html
<q-syntax-box 
  variant="plain" 
  language="json" 
  code='{
  "status": "success",
  "data": {
    "id": 10842,
    "role": "admin"
  }
}'>
</q-syntax-box>
```
