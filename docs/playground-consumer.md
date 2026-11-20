# Run a copied example

[Component playground](http://localhost:3333/) (local development)

Use the same version of `@webquark/browser` as the playground. In a bundler-based project, register the components and load their stylesheet in your application entry point.

```javascript
import '@webquark/browser/webquark.css';
import { defineCustomElements } from '@webquark/browser/loader';

defineCustomElements();
```

Copy an example into the body of your HTML page. Keep any accompanying script directly after the example and serve the page over HTTP. The script connects actions and assigns values that HTML attributes cannot express.

The bundled comparison illustrations and sample video travel with copied examples. Supply your own provider credentials for Google Maps. For local icons, serve your chosen files at the icon’s configured local path.

## Try Image Comparison in a separate folder

1. Install WebQuark in an empty folder. Use the same package version as the playground you copied from. The development tag follows this repository’s [installation guide](../README.md#1-install-library).

   ```sh
   bun add @webquark/browser@dev
   ```

2. Save the following as `main.js`. It loads the package stylesheet and registers Image Comparison. For another example, import the WebQuark components used by both its markup and its script. Demo action buttons use `q-button`. The Toast editor also uses `q-input` and `q-toggle`.

   ```js
   import '@webquark/browser/webquark.css';
   import '@webquark/browser/components/q-image-comparison';
   ```

3. Save this page as `index.html`. Replace the comment with the complete example from the playground’s Copy button.

   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8">
       <meta name="viewport" content="width=device-width, initial-scale=1">
       <title>Image Comparison</title>
       <link rel="stylesheet" href="./dist/main.css">
       <script type="module" src="./dist/main.js"></script>
     </head>
     <body>
       <!-- Paste the copied example here. -->
     </body>
   </html>
   ```

4. Build the entry point and serve this folder over HTTP. For example, with Bun and Python installed, run these commands in the folder.

   ```sh
   bun build ./main.js --target browser --outdir ./dist
   python -m http.server 8080 --bind 127.0.0.1
   ```

5. Open [the local page](http://127.0.0.1:8080/). Both built-in workspace illustrations travel inside the copied example. Focus the slider and use the arrow keys to change how much of the Before image is visible. If you entered your own image URLs in the playground, those URLs must also resolve from this page.
