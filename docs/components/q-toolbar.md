# q-toolbar

> Contract note: see [Current public contracts](./current-contracts.md#q-toolbar) and the [generated API](../../src/components/layout/toolbar/readme.md) for the complete current surface. Generated API wins if an older design note below differs.

`q-toolbar` is a customizable edge bar with no built-in navigation items or navigation state. Use it for page titles, greetings, back controls, profile actions, command groups, and other consumer-owned content.

Key props: `edge`, `sticky`, `compact`, `transparent`, `bordered`, `ariaLabel`.

Use `edge="top"`, `edge="right"`, `edge="bottom"`, or `edge="left"` to control orientation, inward-facing borders, sticky positioning, and safe-area padding. Top and bottom toolbars are horizontal; left and right toolbars are vertical.

Slots: `start`, default content, `end`.
