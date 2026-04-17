import { computeFieldStats, computeAllFieldStats, formatFieldStats } from './fieldStats';
import { EventDiff } from './diffSchema';

function makeDiff(event: string, changes: { type: 'added' | 'removed' | 'changed'; field: string }[], totalFields = 10): EventDiff {
  return { event, changes: changes.map(c => ({ ...c, before: null, after: null })), totalFields } as unknown as EventDiff;
}

describe('computeFieldStats', () => {
  it('counts changes by type', () => {
    const diff = makeDiff('charge.updated', [
      { type: 'added', field: 'a' },
      { type: 'added', field: 'b' },
      { type: 'removed', field: 'c' },
      { type: 'changed', field: 'd' },
    ], 10);
    const stats = computeFieldStats(diff);
    expect(stats.addedFields).toBe(2);
    expect(stats.removedFields).toBe(1);
    expect(stats.changedFields).toBe(1);
    expect(stats.totalFields).toBe(10);
  });

  it('computes change rate', () => {
    const diff = makeDiff('charge.updated', [{ type: 'added', field: 'x' }], 4);
    const stats = computeFieldStats(diff);
    expect(stats.changeRate).toBe(0.25);
  });

  it('handles zero total fields', () => {
    const diff = makeDiff('charge.updated', [], 0);
    const stats = computeFieldStats(diff);
    expect(stats.changeRate).toBe(0);
  });
});

describe('computeAllFieldStats', () => {
  it('maps diffs to stats', () => {
    const diffs = [
      makeDiff('a.created', [{ type: 'added', field: 'x' }], 5),
      makeDiff('b.deleted', [{ type: 'removed', field: 'y' }], 3),
    ];
    const result = computeAllFieldStats(diffs);
    expect(result).toHaveLength(2);
    expect(result[0].event).toBe('a.created');
    expect(result[1].stats.removedFields).toBe(1);
  });
});

describe('formatFieldStats', () => {
  it('returns message when empty', () => {
    expect(formatFieldStats([])).toBe('No events to report.');
  });

  it('includes event name and stats', () => {
    const stats = computeAllFieldStats([makeDiff('charge.updated', [{ type: 'added', field: 'x' }], 10)]);
    const output = formatFieldStats(stats);
    expect(output).toContain('charge.updated');
    expect(output).toContain('Added');
    expect(output).toContain('10.0%');
  });
});
