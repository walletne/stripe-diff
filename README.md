# stripe-diff

> CLI tool to diff Stripe webhook event schemas across API versions

## Installation

```bash
npm install -g stripe-diff
```

## Usage

Compare Stripe webhook event schemas between two API versions:

```bash
stripe-diff --from 2023-08-16 --to 2024-04-10
```

Filter by a specific event type:

```bash
stripe-diff --from 2023-08-16 --to 2024-04-10 --event payment_intent.succeeded
```

Output the diff as JSON:

```bash
stripe-diff --from 2023-08-16 --to 2024-04-10 --format json
```

### Options

| Flag | Description |
|------|-------------|
| `--from` | Starting Stripe API version |
| `--to` | Target Stripe API version |
| `--event` | Filter by a specific webhook event type |
| `--format` | Output format: `text` (default) or `json` |

## Requirements

- Node.js 18+
- A valid Stripe API key set as `STRIPE_API_KEY` in your environment

## License

MIT