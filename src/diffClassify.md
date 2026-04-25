# diffClassify

The `diffClassify` module categorises each change in a diff into a semantic change category, making it easier to understand the nature and impact of differences between two Stripe API versions.

## Categories

| Category | Description |
|---|---|
| `field-addition` | A new field was added to the schema |
| `field-removal` | An existing field was removed from the schema |
| `type-change` | A field's data type changed (e.g. `string` → `integer`) |
| `constraint` | A constraint changed (e.g. `nullable`, `required`, `enum`) |
| `structural` | A shallow structural change at the top level |
| `unknown` | Change could not be categorised |

## Usage

```bash
# Text report (default)
stripe-diff classify 2023-08-16 2024-04-10

# JSON output
stripe-diff classify 2023-08-16 2024-04-10 --format json

# Filter to a specific event object
stripe-diff classify 2023-08-16 2024-04-10 --event charge.*

# Write to file
stripe-diff classify 2023-08-16 2024-04-10 --output classify-report.txt
```

## Programmatic API

```ts
import { classifyAll, groupByCategory, formatClassifyReport } from './diffClassify';

const classified = classifyAll(diffEntries);
const grouped = groupByCategory(classified);
console.log(formatClassifyReport(classified));
```

## Output example

```
Classification Report
========================================

Field added (3)
  charge.payment_method_details.card.network_token
  ...

Type change (1)
  charge.amount_decimal
```
