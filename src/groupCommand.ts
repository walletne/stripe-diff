import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { groupDiffByObject, formatGroupedDiff, formatGroupedDiffJson } from './diffGroup';
import { validateVersions } from './versionList';

export function registerGroupCommand(program: Command): void {
  program
    .command('group <version1> <version2>')
    .description('Show diff grouped by Stripe object type')
    .option('--json', 'Output as JSON')
    .action(async (version1: string, version2: string, opts: { json?: boolean }) => {
      try {
        await validateVersions([version1, version2]);

        const [schema1, schema2] = await Promise.all([
          cachedFetch(version1),
          cachedFetch(version2),
        ]);

        const events1 = extractEventSchemas(schema1);
        const events2 = extractEventSchemas(schema2);
        const diff = diffEventSchemas(events1, events2);
        const groups = groupDiffByObject(diff);

        if (opts.json) {
          console.log(formatGroupedDiffJson(groups));
        } else {
          console.log(formatGroupedDiff(groups));
        }
      } catch (err) {
        console.error((err as Error).message);
        process.exit(1);
      }
    });
}
