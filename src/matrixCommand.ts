import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { parseVersionRange } from './versionRange';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { buildDiffMatrix, formatMatrixTable, formatMatrixJson } from './diffMatrix';
import { writeOutput } from './outputWriter';

export function registerMatrixCommand(program: Command): void {
  program
    .command('matrix <versionRange>')
    .description('Show a matrix of diff changes across multiple API versions and events')
    .option('--format <fmt>', 'Output format: text or json', 'text')
    .option('--output <file>', 'Write output to file')
    .option('--filter <pattern>', 'Filter events by pattern (e.g. charge.*)')
    .action(async (versionRange: string, opts) => {
      const versions = parseVersionRange(versionRange);
      if (versions.length < 2) {
        console.error('Matrix requires at least two versions in range.');
        process.exit(1);
      }

      const versionDiffs: Record<string, import('./diffSchema').DiffEntry[]> = {};

      for (let i = 0; i < versions.length - 1; i++) {
        const from = versions[i];
        const to = versions[i + 1];
        const label = `${from}..${to}`;

        const [rawFrom, rawTo] = await Promise.all([
          cachedFetch(from),
          cachedFetch(to),
        ]);

        const schemasFrom = extractEventSchemas(rawFrom);
        const schemasTo = extractEventSchemas(rawTo);
        let entries = diffEventSchemas(schemasFrom, schemasTo);

        if (opts.filter) {
          const pattern = new RegExp(opts.filter.replace('*', '.*'));
          entries = entries.filter(e => pattern.test(e.event));
        }

        versionDiffs[label] = entries;
      }

      const matrix = buildDiffMatrix(versionDiffs);
      const output =
        opts.format === 'json'
          ? formatMatrixJson(matrix)
          : formatMatrixTable(matrix);

      await writeOutput(output, opts.output);
    });
}
