import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { saveBaseline, loadBaseline, compareToBaseline, formatBaselineComparison } from './diffBaseline';

export function registerBaselineCommand(program: Command): void {
  const cmd = program.command('baseline');

  cmd
    .command('save <version>')
    .description('Save a baseline snapshot for a Stripe API version')
    .action(async (version: string) => {
      try {
        const schema = await cachedFetch(version);
        const events = extractEventSchemas(schema);
        const diffs: Record<string, any> = {};
        for (const [event, eventSchema] of Object.entries(events)) {
          diffs[event] = diffEventSchemas({}, eventSchema as any);
        }
        const entry = saveBaseline(version, diffs);
        console.log(`Baseline saved for ${entry.version} at ${entry.savedAt}`);
      } catch (err: any) {
        console.error('Error saving baseline:', err.message);
        process.exit(1);
      }
    });

  cmd
    .command('compare <baselineVersion> <currentVersion>')
    .description('Compare a version against a saved baseline')
    .action(async (baselineVersion: string, currentVersion: string) => {
      try {
        const baseline = loadBaseline(baselineVersion);
        if (!baseline) {
          console.error(`No baseline found for ${baselineVersion}. Run 'baseline save' first.`);
          process.exit(1);
        }
        const schema = await cachedFetch(currentVersion);
        const events = extractEventSchemas(schema);
        const diffs: Record<string, any> = {};
        for (const [event, eventSchema] of Object.entries(events)) {
          diffs[event] = diffEventSchemas({}, eventSchema as any);
        }
        const cmp = compareToBaseline(baseline, diffs);
        console.log(formatBaselineComparison(cmp));
      } catch (err: any) {
        console.error('Error comparing baseline:', err.message);
        process.exit(1);
      }
    });
}
