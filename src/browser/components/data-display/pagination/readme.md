# q-pagination



<!-- Auto Generated Below -->


## Overview

Controlled pagination for client-side or server-side collections.
Consumers own the current page and update `page` after `qPageChange`.

## Properties

| Property      | Attribute      | Description                                                                 | Type      | Default        |
| ------------- | -------------- | --------------------------------------------------------------------------- | --------- | -------------- |
| `ariaLabel`   | `aria-label`   | Accessible name for the pagination navigation landmark.                     | `string`  | `'Pagination'` |
| `disabled`    | `disabled`     |                                                                             | `boolean` | `false`        |
| `itemLabel`   | `item-label`   | Noun used in the visible range summary, for example "users" or "templates". | `string`  | `'items'`      |
| `page`        | `page`         | One-based; out-of-range values are clamped for display and navigation.      | `number`  | `1`            |
| `pageSize`    | `page-size`    | Non-positive or non-finite values fall back to 1.                           | `number`  | `10`           |
| `showSummary` | `show-summary` |                                                                             | `boolean` | `true`         |
| `totalItems`  | `total-items`  | Negative or non-finite values are treated as zero.                          | `number`  | `0`            |


## Events

| Event         | Description                                                                    | Type                  |
| ------------- | ------------------------------------------------------------------------------ | --------------------- |
| `qPageChange` | Emitted with a requested one-based page. The component does not mutate `page`. | `CustomEvent<number>` |


## Shadow Parts

| Part                | Description                             |
| ------------------- | --------------------------------------- |
| `"container"`       | Outer pagination navigation.            |
| `"controls"`        | Previous/page-count/next control group. |
| `"next-button"`     | Native next-page button.                |
| `"page-count"`      | Current page and total page count.      |
| `"previous-button"` | Native previous-page button.            |
| `"summary"`         | Visible item-range summary.             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
