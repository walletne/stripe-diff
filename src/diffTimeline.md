# diffTimeline

The `diffTimeline` module provides a chronological view of schema changes across multiple Stripe API version transitions.

## Overview

Given a map of version-pair labels to `DiffEntry[]` arrays, `buildTimelineReport` produces a `TimelineReport` that summarises additions, removals, and modifications at each step.

## Types

### `TimelinePoint`

| Field | Type | Description |
|-------|------|-------------|
| `version` | `string` | Version transition label, e.g. `2022-11-15→2023-08-16` |
| `added` | `number` | Fields added |
| `removed` | `number` | Fields removed |
| `changed` | `number` | Fields changed |
| `events` | `string[]` | Unique event types affected |

### `TimelineReport`

| Field | Type | Description |
|-------|------|-------------|
| `points` | `TimelinePoint[]` | Ordered list of timeline points |
| `totalVersions` | `number` | Number of version transitions |
| `mostActiveVersion` | `string \| null` | Transition with most changes |
| `mostActiveCount` | `number` | Change count for most active version |

## Functions

### `buildTimelinePoint(version, entries)`

Creates a single `TimelinePoint` from a set of `DiffEntry` items.

### `buildTimelineReport(versionedEntries)`

Builds the full `TimelineReport` from a record mapping version labels to entries.

### `formatTimelineReport(report)`

Returns a human-readable markdown-style string.

### `formatTimelineJson(report)`

Returns a pretty-printed JSON string.

## CLI Usage

```bash
stripe-diff timeline 2022-11-15..2024-04-10
stripe-diff timeline 2022-11-15..2024-04-10 --json
```
