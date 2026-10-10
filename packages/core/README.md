# WebQuark umbrella

Install `@webquark/core` for the compatible browser and tooling packages. Angular and React integrations are optional installs (`@webquark/angular`, `@webquark/react`). All five packages use the same version and release channel.

Use explicit entries, including from an isolated dependency installation:

```ts
import { registerQIcons } from '@webquark/core/browser';
import { defineCustomElements } from '@webquark/core/browser/loader';
import '@webquark/core/browser/webquark.css';
```

Components are available through `@webquark/core/browser/components` and `@webquark/core/browser/components/q-button.js`. Native content styling is `@webquark/core/browser/native-content.css`. Tooling has the separate `@webquark/core/tooling/changelog` entry and the umbrella-owned `wq-changelog` binary. It provides configured release-note feeds, version checks and release preparation, plus capture staging and reviewed publication through project-owned adapters. The consumer supplies its paths, visual metadata and capture environment. Live capture acceptance requires the consumer's working demo prerequisites.

Browser-only consumers may install `@webquark/browser`; tooling-only consumers may install `@webquark/tooling`. Declare those direct dependencies before importing their package names. The umbrella has no root runtime barrel, and the former core browser import paths must be migrated.

`wq-switch`, `wq-setup`, and `wq-sandbox` remain umbrella binaries. The sandbox contains the same playground build produced by the repository.
