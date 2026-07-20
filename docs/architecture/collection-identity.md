# Collection Identity

> **Status:** Implemented in the utility, data table, dropdown, tabs, navbar, and side-panel navigation.

## In One Sentence

Collection Identity lets WebQuark update a list without rebuilding the items that did not change.

This prevents flicker and preserves focus, selection, DOM nodes, Angular views, and map markers.

## The Rule

Every collection item needs one **stable and unique** identity:

```ts
item => item.id
item => item.value
cell => `${cell.rowId}:${cell.columnKey}`
```

- Use a `string` or `number`.
- `"1"` and `1` are different identities.
- Do not use an array index for data items.
- An index is only valid for truly positional UI, such as carousel dots.

Objects, arrays, symbols, `null`, and `undefined` are invalid identities.

## Where It Lives

```text
src/utils/collection-identity.ts
```

It is a pure utility. It is **not** a service and stores no global state.

## The Two Functions

### `identifyItems()`

Use this for normal Stencil or React list rendering.

```tsx
identifyItems(options, option => option.value).map(
  ({ item, key }) => <li key={key}>{item.label}</li>,
);
```

Each result contains:

- The original item
- Its original index
- Its public identity
- A type-safe internal key

The input array and items are never changed.

### `reconcileByIdentity()`

Use this when resources must be managed manually, such as:

- Angular embedded views
- DOM wrappers
- Map markers
- Observers

```ts
const result = reconcileByIdentity({
  current: renderedCells,
  incoming: cells,
  identify: cell => `${cell.rowId}:${cell.columnKey}`,
  create: cell => createCellView(cell),
  update: (view, cell) => updateCellView(view, cell),
  remove: view => destroyCellView(view),
});
```

It returns:

- A map of resources by identity
- The resources in the same order as the incoming items

## What Happens During an Update

```text
Current:  A  B  C
Incoming: C  A  D

Reuse:    C  A
Create:   D
Remove:   B
Result:   C  A  D
```

The utility:

1. Reads each identity.
2. Reuses matching resources.
3. Updates reused resources.
4. Creates new resources.
5. Removes missing resources.
6. Returns the new order.

Reordering does not recreate existing resources.

## Missing or Duplicate Identities

The utility will:

- Show a clear development warning.
- Use a deterministic fallback so rendering can continue.
- Never silently overwrite another item.

Fallbacks prevent crashes. Stable rendering is only guaranteed when every identity is valid and unique.

## Who Owns the State?

Each component instance owns its own identity map and cleanup callbacks.

The shared utility only handles the identity and reconciliation algorithm. This prevents state leaking between components.

## What It Does Not Do

Collection Identity does not:

- Fetch or poll data
- Compare GraphQL revisions
- Manage loading state
- Decide whether application data changed
- Store global state
- Automatically update WebQuark components

## Adoption Status

- Done: Angular and React data-table rich cells
- Done: Core data-table rows, columns, groups, and actions
- Done: Dropdown options
- Done: Tabs
- Done: Navbar items
- Done: Side-panel navigation items
- Later if useful: Map markers

Map markers already have stable identity handling, so they do not need an immediate rewrite.

## Required Tests

- Unchanged identities reuse resources.
- `"1"` and `1` do not collide.
- New items are created.
- Removed items are cleaned up.
- Reordered items are reused.
- Updated items are not recreated.
- Invalid identities warn and use a fallback.
- Duplicate identities never overwrite each other.
- Inputs are not mutated.
