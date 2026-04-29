import { Command } from 'commander';
import { buildLineageReport, formatLineageReport, formatLineageJson } from './diffLineage';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { parseVersionRange } from './versionRange';
import { writeOutput } from './outputWriter';

export function registerLineageCommand(program: Command): void {
  program
    .command('lineage <versionRange>')
    .description('Show the lineage of fields across a range of API versions')
    .option('--event <event>', 'Filter to a specific event type')
    .option('--format <fmt>', 'Output format: text or json', 'text')
    .option('--output <file>', 'Write output to file')
    .action(async (versionRange: string, opts: { event?: string; format: string; output?: string }) => {
      const versions = parseVersionRange(versionRange);
      if (versions.length < 2) {
        console.error('Error: lineage requires at least two versions in range.');
        process.exit(1);
      }

      const versionedDiffs: { version: string; entries: ReturnType<typeof diffEventSchemas>[string] }[] = [];

      for (let i = 1; i < versions.length; i++) {
        const [rawA, rawB] = await Promise.all([
          cachedFetch(versions[i - 1]),
          cachedFetch(versions[i]),
        ]);
        const schemasA = extractEventSchemas(rawA);
        const schemasB = extractEventSchemas(rawB);
        const diffs = diffEventSchemas(schemasA, schemasB);

        for (const [event, entries] of Object.entries(diffs)) {
          if (opts.event && event !== opts.event) continue;
          versionedDiffs.push({ version: versions[i], entries });
        }
      }

      const report = buildLineageReport(versionedDiffs);
      const output =
        opts.format === 'json'
          ? formatLineageJson(report)
          : formatLineageReport(report);

      await writeOutput(output, opts.output);
    });
}
