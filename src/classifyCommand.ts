import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { classifyAll, formatClassifyReport, formatClassifyJson } from './diffClassify';
import { writeOutput } from './outputWriter';

export function registerClassifyCommand(program: Command): void {
  program
    .command('classify <version1> <version2>')
    .description('Classify diff changes between two Stripe API versions by change category')
    .option('-e, --event <pattern>', 'Filter by event pattern (e.g. charge.*)')
    .option('-f, --format <fmt>', 'Output format: text or json', 'text')
    .option('-o, --output <file>', 'Write output to file')
    .option('--no-cache', 'Bypass local cache')
    .action(async (version1: string, version2: string, opts) => {
      try {
        const [schema1, schema2] = await Promise.all([
          cachedFetch(version1, opts.cache),
          cachedFetch(version2, opts.cache),
        ]);

        const events1 = extractEventSchemas(schema1);
        const events2 = extractEventSchemas(schema2);
        const diffs = diffEventSchemas(events1, events2);

        let entries = Object.values(diffs).flat();

        if (opts.event) {
          const pattern = opts.event.replace('*', '');
          entries = entries.filter((e) => e.path.startsWith(pattern));
        }

        const classified = classifyAll(entries);

        const output =
          opts.format === 'json'
            ? formatClassifyJson(classified)
            : formatClassifyReport(classified);

        await writeOutput(output, opts.output);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
