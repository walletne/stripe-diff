import { compareSnapshots, formatSnapshotComparison } from './snapshotCompare';
import { SnapshotEntry } from './diffSnapshot';

const makeEntry = (version: string, events: Record<string, { added: any[]; removed: any[]; changed: any[] }>): SnapshotEntry => ({
  version,
  capturedAt: '2024-01-01T00:00:00.000Z',
  diff: events,
});

const field = (p: string) => ({ path: p, type: 'string' });

test('unchanged when diffs are identical', () => {
  const diff = { 'charge.updated': { added: [field('a')], removed: [], changed: [] } };
  const a = makeEntry('v1..v2', diff);
  const b = makeEntry('v1..v2', diff);
  const cmp = compareSnapshots(a, b);
  expect(cmp.unchanged).toEqual(['charge.updated']);
  expect(cmp.changed).toHaveLength(0);
});

test('detects changed events', () => {
  const a = makeEntry('v1..v2', { 'charge.updated': { added: [field('a')], removed: [], changed: [] } });
  const b = makeEntry('v1..v2', { 'charge.updated': { added: [field('b')], removed: [], changed: [] } });
  const cmp = compareSnapshots(a, b);
  expect(cmp.changed).toContain('charge.updated');
});

test('detects events only in A or B', () => {
  const a = makeEntry('v1..v2', { 'charge.created': { added: [], removed: [], changed: [] } });
  const b = makeEntry('v1..v2', { 'invoice.paid': { added: [], removed: [], changed: [] } });
  const cmp = compareSnapshots(a, b);
  expect(cmp.onlyInA).toContain('charge.created');
  expect(cmp.onlyInB).toContain('invoice.paid');
});

test('formatSnapshotComparison includes version header', () => {
  const a = makeEntry('v1..v2', {});
  const b = makeEntry('v2..v3', {});
  const cmp = compareSnapshots(a, b);
  const out = formatSnapshotComparison(cmp, a, b);
  expect(out).toContain('v1..v2');
  expect(out).toContain('v2..v3');
  expect(out).toContain('Unchanged: 0');
});
