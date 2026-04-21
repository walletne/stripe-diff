import { Command } from 'commander';
import { parseVersionRange } from './versionRange';
import { validateVersions } from './versionList';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { buildTrendPoint, buildTrendReport, formatTrendReport, formatTrendJson } from './diffTrend';

export function registerTrendCommand(program: Command): void {
  program
    .command('trend <versionRange>')
    .description('Show change trend across a range of API versions')
    .option('--json', 'Output as JSON')
    .option('--no-cache', 'Disable cache')
    .action(async (versionRange: string, opts: { json?: boolean; cache?: boolean }) => {
      const allVersions = await validateVersions([]);
      const versions = parseVersionRange(versionRange, allVersions);

      if (versions.length < 2) {
        console.error('Need at least 2 versions to compute trend.');
        process.exit(1);
      }

      const useCache = opts.cache !== false;
      const points = [];
      const allDiffs: Record<string, Record<string, import('./diffSchema').DiffEntry[]>> = {};

      for (let i = 0; i < versions.length - 1; i++) {
        const from = versions[i];
        const to = versions[i + 1];
        const label = `${from}→${to}`;

        const [schemaFrom, schemaTo] = await Promise.all([
          cachedFetch(from, useCache).then(extractEventSchemas),
          cachedFetch(to, useCache).then(extractEventSchemas),
        ]);

        const diffs = diffEventSchemas(schemaFrom, schemaTo);
        allDiffs[label] = diffs;
        points.push(buildTrendPoint(label, diffs));
      }

      const report = buildTrendReport(points, allDiffs);

      if (opts.json) {
        console.log(formatTrendJson(report));
      } else {
        console.log(formatTrendReport(report));
      }
    });
}
