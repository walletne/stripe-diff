import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { computeSignature, formatSignature, formatSignatureJson } from './diffSignature';
import { writeOutput } from './outputWriter';

export function registerSignatureCommand(program: Command): void {
  program
    .command('signature <versionA> <versionB>')
    .description('Compute a stable hash signature for a diff between two API versions')
    .option('--event <pattern>', 'Filter to a specific event type')
    .option('--json', 'Output as JSON')
    .option('-o, --output <file>', 'Write output to file')
    .action(async (versionA: string, versionB: string, opts) => {
      const [rawA, rawB] = await Promise.all([
        cachedFetch(versionA),
        cachedFetch(versionB),
      ]);

      const schemasA = extractEventSchemas(rawA);
      const schemasB = extractEventSchemas(rawB);
      const diffs = diffEventSchemas(schemasA, schemasB);

      const filtered: typeof diffs = {};
      for (const [event, entries] of Object.entries(diffs)) {
        if (!opts.event || event.includes(opts.event)) {
          filtered[event] = entries;
        }
      }

      const sig = computeSignature(filtered, versionA, versionB);
      const output = opts.json ? formatSignatureJson(sig) : formatSignature(sig);

      await writeOutput(output, opts.output);
    });
}
