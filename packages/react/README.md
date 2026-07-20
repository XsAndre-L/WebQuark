# @webquark/react

React wrappers for the WebQuark component library.

Install with `npm install @webquark/core @webquark/react`.

## Rich data-table cells

The React `QDataTable` accepts a framework-native `cell` renderer on each
column:

```tsx
import { QDataTable, type QDataTableColumn } from '@webquark/react';

const columns: QDataTableColumn<TeamRow>[] = [
  {
    key: 'teamMember',
    header: 'Team member',
    cell: ({ row }) => <TeamMemberCell member={row.member} />,
  },
];

<QDataTable keyField="id" columns={columns} items={rows} />;
```

The renderer context provides `row`, `value`, `rowIndex`, and `column`. Keep
`keyField` stable so cell content stays with the correct row during sorting and
refreshes. Rich-cell wrappers are keyed by their row-and-column identity so React
can preserve unchanged framework content.
