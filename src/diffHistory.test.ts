import { buildHistoryEntry, formatHistoryTable, DiffHistoryEntry } from './diffHistory';
import { EventDiff } from './diffSchema';

function makeDiff(added: string[], removed: string[], changed: string[]): EventDiff {
  return {
    added: added.map(f => ({ field: f, type: 'string' })),
    removed: removed.map(f => ({ field: f, type: 'string' })),
    changed: changed.map(f => ({ field: f, before: { type: 'string' }, after: { type: 'number' } })),
  };
}

describe('buildHistoryEntry', () => {
  it('counts fields across multiple events', () => {
    const diffs = {
      'charge.updated': makeDiff(['a', 'b'], ['c'], ['d']),
      'payment_intent.created': makeDiff(['x'], [], ['y', 'z']),
    };
    const entry = buildHistoryEntry('2023-01-01', '2024-01-01', diffs);
    expect(entry.fromVersion).toBe('2023-01-01');
    expect(entry.toVersion).toBe('2024-01-01');
    expect(entry.eventCount).toBe(2);
    expect(entry.addedFields).toBe(3);
    expect(entry.removedFields).toBe(1);
    expect(entry.changedFields).toBe(3);
  });

  it('handles empty diffs', () => {
    const entry = buildHistoryEntry('2023-01-01', '2024-01-01', {});
    expect(entry.eventCount).toBe(0);
    expect(entry.addedFields).toBe(0);
  });

  it('sets a timestamp', () => {
    const entry = buildHistoryEntry('2023-01-01', '2024-01-01', {});
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('formatHistoryTable', () => {
  it('returns message for empty history', () => {
    expect(formatHistoryTable([])).toContain('No diff history');
  });

  it('renders a table with headers', () => {
    const entries: DiffHistoryEntry[] = [{
      fromVersion: '2023-01-01',
      toVersion: '2024-01-01',
      timestamp: '2024-06-01T00:00:00.000Z',
      eventCount: 5,
      addedFields: 3,
      removedFields: 1,
      changedFields: 2,
    }];
    const output = formatHistoryTable(entries);
    expect(output).toContain('From');
    expect(output).toContain('2023-01-01');
    expect(output).toContain('2024-01-01');
    expect(output).toContain('2024-06-01');
  });
});
