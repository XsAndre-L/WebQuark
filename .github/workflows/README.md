# WebQuark GitHub Actions

WebQuark has one publishing workflow for `dev` and `main`. Automatic verification runs after changes reach either release branch and before npm publishing. Pull requests do not run GitHub Actions checks. Publishing remains dormant until deliberately enabled.

## The developer flow

1. Work on a feature branch and open a pull request into `dev`.
2. Review and merge the pull request into `dev`.
3. When dev publishing is enabled, the deploy workflow audits the locked dependencies, reads `.github/release.json`, finds the next available npm sequence, verifies the prepared packages, and publishes them together as `1.1.0-dev.1` only after every release check passes.
4. The next merge into `dev` becomes `1.1.0-dev.2`, then `dev.3`, and so on.
5. Open and review a pull request from `dev` into `main`.
6. Merge into `main`. When production publishing is enabled, the deploy workflow runs the same release gates, publishes all packages as `1.1.0`, and creates the `v1.1.0` GitHub release.

The workflow also handles direct pushes to these branches and manual retries through `workflow_dispatch`, subject to the same branch-specific enable flags.

No commit-title convention and no manually applied npm tag controls the version.

## The one version control file

`.github/release.json` contains the next stable version:

```json
{
  "nextVersion": "1.1.0",
  "versioning": "lockstep"
}
```

The workflow temporarily writes the calculated version into every package manifest. After `1.1.0` is released, change `nextVersion` once to the next intended version, such as `1.1.1`, `1.2.0`, or `2.0.0`.

A numeric prerelease identifier cannot contain a leading zero. The valid form is `1.1.0-dev.1`, not `1.1.0-dev.01`.

## Branch and npm mapping

| Event | Result | npm dist-tag | Environment |
|---|---|---|---|
| Pull request into `dev` or `main` | No automatic checks or publishing | None | None |
| Merge/push to `dev` | Next automatic `-dev.N` version | `dev` | `dev` |
| Merge/push to `main` | Stable `nextVersion` | `latest` | `prod` |

Consumers choose the stream explicitly:

```bash
npm install @webquark/core@dev
npm install @webquark/browser@dev @webquark/angular@dev
npm install @webquark/tooling@latest
```

## Publishing scripts

The release logic lives under `.github/scripts/publishing/`:

- The private root `packages:build` script builds browser, tooling, core, React, and Angular without running tests. The root is never packed or published.
- The root `pr:verify` package script remains available for local checks: it checks prop policy before building packages and running tooling and unit tests.
- `prepare-release.ts` validates `.github/release.json`, calculates `-dev.N`, and aligns all five package versions and exact internal dependency versions. Core depends on browser and tooling; wrappers depend on and peer browser; tooling has no WebQuark dependency.
- `verify-packages.ts` checks prop policy, builds all five packages, verifies packed Angular 21/22 consumers, runs every Vitest project by default, and validates manifests and npm tarballs. It is the publish workflow's final gate.
- `publish-packages.ts` packs first, publishes browser/tooling before core and browser before React/Angular, prevents overwriting different npm contents, resumes matching partial publications, and applies the requested npm dist-tag.

The root `publish-all` script requires an explicit `--tag dev|latest`. GitHub Actions uses npm trusted publishing. Local publishing requires an explicit `NODE_AUTH_TOKEN`.

## Required GitHub configuration

Create these repository settings before enabling deployment:

- Repository variables `WEBQUARK_DEV_PIPELINE_ENABLED=true` and `WEBQUARK_PROD_PIPELINE_ENABLED=false`.
- GitHub environment `dev`, managed by AnythingDevOps. `prod` remains inactive.
- Configure GitHub Actions trusted publishing for each of the five npm packages. Use `XsAndre-L/WebQuark` and `deploy-wf.yml`, with separate `dev` and `prod` connections. Enable `npm publish` and `npm dist-tag` on both.
- Recommended reviewer approval on `prod`.

If branch protection or a ruleset requires the former `Pull Request` workflow's `Build and test packages` status check, remove that requirement when retiring the workflow so pull requests can merge.

The pipeline uses independent controls:

1. Dev deployment requires `WEBQUARK_DEV_PIPELINE_ENABLED` to equal the exact string `true`.
2. Production deployment separately requires `WEBQUARK_PROD_PIPELINE_ENABLED` to equal the exact string `true`.
3. AnythingDevOps excludes each GitHub environment while its `active` flag is `false`.

Dev and production publishing can be enabled independently. A disabled branch remains dormant even when it receives commits.

## Release gates

Every release installs and audits the locked dependencies, prepares the package versions, checks prop order, builds all five packages, checks the packed Angular 21/22 consumers, and validates the manifests and tarball contents.

Dev releases also install the Playwright browsers and run every Vitest project. On `main`, the workflow looks for a successful dev deployment of the exact commit and checks that its verification step passed. When it finds one, it reuses those test results and skips the browser installation and Vitest run. A different commit, a skipped verification step, or an unavailable GitHub lookup triggers the full suite.

The workflow pins its GitHub Actions and Bun versions for reproducible runs. Dev and production publishing remain independently controlled by repository variables and protected environments.

The toolchain uses Bun 1.4.2, Node.js 24.21.0 LTS, and TypeScript 6.0.3 across all three packages. Angular wrappers compile with Angular 21.2.25 in partial-Ivy mode and are checked with packed Angular 21.2.25 and 22.2.2 consumers. React wrappers compile and check consumer types with React 19.3.0. Stencil's test adapter supports Vitest 4, so its three Vitest packages stay aligned at 4.1.12. TypeScript 7 is outside the Angular compiler peer ranges and lacks the compiler API used by repository tooling. The dependency graph uses upstream dependency ranges without overrides or patches.

## Local safe checks

```bash
bun install --frozen-lockfile
bun audit --audit-level=moderate
bun run pr:verify
bun run release:prepare -- --channel dev --sequence 1 --dry-run
bun run release:prepare -- --channel stable --dry-run
bun run release:verify
bun run publish-all -- --tag dev --dry-run
```

The dry-run commands do not change npm or GitHub.

## Enabling publishing

Enable dev publishing after configuring the `dev` trusted publisher for all five npm packages.

```bash
gh variable set WEBQUARK_DEV_PIPELINE_ENABLED --body true
```

To make dev publishing dormant again, set `WEBQUARK_DEV_PIPELINE_ENABLED` back to `false`.

## Focused carousel browser checks

The deploy workflow installs browser binaries from the lockfile-pinned Playwright
version before `release:verify` builds the production loader and runs every Vitest
project, including `carousel-browsers`. For a focused local run after
`bun run packages:build`, use `bun run test:carousel:browsers` with those browsers installed.
The dedicated `carousel-browsers` Vitest project includes only the transition
regression file; the existing all-component browser project remains Chromium-only.
No second package build is needed. WebKit engine coverage is not proof of Safari
on physical Apple hardware; physical touch-device checks remain separate.
