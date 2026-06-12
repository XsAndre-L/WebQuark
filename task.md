# Decoupled Playground Modularization Task List

- [x] **Create new directory structure**
  - Create directory `src/playground`
  - Create directory `src/playground/specs`
- [x] **Extract spec JSON files**
  - Extract and format 12 JSON files inside `src/playground/specs/` from the registry in `src/index.html`
- [x] **Extract CSS and JavaScript**
  - Extract CSS to `src/playground/playground.css`
  - Extract JavaScript to `src/playground/playground.js`
  - Update dynamic config loading inside `playground.js` to fetch specs from `/playground/specs/`
- [x] **Create index.html layout skeleton**
  - Create `src/playground/index.html` linking to `playground.css` and `playground.js`
- [x] **Configure Stencil build copy rules**
  - Update `stencil.config.ts` to use `indexHtml: 'playground/index.html'` and copy playground files to `www`
- [x] **Remove legacy files**
  - Delete `src/index.html`
- [x] **Validate Build & Execution**
  - Run `npm run build` and ensure no compilation/copy issues
  - Run `npm run start` and test the playground interface locally
