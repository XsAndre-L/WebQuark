# Spec: ADHD-Accessibility & Separation of Concerns

## Objective
Establish a standard and refactor WebQuark components and styling tokens to minimize cognitive load, decision fatigue, and visual overload. Specifically:
1. Enforce a **strict Three-File Component Architecture** that separates HTML markup, TypeScript logic, and CSS styling.
2. Flatten the CSS theme custom properties cascade to reduce mental tracing.

---

## Tech Stack
* **Core**: StencilJS (v4.x)
* **Logic**: TypeScript (v5.x)
* **Styling**: Vanilla CSS (CSS Custom Properties)

---

## Project Structure
Each component directory will contain exactly three files to isolate each language concern:

```
src/browser/components/q-[name]/
 ├── q-[name].tsx      ◄── HTML / JSX Layout only (No inline logic, no inline SVGs)
 ├── q-[name].logic.ts ◄── TypeScript Logic only (Pure functions, no HTML)
 └── q-[name].css      ◄── CSS Styling only (Theme mappings and selectors)
```

---

## Code Style Style-Guide (ADHD-Friendly)

### 1. The TSX File: HTML Layout Only
The `.tsx` file will only serve as a template. It maps states to HTML elements and binds event listeners directly to the logic controller.

```tsx
// src/browser/components/q-example/q-example.tsx
import { Component, Prop, State, h } from '@stencil/core';
import { ExampleController } from './q-example.logic';

@Component({
  tag: 'q-example',
  styleUrl: 'q-example.css',
  shadow: true,
})
export class QExample {
  @Prop() label: string;
  @State() value: number = 0;

  // Instantiate the logic controller class
  private controller = new ExampleController(this);

  render() {
    return (
      <div class="example-wrapper">
        <label class="example-label">{this.label}</label>
        
        {/* HTML binds directly to controller events */}
        <input 
          type="number" 
          value={this.value} 
          onInput={this.controller.handleInput} 
        />
        
        <button onClick={this.controller.handleIncrement}>+</button>
      </div>
    );
  }
}
```

### 2. The Logic File: Pure TypeScript Only
The `.logic.ts` file holds the state mutations, event handlings, validation logic, and calculations. It has zero HTML/JSX tags.

```typescript
// src/browser/components/q-example/q-example.logic.ts
import { QExample } from './q-example';

export class ExampleController {
  // Store a reference to the main component to update state
  constructor(private component: QExample) {}

  /**
   * Event handler for input changes.
   */
  public handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.component.value = parseFloat(target.value) || 0;
  };

  /**
   * Business logic to increment values.
   */
  public handleIncrement = () => {
    this.component.value += 1;
  };
}
```

### 3. The CSS File: Pure Styling Only
Maps properties and classes to design tokens.

```css
/* src/browser/components/q-example/q-example.css */
:host {
  display: block;
}

.example-wrapper {
  background: var(--q-bg-surface-1);
  border-radius: var(--q-radius-md);
  padding: var(--q-padding-md);
}
```

---

## CSS Design Tokens Flattening (Phase 3 Spec)
We will remove the nested "middle-man" variables to make variables instantly traceable:

```css
/* BEFORE (High memory load to trace) */
:root {
  --q-radius-md: 8px;
  --q-field-radius: var(--q-radius-md);
}
/* q-input.css */
.input-control {
  border-radius: var(--q-input-radius, var(--q-field-radius));
}

/* AFTER (ADHD Scannable - direct mapping) */
:root {
  --q-radius-md: 8px;
}
/* global.css Component override definition */
:root {
  --q-input-radius: var(--q-radius-md);
}
/* q-input.css */
.input-control {
  border-radius: var(--q-input-radius);
}
```

---

## Boundaries
* **Always do**: Keep TSX files under 100 lines where possible. Move all handlers to `.logic.ts` files.
* **Ask first**: If a component needs dynamic runtime layouts that require complex inline JSX structures.
* **Never do**: Mix SVG XML data, inline style blocks, or complex calculation handlers inside the `.tsx` file.

---

## Success Criteria
1. `c:/Dev/DR/WebQuark/src/browser/components/q-input` refactored into three files: `q-input.tsx` (markup), `q-input.logic.ts` (logic), and `q-input.css` (styles).
2. `c:/Dev/DR/WebQuark/src/browser/components/q-dialog` refactored into three files: `q-dialog.tsx` (markup), `q-dialog.logic.ts` (logic), and `q-dialog.css` (styles).
3. The CSS cascade inside `global.css` is flattened to directly bind component overrides to global design tokens.
4. Next.js and Stencil compile successfully.
