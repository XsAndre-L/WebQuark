# WebQuark browser components

Install `@webquark/browser` for WebQuark web components, utilities and styling without developer tooling or framework integrations.

```ts
import { defineCustomElements } from '@webquark/browser/loader';
import '@webquark/browser/webquark.css';
defineCustomElements();
```

Import utilities and types from `@webquark/browser`, custom elements from `@webquark/browser/components`, and native-content styling from `@webquark/browser/native-content.css`. Angular and React integrations are separate packages. All WebQuark packages release in lockstep.

Canonical source lives in `src/browser` in the repository; this package owns generated `dist` artifacts only.
