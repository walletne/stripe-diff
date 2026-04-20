# diffScore

Scores and ranks Stripe webhook events by the degree of change between two API versions.

## Overview

The `diffScore` module assigns a numeric score (0–100) to each event based on the number and type of field changes detected in a diff:

- **Added fields**: weight ×1
- **Removed fields**: weight ×2 (breaking)
- **Changed fields**: weight ×1.5

The score is capped at 100.

## API

### `scoreDiff(event, diff): DiffScore`

Scores a single event diff.

```ts
const score = scoreDiff('charge.created', diffResult);
// { event, added, removed, changed, total, score }
```

### `buildDiffScoreReport(diffs): DiffScoreReport`

Builds a full report across all events.

```ts
const report = buildDiffScoreReport({ 'charge.created': diff1, 'payment.failed': diff2 });
// { scores, mostChanged, leastChanged, averageScore }
```

### `formatDiffScoreReport(report): string`

Formats the report as a human-readable table with score bars.

### `formatDiffScoreJson(report): string`

Formats the report as JSON.

## CLI Usage

```bash
stripe-diff score 2022-08-01 2023-08-16
stripe-diff score 2022-08-01 2023-08-16 --event 'charge.*'
stripe-diff score 2022-08-01 2023-08-16 --json
stripe-diff score --range 2022-08-01..2023-08-16
```
