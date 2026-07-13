# GitHub Actions Workflows

WebQuark has two visible pipeline workflows. Both are intentionally dormant.

| File | Trigger | Purpose |
|---|---|---|
| `pull-request-wf.yml` | Pull requests into `dev` or `main` | Install, build, and test WebQuark |
| `deploy-wf.yml` | Pushes to `dev` or `main`, plus manual dispatch | Publish packages to npm |

## Dormancy And Safety Locks

The pipeline uses two independent locks:

1. Every meaningful job requires `WEBQUARK_PIPELINE_ENABLED` to equal the exact string `true`. An unset variable, `false`, or any other value skips the jobs.
2. Both workflows remain disabled in GitHub, preventing trigger events from creating runs.

Keep the variable and workflow state disabled while scaffolding:

```bash
gh variable set WEBQUARK_PIPELINE_ENABLED --body false
gh workflow disable pull-request-wf.yml
gh workflow disable deploy-wf.yml
```

Setting the variable to `true` does not enable a disabled workflow. Enabling a workflow without setting the variable to `true` creates only skipped jobs.

## Pull Request Validation

```text
Pull Request
|-- Build: bun install --frozen-lockfile -> bun run build
`-- Test:  bun install --frozen-lockfile -> bun run build -> bunx vitest run
```

New activity cancels an older in-progress run for the same pull request.

## Package Publishing

| Branch | Release type | npm dist-tag | GitHub environment |
|---|---|---|---|
| `dev` | Prerelease | `next` | `npm-prerelease` |
| `main` | Production | `latest` | `npm-production` |

Manual dispatch follows the same mapping and accepts only `dev` or `main` as the selected ref. Publishing is queued per ref so an active release is never cancelled halfway through.

`NPM_CONFIG_TAG` supplies the npm dist-tag to the existing `npm publish` commands in `scripts/publish.ts`. Each package version must be bumped before publishing; npm will not accept the same package version twice under different dist-tags.

The workflow currently invokes `bun run publish-all`, which publishes `@webquark/core` and `@webquark/react`. Angular publishing remains excluded until `scripts/publish.ts` explicitly supports and verifies the Angular package.

## Required GitHub Configuration

- Create `npm-prerelease` and `npm-production` environments.
- Add an `NPM_TOKEN` secret with publish access.
- Keep `WEBQUARK_PIPELINE_ENABLED=false` while the workflows are dormant.
- Recommended: require reviewer approval for `npm-production`.

## Enabling The Pipeline

Before enabling either workflow:

1. Confirm package versions and npm access.
2. Confirm install, build, and tests pass.
3. Create the environments and `NPM_TOKEN` secret.
4. Set `WEBQUARK_PIPELINE_ENABLED=true`.
5. Enable only the workflow that is ready:

```bash
gh workflow enable pull-request-wf.yml
gh workflow enable deploy-wf.yml
```

To make the pipeline dormant again, set the variable to `false` first and then disable both workflows.
