import { Command } from 'commander';
import * as path from 'path';
import { saveSnapshot, loadSnapshot, listSnapshots, formatSnapshotList } from './diffSnapshot';
import { compareSnapshots, formatSnapshotComparison } from './snapshotCompare';
import { cachedFetch } from './cachedFetch';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas } from './diffSchema';

const DEFAULT_SNAPSHOT_DIR = path.join(process.cwd(), '.stripe-diff-snapshots');

export function registerSnapshotCommand(program: Command): void {
  const snap = program.command('snapshot').description('Manage diff snapshots');

  snap
    .command('save <from> <to>')
    .description('Capture and save a diff snapshot')
    .option('--dir <dir>', 'Snapshot directory', DEFAULT_SNAPSHOT_DIR)
    .action(async (from: string, to: string, opts: { dir: string }) => {
      const [schemaA, schemaB] = await Promise.all([cachedFetch(from), cachedFetch(to)]);
      const eventsA = extractEventSchemas(schemaA);
      const eventsB = extractEventSchemas(schemaB);
      const diff = diffEventSchemas(eventsA, eventsB);
      const filePath = saveSnapshot(opts.dir, from, to, diff);
      console.log(`Snapshot saved: ${filePath}`);
    });

  snap
    .command('list')
    .description('List saved snapshots')
    .option('--dir <dir>', 'Snapshot directory', DEFAULT_SNAPSHOT_DIR)
    .action((opts: { dir: string }) => {
      const snapshots = listSnapshots(opts.dir);
      console.log(formatSnapshotList(snapshots));
    });

  snap
    .command('compare <from1> <to1> <from2> <to2>')
    .description('Compare two saved snapshots')
    .option('--dir <dir>', 'Snapshot directory', DEFAULT_SNAPSHOT_DIR)
    .action((from1: string, to1: string, from2: string, to2: string, opts: { dir: string }) => {
      const a = loadSnapshot(opts.dir, from1, to1);
      const b = loadSnapshot(opts.dir, from2, to2);
      if (!a) { console.error(`Snapshot not found: ${from1}..${to1}`); process.exit(1); }
      if (!b) { console.error(`Snapshot not found: ${from2}..${to2}`); process.exit(1); }
      console.log(formatSnapshotComparison(compareSnapshots(a, b), a, b));
    });
}
