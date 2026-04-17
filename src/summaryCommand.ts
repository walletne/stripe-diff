import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { buildSummaryReport, formatSummaryReport } from './diffSummaryReport';
import { writeOutput } from './outputWriter';

export function registerSummaryCommand(program: Command): void {
  program
    .command('summary <version1> <version2>')
    .description('Print a high-level summary report of schema changes between two Stripe API versions')
    .option('-f, --format <format>', 'Output format: text or json', 'text')
    .option('-o, --output <file>', 'Write output to file instead of stdout')
    .action(async (version1: string, version2: string, opts) => {
      const format = opts.format as 'text' | 'json';

      const [schema1, schema2] = await Promise.all([
        cachedFetch(version1),
        cachedFetch(version2),
      ]);

      const events1 = extractEventSchemas(schema1);
      const events2 = extractEventSchemas(schema2);
      const diffs = diffEventSchemas(events1, events2);

      const report = buildSummaryReport(diffs);
      const output = formatSummaryReport(report, format);

      if (opts.output) {
        await writeOutput(output, opts.output);
        console.log(`Summary written to ${opts.output}`);
      } else {
        console.log(output);
      }
    });
}
