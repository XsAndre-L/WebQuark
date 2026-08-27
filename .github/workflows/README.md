# WebQuark GitHub Actions

WebQuark has one temporarily disabled pull-request workflow and one publishing workflow. Both target only the `dev` and `main` branches. Publishing remains dormant until deliberately enabled.

## The developer flow

1. Work on a feature branch and open a pull request into `dev`.
2. The pull-request workflow reports a skipped job. It performs no checkout, dependency install, build, or tests.
3. Merge the pull request into `dev`.
4. The deploy workflow reads `.github/release.json`, finds the next available npm sequence, builds all three libraries, and publishes them together as `1.1.0-dev.1`. Pipeline tests and full release verification are temporarily disabled.
5. The next merge into `dev` becomes `1.1.0-dev.2`, then `dev.3`, and so on.
6. Open a pull request from `dev` into `main`. The pre-merge job remains skipped.
7. Merge into `main`. The deploy workflow publishes all packages as `1.1.0` and creates the `v1.1.0` GitHub release.

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
| Pull request into `dev` or `main` | Pre-merge job skipped | None | None |
| Merge/push to `dev` | Next automatic `-dev.N` version | `dev` | `dev` |
| Merge/push to `main` | Stable `nextVersion` | `latest` | `prod` |

Consumers choose the stream explicitly:

```bash
npm install @webquark/core@dev @webquark/react@dev @webquark/angular@dev
npm install @webquark/core@latest @webquark/react@latest @webquark/angular@latest
```

## Publishing scripts

The release logic lives under `.github/scripts/publishing/`:

- The root `packages:build` package script builds core, React, and Angular without running tests.
- The root `pr:verify` package script builds the packages and adds tooling and unit tests for local verification; the pull-request workflow does not currently call it.
- `prepare-release.ts` validates `.github/release.json`, calculates `-dev.N`, and aligns all package versions.
- `verify-packages.ts` provides the complete release verification, but its workflow step is temporarily commented out.
- `publish-packages.ts` packs first, publishes in core/React/Angular order, prevents overwriting different npm contents, and applies the requested npm dist-tag.

The root `publish-all` package script points to this guarded publisher. A real publish requires both an explicit `--tag dev|latest` argument and `NODE_AUTH_TOKEN`.

## Required GitHub configuration

Create these repository settings before enabling deployment:

- Repository variables `WEBQUARK_DEV_PIPELINE_ENABLED=true` and `WEBQUARK_PROD_PIPELINE_ENABLED=false`.
- GitHub environment `dev`, managed by AnythingDevOps. `prod` remains inactive.
- One repository secret named `NPM_TOKEN`, with npm publish access to the `@webquark` scope. This shared credential publishes core, React, and Angular; there are no per-package secrets.
- Recommended reviewer approval on `prod`.

The pipeline uses independent controls:

1. Dev deployment requires `WEBQUARK_DEV_PIPELINE_ENABLED` to equal the exact string `true`.
2. Production deployment separately requires `WEBQUARK_PROD_PIPELINE_ENABLED` to equal the exact string `true`.
3. AnythingDevOps excludes each GitHub environment while its `active` flag is `false`.

Dev publishing is enabled independently. Production remains disabled even when commits reach `main`.

## Temporary pipeline test pause

The pull-request workflow is skipped before GitHub allocates a runner. Its checkout, setup, install, build, and test steps remain commented so they can be restored later. Core, React, and Angular are built only by the deployment workflow after a merge or direct push to `dev` or `main`.

Deployments can publish after a successful build, but they currently skip Vitest, Playwright browser tests, Angular compatibility checks, manifest checks, and npm pack dry-runs.

Run the local checks below before merging while pipeline tests are disabled. Re-enable the commented deployment verification steps before enabling production publishing.

## Local safe checks

```bash
bun install --frozen-lockfile
bun run pr:verify
bun run release:prepare -- --channel dev --sequence 1 --dry-run
bun run release:prepare -- --channel stable --dry-run
bun run release:verify
bun run publish-all -- --tag dev --dry-run
```

The dry-run commands do not change npm or GitHub.

## Enabling later

Only after `dev` exists and the npm credential has been reviewed:

```bash
gh variable set WEBQUARK_DEV_PIPELINE_ENABLED --body true
```

To make dev publishing dormant again, set `WEBQUARK_DEV_PIPELINE_ENABLED` back to `false`.
