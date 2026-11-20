# Deploy the WebQuark playground to GitHub Pages

Publish the playground from the public `XsAndre-L/WebQuark` repository at `https://xsandre-l.github.io/WebQuark/`. Use the existing browser build and deploy on pushes to `main`. Keep the local playground available at `http://localhost:3333/`.

## 1. GitHub setup — complete

The repository owner selected **Settings → Pages → Build and deployment → Source → GitHub Actions**. Leave the suggested workflows and the custom domain field alone. The default GitHub domain uses HTTPS. A public repository qualifies for GitHub Free Pages. [GitHub Pages setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 2. Make the playground load from a project URL

WebQuark runs at `/` locally and will run at `/WebQuark/` on Pages. A request for `/build/webquark.esm.js` goes to the account site's root in both cases. Have each page resolve its assets relative to its own published location.

| Source | Planned change |
| --- | --- |
| `src/playground/index.html` and `src/playground/components/playground-header/playground-header.tsx` | Use document-relative paths for the favicon, header logo, both Stencil loader entries, and the component stylesheet. Inspect the emitted production HTML for any root-relative preloads or assets inserted by Stencil. |
| `src/playground/components/playground-sidebar/playground-sidebar.tsx` and `src/playground/state.ts` | Fetch `./playground/components.manifest.json` and `./playground/specs/<tag>.sandbox.json` from the main page. Preserve the existing loading, caching, and retry behavior. |
| `src/playground/consumer.html` | This page is published one level deeper at `playground/consumer.html`. Load scripts and styles from `../build/` and link back with `../`. |
| `src/playground/specs/q-icon.sandbox.json` and playground example setup | Give the local icon example a base path that resolves from the playground document. The SVG fetch helper currently resolves relative URLs against the origin, so use a document-resolved path for the playground fixture. Preserve user-supplied paths and the library's public default. Check both SVG and PNG examples. |
| Existing relative URLs | Verify the presets page, tooling guide, comparison images, sample video, and `formatters/prettier/runtime.mjs` with its lazy modules under the prefix. Keep correct relative URLs as they are. |

## 3. Add the Pages workflow

Create `.github/workflows/playground-pages.yml`, named **Deploy playground to Pages**. The existing `.github/workflows/deploy-wf.yml` owns npm publishing. Pages gets its own workflow so a site update can ship independently of a package release.

1. **Trigger.** Run on pushes to `main` and manual dispatch from `main`. Guard the manual path using `github.ref == 'refs/heads/main'`. Use a site-wide concurrency group with `cancel-in-progress: true` so a newer push supersedes an older run.
2. **Build.** Use a clean Ubuntu runner. Reuse the release workflow's pinned checkout, Node, and Bun setup. Run `bun install --frozen-lockfile` followed by `bun run browser:build`. This generates the theme, embedded formatters, and static playground. Build from the checked-out commit.
3. **Verify and upload.** Run the focused check in section 4 against the build. Configure Pages with `actions/configure-pages`, then upload the contents of `.stencil/dist/playground/` with `actions/upload-pages-artifact`. Its top level contains `index.html`. Pin the Pages actions to reviewed commit SHAs, following the existing workflow convention.
4. **Deploy.** Make the deploy job depend on the successful build and upload. Use `actions/deploy-pages`, the `github-pages` environment, and the action's `page_url` as the environment URL. Give checkout `contents: read`, Pages configuration `pages: read`, and the deployment job `pages: write` and `id-token: write`. The workflow uses GitHub's built-in token. [GitHub Pages workflow permissions and actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 4. Verify the actual production output

Add a focused Chromium check that serves the built directory at `/WebQuark/` on loopback and returns 404 for files outside that prefix. Run it before upload using the repository's locked Playwright version and its Chromium browser. Also smoke-test `/` locally to protect the existing developer experience.

| Check | Passing result |
| --- | --- |
| Start the playground and select a second component | The stylesheet, logo, loader, lazy component modules, catalog, and both component specs load. The preview and Properties panel render. |
| Change a property on Button and interact with the preview | Example HTML updates and formats using the shipped modules. Copy receives the displayed HTML. Events records the interaction. The same component can open Variants and Edge Cases. |
| Open the local icon and media examples | The SVG, PNG, and bundled sample video load under the project prefix. Missing-asset examples retain their intentional fallback behavior. |
| Follow navigation links and refresh | Presets, the tooling guide, and the direct consumer guide URL resolve, including their links back to the playground. |

Fail the check for missing required first-party resources. Serve the ordinary formatter `.mjs` files with a JavaScript MIME type and verify a real formatting result. Pages can serve these modules directly without custom gzip configuration.

## 5. Roll out and recover

1. Implement the changes on the current `a_dev` branch, alongside the playground changes intended for publication. Document the hosted URL in the root README and the workflow trigger, artifact path, and retry procedure in `.github/workflows/README.md`.
2. Follow the repository's normal merge path from `a_dev` to `dev` to `main`. The merge to `main` triggers the Pages build. The separate npm workflow continues to obey its existing branch-specific enable flags.
3. Open **Actions → Deploy playground to Pages**. After the deployment job succeeds, open its environment URL in a fresh browser session and verify component navigation and HTML formatting on the public site.
4. If a build or smoke check fails, inspect the first failed step and correct it before publishing. A transient failure can be retried from Actions. If a published change breaks the site, revert the responsible change through the normal merge path and deploy the corrected `main` commit.

**Complete when** the public URL serves the verified `main` build, all required assets load under `/WebQuark/`, and subsequent merges to `main` update the same site automatically.
