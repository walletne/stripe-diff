import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { parseVersionRange } from './versionRange';
import { validateVersions } from './versionList';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { buildHistoryEntry, formatHistoryTable, DiffHistoryEntry } from './diffHistory';

export function registerHistoryCommand(program: Command): void {
  program
    .command('history <range>')
    .description('Show a summary table of diffs across a version range')
    .option('--json', 'Output as JSON')
    .action(async (range: string, opts: { json?: boolean }) => {
      const allVersions = await cachedFetch('versions');
      const versions = parseVersionRange(range, validateVersions(allVersions));

      if (versions.length < 2) {
        console.error('Need at least two versions to build history.');
        process.exit(1);
      }

      const entries: DiffHistoryEntry[] = [];

      for (let i = 0; i < versions.length - 1; i++) {
        const from = versions[i];
        const to = versions[i + 1];

        const [schemaFrom, schemaTo] = await Promise.all([
          cachedFetch(from).then(extractEventSchemas),
          cachedFetch(to).then(extractEventSchemas),
        ]);

        const diffs = diffEventSchemas(schemaFrom, schemaTo);
        entries.push(buildHistoryEntry(from, to, diffs));
      }

      if (opts.json) {
        console.log(JSON.stringify(entries, null, 2));
      } else {
        process.stdout.write(formatHistoryTable(entries));
      }
    });
}
