# diffReplay

The `diffReplay` module provides functionality to replay a sequence of Stripe API version diffs, simulating the evolution of event schemas over time.

## Overview

Given a list of API versions (e.g. `["2022-08-01", "2022-11-15", "2023-08-16"]`), `buildReplayReport` computes the diff between each consecutive pair and assembles a step-by-step replay report.

This is useful for:
- Auditing how a specific event type changed across multiple releases
- Generating migration guides
- Visualising the "history" of a field

## Functions

### `buildReplayReport(steps, versions)`

Accepts an array of `ReplayStep` objects (each containing `from`, `to`, and a `DiffResult`) and the ordered version list. Returns a `ReplayReport`.

### `formatReplayReport(report)`

Formats the replay report as human-readable text, showing each version transition and the changes introduced.

### `formatReplayJson(report)`

Serialises the replay report to a JSON string.

## Usage

```bash
stripe-diff replay 2022-08-01..2023-08-16 --event charge.updated
```

## Output example

```
Replay: 2022-08-01 → 2023-08-16 (2 steps)

Step 1: 2022-08-01 → 2022-11-15
  charge.updated
    + data.object.amount_details (object)
    ~ data.object.status: string

Step 2: 2022-11-15 → 2023-08-16
  charge.updated
    - data.object.disputed (boolean)
```
