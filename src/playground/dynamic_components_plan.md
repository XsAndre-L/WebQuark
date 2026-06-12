# Dynamic Components Plan (Method A)

This document outlines the proposed layout structure for refactoring the WebQuark Playground components into modular dynamic views (similar to Angular components) using browser-native APIs.

## Directory / File Tree Structure

```
src/playground/
├── index.html                     <-- [App Shell] Skeleton layout (Header, Sidebar, Workspace Containers)
├── playground.js                  <-- [Orchestrator] Micro-router; intercepts navigation & mounts view files
├── playground.css                 <-- [Global Styles] @imports local layout css files
│
├── css/                           <-- [Layout Stylesheets]
│   ├── base.css                   <-- Resets, theme-switching variables, body bounds
│   ├── layout.css                 <-- Sidebar sidebar-item, logo, header styles
│   ├── sandbox.css                <-- Non-scrollable viewport grid structure
│   ├── knobs.css                  <-- Controls panel structure, slider controls
│   └── theme-designer.css         <-- Theme configuration rows, color swatches
│
├── specs/                         <-- [Attributes Specifications] (Fetched dynamically by orchestrator)
│   ├── q-button.spec.json
│   ├── q-toggle.spec.json
│   └── ...
│
└── views/                         <-- [Modular Views] (One directory per component)
    ├── q-button-view/
    │   ├── q-button-view.html     <-- Isolated stage HTML markup (replacing JS DOM generation)
    │   ├── q-button-view.css      <-- Component-specific sandbox styles (loaded on-demand)
    │   └── q-button-view.js       <-- Component initialization & custom event handlers (hooks)
    │
    ├── q-toggle-view/
    │   ├── q-toggle-view.html
    │   ├── q-toggle-view.css
    │   └── q-toggle-view.js
    │
    └── ... (other component views)
```

## Architectural Design

1. **[index.html](file:///D:/Dev/WebApps/WebQuark/src/playground/index.html)**: Defines the outer dashboard frame. The interactive stage remains as an empty element (`<div id="stageContainer"></div>`).
2. **[playground.js](file:///D:/Dev/WebApps/WebQuark/src/playground/playground.js)**: Acts as the orchestrator. When navigating sidebar components:
   - Fetches the active view's HTML template via `fetch()` and injects it into `#stageContainer`.
   - Mounts a `<link>` stylesheet targeting the active component's `.css` file in `<head>`, removing the previous view's link tag.
   - Loads the active `.js` file via native dynamic ES Modules `await import(...)` to initialize click handlers, scroll methods, and component-specific lifecycle hooks.
