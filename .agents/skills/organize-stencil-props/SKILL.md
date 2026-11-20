---
name: organize-stencil-props
description: Audit and organize WebQuark Stencil `@Prop()` declaration blocks with the repository's deterministic prop-order checker while preserving the public API and implementation. Use when adding, reviewing, or reordering component props; resolving prop-order diagnostics; maintaining shared prop mixins; or verifying that prop-only cleanup did not change names, decorators, types, defaults, or JSDoc.
---

# Organize Stencil Props

Apply WebQuark's prop-order contract without changing component behavior or public API semantics.

## Use the canonical groups

Order classified props by these groups only:

1. `content-data`
2. `style-layout`
3. `behavior`
4. `settings`
5. `state`
6. `validation`
7. `html-integrations`
8. `accessibility`

Use the default map and component overrides in `scripts/component-prop-order/config.ts` as the source of truth. Do not guess when a prop is unclassified; audit its semantics and update the configuration deliberately.

Honor the semantic overrides for `q-icon.name`, `q-icon.label`, `q-scrollable.target`, and `q-toggle.type`; their names alone do not determine their groups.

## Preserve declaration blocks

- Move each property's JSDoc, decorators, declaration, type, initializer, and default together.
- Preserve prop names, decorator options, types, defaults, JSDoc text, events, methods, implementation logic, and organizational comments exactly.
- Keep related props together and put their controller first. Treat each configured relationship cluster as one ordering unit assigned to the controller's group.
- Respect configured clusters for navigation and URL fallbacks, selection, sorting, search, validation ranges and errors, icon-only and dismissible accessibility, and feature controllers for toolbars, pagination, carousels, collapse controls, dialog actions, maps, input sizing, and scrolling.
- Require exactly one blank line between populated groups or named mode sections, and no blank lines inside a group or relationship cluster.
- Preserve meaningful mode sections. Put each section header directly before its first prop, with no intervening blank line. In `q-sidepanel`, retain `Shared`, `Drawer`, and `Navigation` in that order, then apply the same group and relationship rules within each section.

## Handle mixins separately

- Treat every configured prop-mixin factory and component-local prop list as its own source block.
- Keep inherited mixin props as a shared prelude; never interleave them physically with local props.
- Use composed effective APIs only to detect duplicate inherited or locally redeclared props.
- Do not enforce physical relationship adjacency across mixin or source boundaries.

## Follow the verification workflow

1. Inspect the worktree and preserve existing changes.
2. Capture the baseline before reordering:
   `bun run check:prop-order -- --fingerprint <temporary-file>`
3. Inspect policy decisions as needed with `--explain`, optionally narrowed by `--category <name>` or `--component <tag>`; use `--json` for machine-readable output.
4. Reorder complete prop declaration blocks only. Never use `scripts/align-headers.ts`; it is outside this workflow.
5. Run `bun run check:prop-order` for the full repository.
6. Prove semantic equality with `bun run check:prop-order -- --compare <temporary-file>`.
7. Run the prop-order tooling tests, relevant component tests, `git diff --check`, and the production build.
8. After a repository-wide cleanup, regenerate tracked Stencil declarations and README API tables once, then confirm the fingerprint still matches.

The checker is read-only in every mode except that `--fingerprint` may write only to the explicitly supplied temporary file. Treat exit code `1` as a policy violation and exit code `2` as a parser, configuration, or operational failure.
