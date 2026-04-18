import { Command } from 'commander';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';
import { buildProfile, formatProfile, formatProfileJson } from './diffProfile';

export function registerProfileCommand(program: Command): void {
  program
    .command('profile <name> <v1> <v2>')
    .description('Build a summary profile of differences between two API versions')
    .option('--json', 'Output as JSON')
    .action(async (name: string, v1: string, v2: string, opts: { json?: boolean }) => {
      try {
        const [schema1, schema2] = await Promise.all([
          cachedFetch(v1),
          cachedFetch(v2),
        ]);
        const events1 = extractEventSchemas(schema1);
        const events2 = extractEventSchemas(schema2);
        const diffs = diffEventSchemas(events1, events2);
        const profile = buildProfile(name, [v1, v2], diffs);
        if (opts.json) {
          console.log(formatProfileJson(profile));
        } else {
          console.log(formatProfile(profile));
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
