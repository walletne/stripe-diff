import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { buildHeatmap, formatHeatmapTable, formatHeatmapJson } from './diffHeatmap';
import { parseVersionRange } from './versionRange';
import { validateVersions } from './versionList';
import { writeOutput } from './outputWriter';

export function registerHeatmapCommand(program: Command): void {
  program
    .command('heatmap <versionRange>')
    .description('Show a heatmap of change intensity across versions and event objects')
    .option('--json', 'Output as JSON')
    .option('-o, --output <file>', 'Write output to file')
    .action(async (versionRange: string, opts: { json?: boolean; output?: string }) => {
      let versions: string[];
      try {
        const allVersions = await cachedFetch('https://stripe.com/docs/api/versioning');
        versions = parseVersionRange(versionRange, validateVersions(allVersions));
      } catch {
        versions = parseVersionRange(versionRange, []);
      }

      if (versions.length < 2) {
        console.error('Heatmap requires at least 2 versions.');
        process.exit(1);
      }

      const diffs: Record<string, import('./diffSchema').DiffEntry[]> = {};

      for (let i = 0; i < versions.length - 1; i++) {
        const vFrom = versions[i];
        const vTo = versions[i + 1];
        const label = `${vFrom} → ${vTo}`;
        try {
          const [rawFrom, rawTo] = await Promise.all([
            cachedFetch(vFrom),
            cachedFetch(vTo),
          ]);
          const schemasFrom = extractEventSchemas(rawFrom);
          const schemasTo = extractEventSchemas(rawTo);
          diffs[label] = Object.entries(diffEventSchemas(schemasFrom, schemasTo))
            .flatMap(([, entries]) => entries);
        } catch (err) {
          console.warn(`Skipping ${label}: ${(err as Error).message}`);
        }
      }

      const versionLabels = Object.keys(diffs);
      const report = buildHeatmap(diffs, versionLabels);
      const output = opts.json ? formatHeatmapJson(report) : formatHeatmapTable(report);

      if (opts.output) {
        writeOutput(opts.output, output);
        console.log(`Heatmap written to ${opts.output}`);
      } else {
        console.log(output);
      }
    });
}
