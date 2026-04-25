# diffSignature

Computes a stable hash **signature** for a diff between two Stripe API versions.
Useful for detecting whether a diff has changed between runs, caching, or labeling releases.

## Usage

```bash
stripe-diff signature 2023-08-16 2024-04-10
```

### Output (text)

```
Diff Signature: a3f9c12e88b1
Version Range:  2023-08-16..2024-04-10
Events:         14
Total Changes:  37
  Added:        18
  Removed:      5
  Modified:     14
```

### Output (JSON)

```bash
stripe-diff signature 2023-08-16 2024-04-10 --json
```

```json
{
  "hash": "a3f9c12e88b1",
  "version": "2023-08-16..2024-04-10",
  "eventCount": 14,
  "changeCount": 37,
  "addedCount": 18,
  "removedCount": 5,
  "modifiedCount": 14
}
```

## Options

| Flag | Description |
|------|-------------|
| `--event <pattern>` | Filter to events matching a substring |
| `--json` | Output as JSON |
| `-o, --output <file>` | Write result to a file |

## Notes

- The hash is a SHA-256 digest (first 12 hex chars) of the sorted field-level changes.
- The same diff will always produce the same hash regardless of event ordering.
- Useful in CI pipelines to assert that a schema diff has not changed unexpectedly.
