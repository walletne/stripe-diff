import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { buildTimelineReport, formatTimelineReport, formatTimelineJson } from './diffTimeline';
import { parseVersionRange } from './versionRange';
import { validateVersions } from './versionList';
import type { DiffEntry } from './diffSchema';

export function registerTimelineCommand(program: Command): void {
  program
    .command('timeline <versionRange>')
    .description('Show a timeline of diff activity across multiple API versions')
    .option('--json', 'Output as JSON')
    .action(async (versionRange: string, opts: { json?: boolean }) => {
      let versions: string[];
      try {
        const allVersions = await cachedFetch('https://stripe.com/docs/api/versioning');
        const parsed = parseVersionRange(versionRange, allVersions as string[]);
        versions = validateVersions(parsed, allVersions as string[]);
      } catch (err) {
        console.error(`Error resolving versions: ${(err as Error).message}`);
        process.exit(1);
      }

      const versionedEntries: Record<string, DiffEntry[]> = {};

      for (let i = 0; i + 1 < versions.length; i++) {
        const from = versions[i];
        const to = versions[i + 1];
        try {
          const [schemaA, schemaB] = await Promise.all([
            cachedFetch(`https://stripe.com/docs/api/${from}`),
            cachedFetch(`https://stripe.com/docs/api/${to}`),
          ]);
          const eventsA = extractEventSchemas(schemaA as string);
          const eventsB = extractEventSchemas(schemaB as string);
          versionedEntries[`${from}→${to}`] = diffEventSchemas(eventsA, eventsB);
        } catch {
          versionedEntries[`${from}→${to}`] = [];
        }
      }

      const report = buildTimelineReport(versionedEntries);
      console.log(opts.json ? formatTimelineJson(report) : formatTimelineReport(report));
    });
}
