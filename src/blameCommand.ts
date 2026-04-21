import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { buildBlameReport, formatBlameReport, formatBlameJson } from './diffBlame';
import { getVersionList } from './versionList';

export function registerBlameCommand(program: Command): void {
  program
    .command('blame <event>')
    .description('Show blame info for field changes in a Stripe event across two API versions')
    .requiredOption('-f, --from <version>', 'Old API version')
    .requiredOption('-t, --to <version>', 'New API version')
    .option('--json', 'Output as JSON')
    .action(async (event: string, opts: { from: string; to: string; json?: boolean }) => {
      try {
        const [oldRaw, newRaw] = await Promise.all([
          cachedFetch(opts.from),
          cachedFetch(opts.to),
        ]);

        const oldSchemas = extractEventSchemas(oldRaw);
        const newSchemas = extractEventSchemas(newRaw);

        const diffs = diffEventSchemas(oldSchemas, newSchemas);
        const eventDiff = diffs[event];

        if (!eventDiff) {
          console.log(`No changes found for event "${event}" between ${opts.from} and ${opts.to}.`);
          process.exit(0);
        }

        let allVersions: string[] = [];
        try {
          allVersions = await getVersionList();
        } catch {
          allVersions = [opts.from, opts.to];
        }

        const report = buildBlameReport(event, eventDiff, opts.from, opts.to, allVersions);

        if (opts.json) {
          console.log(formatBlameJson(report));
        } else {
          console.log(formatBlameReport(report));
        }
      } catch (err) {
        console.error('blame command failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
