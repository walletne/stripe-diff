import { Command } from 'commander';
import { buildDiffScoreReport, formatDiffScoreReport, formatDiffScoreJson } from './diffScore';
import { filteredDiff } from './filteredDiff';
import { cachedFetch } from './cachedFetch';
import { parseVersionRange } from './versionRange';
import { validateVersions } from './versionList';

export function registerScoreCommand(program: Command): void {
  program
    .command('score <versionA> <versionB>')
    .description('Score and rank events by degree of change between two API versions')
    .option('--event <pattern>', 'Filter events by pattern (glob supported)')
    .option('--json', 'Output as JSON')
    .option('--range <range>', 'Version range (e.g. 2022-01-01..2023-01-01)')
    .action(async (versionA: string, versionB: string, opts: { event?: string; json?: boolean; range?: string }) => {
      try {
        let resolvedA = versionA;
        let resolvedB = versionB;

        if (opts.range) {
          const [a, b] = parseVersionRange(opts.range);
          resolvedA = a;
          resolvedB = b;
        }

        const versions = await validateVersions([resolvedA, resolvedB]);
        if (!versions.valid) {
          console.error(`Invalid versions: ${versions.errors.join(', ')}`);
          process.exit(1);
        }

        const diffs = await filteredDiff(resolvedA, resolvedB, cachedFetch, {
          patterns: opts.event ? [opts.event] : [],
        });

        const report = buildDiffScoreReport(diffs);

        if (opts.json) {
          console.log(formatDiffScoreJson(report));
        } else {
          console.log(formatDiffScoreReport(report));
        }
      } catch (err) {
        console.error('Error computing diff scores:', (err as Error).message);
        process.exit(1);
      }
    });
}
