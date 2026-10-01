# ⚡ WebQuark Component Library

## 🎯 Purpose
A premium, glassmorphic Web Component library compiled with **StencilJS**. Designed for high performance, standard compliance, and compatibility with **Unreal Engine Webviews** (Chromium Embedded Framework in Off-Screen Rendering mode).

---

## 🚀 Quick Start (Using Components)

**Design presets:** use `data-wq-preset="comfortable"` for website typography, spacing and controls. Omit it for existing compact defaults. See [the preset guide](docs/design-presets.md) and [complete values](docs/design-presets-tokens.md).

### 1. Install Library
```bash
bun add @webquark/core
```

### 2. Import Styles & Bootloader
Add this to your application's entry file:
```javascript
// Import core CSS variables & design tokens
import '@webquark/core/dist/webquark/webquark.css';

// Register custom web components
import { defineCustomElements } from '@webquark/core/loader';
defineCustomElements();
```

### 3. Use in HTML
```html
<q-card elevation="medium">
  <div slot="header">Hello WebQuark</div>
  <q-button variant="primary">Click Me</q-button>
</q-card>
```

---

## 🗺️ Project Workspace Map

```
webquark/ (Root)
 ├── dist/                  ◄── Production compilations (ESM, custom elements, CSS)
 ├── docs/                  ◄── Design guides & API specs
 │    ├── components/       ◄── Component-specific specifications (e.g. q-card.md)
 │    ├── components.md     ◄── Roadmap implementation status dashboard
 │    ├── theme_variables.md◄── CSS custom properties reference
 │    └── unreal_compatibility.md ◄─ CEF Off-Screen Rendering layout guidelines
 ├── src/                   ◄── Source files
 │    ├── components/       ◄── Custom Web Components
 │    │    └── [category]/[name]/
 │    │         ├── [name].tsx ◄── Component logic & render template (TSX)
 │    │         ├── [name].css ◄── Local stylesheet
 │    │         └── readme.md    ◄── Auto-generated API details (props, slots, events)
 │    └── theme/            ◄── Token catalog, generated defaults, and shared styles
 └── readme.md              ◄── This file
```

---

## 📚 Documentation

* [Component index and documentation standard](docs/components/README.md)
* [Current public contracts](docs/components/current-contracts.md)
* [Component implementation status](docs/components.md)
* [Theme setup](docs/theme_variables.md), [generated tokens](docs/theme-tokens.md), and [component composition](docs/foundation.md)
* [Unreal Engine / CEF compatibility](docs/unreal_compatibility.md)
* [Full UX, DX, accessibility, and optimization audit (2026-07-11)](docs/component-audit-2026-07-11.md)

Generated API references live beside each component implementation under `src/components/**/readme.md` and are refreshed by `bun run build`.

---

## Local package switching

Run `bun run wq-setup` in a consuming project to generate `.webquark/.webquark.json` and
the `wq-sandbox`/`wq-switch`/`wq-check` package scripts. Fill in `source` inside the `"wq-switch"` section:

```json
{
  "wq-switch": {
    "version": 1,
    "source": "D:\\Dev\\PurelyIT\\WebQuark",
    "preferredVersion": "1.1.0-dev.7"
  }
}
```

`preferredVersion` records your installed release preference; setup preserves an
existing value. It does not select or download a release.

Then run `bun run wq-switch local`. The switcher builds core, React, and Angular and
activates only the packages that project uses. Run `bun run wq-switch npm` to
restore the original installed packages. See [the switcher guide](scripts/wq-switch/README.md).

For CLI development, use the [rebuilt checkout commands](scripts/wq-switch/README.md#developing-the-cli)
to exercise the current tooling directly.

## 🧪 WebQuark Component Sandbox

WebQuark includes a built-in interactive sandbox playground where you can preview components, inspect their layout behaviors, and test theme design variables in real-time.

From a project with `@webquark/core` installed, launch the packaged sandbox:

```bash
bun run wq-sandbox
```

Open [http://localhost:3333](http://localhost:3333). This shows the installed package's sandbox.

To develop the sandbox in the WebQuark repository:
1. Navigate to the WebQuark root directory.
2. Start the playground server:
   ```bash
   bun start
   ```
3. Open your web browser and navigate to: [http://localhost:3333](http://localhost:3333)

Inside the sandbox:
* **Interactive Previews:** Adjust component attributes, slots, and events on the fly.
* **Theme Designer:** Tweak global CSS design tokens (colors, border-radius, font sizes) and see the visual changes reflect instantly.
* **Event Log:** Inspect custom event payloads dispatched by components as you interact with them.

---

## 🛠️ Development Commands

Before running commands, install package dependencies:
```bash
bun install
```

| Command | Action | Description |
| :--- | :--- | :--- |
| **`bun start`** | **Run Playground** | Starts a local hot-reloading component sandbox at `http://localhost:3333`. |
| **`bun run build`** | **Build Library** | Runs Stencil compiler to output production bundles inside `dist/`. |
| **`bun test`** | **Run Test Suites** | Runs unit test suites using Vitest. |
| **`bun run test:watch`**| **Watch Tests** | Runs tests in interactive watcher mode. |

---

## ⚠️ Key Design Principles

* **Self-Contained Rendering**: All components encapsulate their layout inside Shadow DOM.
* **Tactile Micro-interactions**: Buttons and selectors utilize tactile CSS transformations (e.g. `scale(0.97)` on active press) for premium layout feedback.
* **CEF Safety First**: Ensure any new styling variables comply with [Unreal Compatibility Guidelines](docs/unreal_compatibility.md) (e.g., no backdrop-filters, no dropdown overlay windows).
