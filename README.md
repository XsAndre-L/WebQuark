# WebQuark

WebQuark is a Stencil library of web components for browsers and embedded Chromium views. Use the same custom elements for forms, navigation, maps, and data tables in plain HTML, or use the Angular and React integrations.

## Quick start

### 1. Install library

Install the browser package in an application that bundles JavaScript and CSS imports. The `dev` tag selects the prerelease documented on this branch.

```sh
npm install @webquark/browser@dev
```

### 2. Register the components

In your application's browser entry point, load the shared stylesheet and register the custom elements once.

```js
import '@webquark/browser/webquark.css';
import { defineCustomElements } from '@webquark/browser/loader';

defineCustomElements();
```

### 3. Add a card

Put this markup in your page. The named `header` slot places the heading above the body. The comfortable preset gives the card roomier spacing.

```html
<main data-wq-preset="comfortable">
  <q-card>
    <h2 slot="header">Opening hours</h2>
    <p>Monday to Friday, 09:00–17:00.</p>
  </q-card>
</main>
```

## Packages

Use matching WebQuark versions when installing multiple packages.

| Package | Use it for |
| --- | --- |
| [@webquark/browser](packages/browser/components/README.md) | Custom elements, styles, and browser utilities |
| [@webquark/angular](packages/browser/angular/README.md) | Angular components and form value accessors |
| [@webquark/react](packages/browser/react/README.md) | React wrappers for the browser components |
| [@webquark/tooling](packages/tooling/README.md) | Changelog tools and local package switching |
| [@webquark/core](packages/core/README.md) | Browser components and tooling together, including the `wq-sandbox` command |

## Guides

- Browse the [component guides](docs/components/README.md) for examples, properties, slots, and events.
- Adjust spacing and typography with [design presets](docs/design-presets.md), or customize colors and surfaces with [theme variables](docs/theme_variables.md).
- For Unreal Engine webviews, see the [CEF off-screen rendering guidelines](docs/unreal_compatibility.md).
- To test local WebQuark changes in a consuming app, follow the [package switching guide](src/tooling/wq-switch/README.md).
- To update the Prettier release shipped with Syntax Box, see the [formatter maintenance guide](src/tooling/formatter/README.md).

## Run the playground

From a checkout of this repository, install dependencies and start the playground with Bun.

```sh
bun install
bun start
```

Open the [local playground](http://localhost:3333) to try the components and inspect their events.

## License

[MIT](LICENSE)
