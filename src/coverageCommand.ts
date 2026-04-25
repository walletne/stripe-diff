import { Command } from 'commander';
import { buildCoverageReport, formatCoverageReport, formatCoverageJson } from './diffCoverage';
import { cachedFetch } from './cachedFetch';
import { parseSchema } from './parseSchema';
import { diffEventSchemas } from './diffSchema';

export function registerCoverageCommand(program: Command): void {
  program
    .command('coverage <version1> <version2>')
    .description('Show field change coverage across Stripe API versions')
    .option('--json', 'Output as JSON')
    .option('--no-cache', 'Disable caching')
    .action(async (version1: string, version2: string, opts) => {
      try {
        const useCache = opts.cache !== false;

        const [raw1, raw2] = await Promise.all([
          cachedFetch(version1, useCache),
          cachedFetch(version2, useCache),
        ]);

        const schemas1 = parseSchema(raw1);
        const schemas2 = parseSchema(raw2);

        const allEvents = Array.from(
          new Set([...Object.keys(schemas1), ...Object.keys(schemas2)])
        ).sort();

        const diffs: Record<string, import('./diffSchema').DiffEntry[]> = {};
        for (const event of allEvents) {
          diffs[event] = diffEventSchemas(
            schemas1[event] ?? {},
            schemas2[event] ?? {}
          );
        }

        const report = buildCoverageReport(allEvents, diffs);

        if (opts.json) {
          console.log(formatCoverageJson(report));
        } else {
          console.log(formatCoverageReport(report));
        }
      } catch (err) {
        console.error('Error generating coverage report:', (err as Error).message);
        process.exit(1);
      }
    });
}
