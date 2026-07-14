# WebQuark GitHub Actions

WebQuark has one validation workflow and one publishing workflow. Both use only the `dev` and `main` branches and remain dormant until deliberately enabled.

## The developer flow

1. Work on a feature branch and open a pull request into `dev`.
2. The pull-request workflow builds, tests, and packs all three libraries. It does not publish.
3. Merge the pull request into `dev`.
4. The deploy workflow reads `.github/release.json`, finds the next available npm sequence, and publishes all packages together as `1.1.0-dev.1`.
5. The next merge into `dev` becomes `1.1.0-dev.2`, then `dev.3`, and so on.
6. Open a pull request from `dev` into `main`. Validation runs again.
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
| Pull request into `dev` or `main` | Validate only | None | None |
| Merge/push to `dev` | Next automatic `-dev.N` version | `dev` | `npm-prerelease` |
| Merge/push to `main` | Stable `nextVersion` | `latest` | `npm-production` |

Consumers choose the stream explicitly:

```bash
npm install @webquark/core@dev @webquark/react@dev @webquark/angular@dev
npm install @webquark/core@latest @webquark/react@latest @webquark/angular@latest
```

## Publishing scripts

The release logic lives under `.github/scripts/publishing/`:

- `prepare-release.ts` validates `.github/release.json`, calculates `-dev.N`, and aligns all package versions.
- `verify-packages.ts` builds core, React, and Angular, runs Vitest, checks package entry files, and performs npm pack dry-runs.
- `publish-packages.ts` packs first, publishes in core/React/Angular order, prevents overwriting different npm contents, and applies the requested npm dist-tag.

The root `publish-all` package script points to this guarded publisher. A real publish requires both an explicit `--tag dev|latest` argument and `NODE_AUTH_TOKEN`.

## Required GitHub configuration

Create these repository settings before enabling deployment:

- Repository variable `WEBQUARK_PIPELINE_ENABLED=false`.
- GitHub environments `npm-prerelease` and `npm-production`.
- Secret `NPM_TOKEN` in both environments, with npm publish access to all three `@webquark` packages.
- Recommended reviewer approval on `npm-production`.

The pipeline uses two independent locks:

1. Every job requires `WEBQUARK_PIPELINE_ENABLED` to equal the exact string `true`.
2. Both workflow files should remain disabled in GitHub until validation and npm access are confirmed.

Setting the variable does not enable a disabled workflow.

## Local safe checks

```bash
bun install --frozen-lockfile
bun run release:prepare -- --channel dev --sequence 1 --dry-run
bun run release:prepare -- --channel stable --dry-run
bun run release:verify
bun run publish-all -- --tag dev --dry-run
```

The dry-run commands do not change npm or GitHub.

## Enabling later

Only after the local diff and credentials have been reviewed:

```bash
gh variable set WEBQUARK_PIPELINE_ENABLED --body true
gh workflow enable pull-request-wf.yml
gh workflow enable deploy-wf.yml
```

To make the pipeline dormant again, first set the variable to `false`, then disable both workflows.
