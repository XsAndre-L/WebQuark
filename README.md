# ⚡ WebQuark Component Library

## 🎯 Purpose
A premium, glassmorphic Web Component library compiled with **StencilJS**. Designed for high performance, standard compliance, and compatibility with **Unreal Engine Webviews** (Chromium Embedded Framework in Off-Screen Rendering mode).

---

## 🚀 Quick Start (Using Components)

### 1. Install Library
```bash
npm install @webquark/core
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
<q-card interactive elevation="medium">
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
 │    │    └── q-[name]/
 │    │         ├── q-[name].tsx ◄── Component logic & render template (TSX)
 │    │         ├── q-[name].css ◄── Local stylesheet
 │    │         └── readme.md    ◄── Auto-generated API details (props, slots, events)
 │    └── global/
 │         └── global.css   ◄── Global design tokens & visual system variables
 └── readme.md              ◄── This file
```

---

## 🛠️ Development Commands

Before running commands, install package dependencies:
```bash
npm install
```

| Command | Action | Description |
| :--- | :--- | :--- |
| **`npm start`** | **Run Playground** | Starts a local hot-reloading component sandbox at `http://localhost:3333`. |
| **`npm run build`** | **Build Library** | Runs Stencil compiler to output production bundles inside `dist/`. |
| **`npm test`** | **Run Test Suites** | Runs unit test suites using Vitest. |
| **`npm run test.watch`**| **Watch Tests** | Runs tests in interactive watcher mode. |

---

## ⚠️ Key Design Principles

* **Self-Contained Rendering**: All components encapsulate their layout inside Shadow DOM.
* **Tactile Micro-interactions**: Buttons and selectors utilize tactile CSS transformations (e.g. `scale(0.97)` on active press) for premium layout feedback.
* **CEF Safety First**: Ensure any new styling variables comply with [Unreal Compatibility Guidelines](docs/unreal_compatibility.md) (e.g., no backdrop-filters, no dropdown overlay windows).