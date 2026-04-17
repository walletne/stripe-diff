import { Command } from 'commander';
import { startWatch, formatWatchOutput } from './watchMode';
import { validateVersions } from './versionList';

export function registerWatchCommand(program: Command): void {
  program
    .command('watch <versionA> <versionB>')
    .description('Poll for Stripe schema changes between two API versions and print diffs')
    .option('-i, --interval <seconds>', 'Polling interval in seconds', '60')
    .action(async (versionA: string, versionB: string, opts: { interval: string }) => {
      const intervalMs = Math.max(5, parseInt(opts.interval, 10)) * 1000;

      try {
        await validateVersions([versionA, versionB]);
      } catch (err) {
        console.error(`Invalid versions: ${(err as Error).message}`);
        process.exit(1);
      }

      console.log(`Watching ${versionA} → ${versionB} every ${intervalMs / 1000}s. Press Ctrl+C to stop.`);

      const handle = await startWatch({
        versionA,
        versionB,
        intervalMs,
        onDiff: (diff, timestamp) => {
          console.log(formatWatchOutput(diff, timestamp));
        },
        onError: (err) => {
          console.error(`[watch error] ${err.message}`);
        },
      });

      process.on('SIGINT', () => {
        handle.stop();
        console.log('\nWatch stopped.');
        process.exit(0);
      });
    });
}
