import { Command } from 'commander';
import { buildTagIndex, filterByTag, formatTagSummary, tagDiffEntry } from './diffTag';
import { filteredDiff } from './filteredDiff';
import { cachedFetch } from './cachedFetch';

export function registerTagCommand(program: Command): void {
  program
    .command('tag <tag> <v1> <v2>')
    .description('Show diff entries for a specific tag label across two API versions')
    .option('--event <pattern>', 'Filter by event pattern', '*')
    .option('--json', 'Output as JSON')
    .action(async (tag: string, v1: string, v2: string, opts) => {
      try {
        const [schema1, schema2] = await Promise.all([
          cachedFetch(v1),
          cachedFetch(v2),
        ]);

        const diffs = filteredDiff(schema1, schema2, opts.event ? [opts.event] : ['*']);

        const tagged = Object.entries(diffs).flatMap(([eventName, changes]) =>
          changes.flatMap((c) =>
            tagDiffEntry(eventName, `${v1}→${v2}`, c.field, c.type as any, [tag])
          )
        );

        const index = buildTagIndex(tagged);
        const filtered = filterByTag(tagged, tag);

        if (opts.json) {
          console.log(JSON.stringify({ tag, count: filtered.length, entries: filtered }, null, 2));
        } else {
          console.log(formatTagSummary(index));
        }
      } catch (err) {
        console.error('Error:', (err as Error).message);
        process.exit(1);
      }
    });
}
