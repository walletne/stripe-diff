#!/usr/bin/env node
import { program } from 'commander';
import { fetchSchema } from './fetchSchema';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { formatDiff, formatSummary } from './formatDiff';

program
  .name('stripe-diff')
  .description('Diff Stripe webhook event schemas across API versions')
  .version('0.1.0');

program
  .command('diff <versionA> <versionB>')
  .description('Compare Stripe webhook event schemas between two API versions')
  .option('-e, --event <event>', 'Filter to a specific event type (e.g. payment_intent.created)')
  .option('--json', 'Output diff as JSON')
  .option('--summary', 'Show only a summary of changes')
  .action(async (versionA: string, versionB: string, options: {
    event?: string;
    json?: boolean;
    summary?: boolean;
  }) => {
    try {
      console.error(`Fetching schema for version ${versionA}...`);
      const rawA = await fetchSchema(versionA);
      console.error(`Fetching schema for version ${versionB}...`);
      const rawB = await fetchSchema(versionB);

      const schemasA = extractEventSchemas(rawA);
      const schemasB = extractEventSchemas(rawB);

      const diffs = diffEventSchemas(schemasA, schemasB);

      const filtered = options.event
        ? diffs.filter(d => d.event === options.event)
        : diffs;

      if (options.json) {
        console.log(JSON.stringify(filtered, null, 2));
      } else if (options.summary) {
        console.log(formatSummary(filtered));
      } else {
        for (const diff of filtered) {
          console.log(formatDiff(diff));
        }
      }
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

program
  .command('list <version>')
  .description('List all event types in a given Stripe API version')
  .action(async (version: string) => {
    try {
      console.error(`Fetching schema for version ${version}...`);
      const raw = await fetchSchema(version);
      const schemas = extractEventSchemas(raw);
      const events = Object.keys(schemas).sort();
      events.forEach(e => console.log(e));
      console.error(`\nTotal: ${events.length} event types`);
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

program.parse(process.argv);
