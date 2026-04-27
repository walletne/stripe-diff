import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { buildSimilarFieldReport, formatSimilarFieldReport, formatSimilarFieldJson } from './diffSimilarField';
import { writeOutput } from './outputWriter';

export function registerSimilarFieldCommand(program: Command): void {
  program
    .command('similar-fields <versionA> <versionB>')
    .description('Find structurally similar (potentially renamed) fields between two API versions')
    .option('-t, --threshold <number>', 'Similarity threshold (0-1)', '0.75')
    .option('-e, --event <pattern>', 'Filter to a specific event name pattern')
    .option('-f, --format <fmt>', 'Output format: text | json', 'text')
    .option('-o, --output <file>', 'Write output to file')
    .action(async (versionA: string, versionB: string, opts) => {
      const threshold = parseFloat(opts.threshold);
      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        console.error('Error: --threshold must be a number between 0 and 1');
        process.exit(1);
      }

      try {
        const [rawA, rawB] = await Promise.all([
          cachedFetch(versionA),
          cachedFetch(versionB),
        ]);

        const schemasA = extractEventSchemas(rawA);
        const schemasB = extractEventSchemas(rawB);
        const diffMap = diffEventSchemas(schemasA, schemasB);

        let entries = Object.values(diffMap).flat();

        if (opts.event) {
          const pattern = opts.event.toLowerCase();
          entries = entries.filter(e =>
            e.eventName.toLowerCase().includes(pattern)
          );
        }

        const report = buildSimilarFieldReport(entries, threshold);

        const output =
          opts.format === 'json'
            ? formatSimilarFieldJson(report)
            : formatSimilarFieldReport(report);

        await writeOutput(output, opts.output);
      } catch (err: any) {
        console.error('Error:', err.message ?? err);
        process.exit(1);
      }
    });
}
