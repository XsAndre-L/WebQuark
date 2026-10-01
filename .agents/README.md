# Agent Knowledge Map

Codex discovers team-shared repository skills from `.agents/skills`. Load only the skill relevant to the task.

The local CLI is being rebuilt before full release. Target the current
`.webquark/` layout only. Do not add backward compatibility readers, migrations,
or older storage layouts unless the user explicitly requests them.

- [`$organize-stencil-props`](skills/organize-stencil-props/SKILL.md): Audit and organize WebQuark Stencil `@Prop()` declarations without changing their semantics.

Users may invoke a skill explicitly with its `$skill-name`; Codex may also invoke it when a request matches its description.
