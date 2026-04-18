import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { saveSnapshot, loadSnapshot, listSnapshots, formatSnapshotList } from './diffSnapshot';
import { EventSchemaDiff } from './diffSchema';

const makeDiff = (): EventSchemaDiff => ({
  'charge.updated': {
    added: [{ path: 'data.object.amount', type: 'integer' }],
    removed: [],
    changed: [],
  },
});

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stripe-diff-snap-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('saveSnapshot writes file and loadSnapshot reads it back', () => {
  const diff = makeDiff();
  const filePath = saveSnapshot(tmpDir, '2023-01-01', '2024-01-01', diff);
  expect(fs.existsSync(filePath)).toBe(true);
  const entry = loadSnapshot(tmpDir, '2023-01-01', '2024-01-01');
  expect(entry).not.toBeNull();
  expect(entry!.version).toBe('2023-01-01..2024-01-01');
  expect(entry!.diff).toEqual(diff);
});

test('loadSnapshot returns null when file missing', () => {
  const result = loadSnapshot(tmpDir, '2020-01-01', '2021-01-01');
  expect(result).toBeNull();
});

test('listSnapshots returns saved snapshots', () => {
  saveSnapshot(tmpDir, '2023-01-01', '2024-01-01', makeDiff());
  saveSnapshot(tmpDir, '2022-01-01', '2023-01-01', makeDiff());
  const list = listSnapshots(tmpDir);
  expect(list).toHaveLength(2);
});

test('listSnapshots returns empty array when dir missing', () => {
  expect(listSnapshots('/nonexistent/dir')).toEqual([]);
});

test('formatSnapshotList formats entries', () => {
  const result = formatSnapshotList(['2023-01-01__2024-01-01.json']);
  expect(result).toContain('2023-01-01 → 2024-01-01');
});

test('formatSnapshotList handles empty list', () => {
  expect(formatSnapshotList([])).toBe('No snapshots found.');
});

test('saveSnapshot overwrites existing snapshot with same versions', () => {
  const diff1 = makeDiff();
  saveSnapshot(tmpDir, '2023-01-01', '2024-01-01', diff1);

  const diff2: EventSchemaDiff = {
    'payment_intent.created': {
      added: [],
      removed: [{ path: 'data.object.currency', type: 'string' }],
      changed: [],
    },
  };
  saveSnapshot(tmpDir, '2023-01-01', '2024-01-01', diff2);

  const entry = loadSnapshot(tmpDir, '2023-01-01', '2024-01-01');
  expect(entry).not.toBeNull();
  expect(entry!.diff).toEqual(diff2);
  expect(listSnapshots(tmpDir)).toHaveLength(1);
});
