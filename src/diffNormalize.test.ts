import { normalizeDiff, formatNormalized } from './diffNormalize';
import type { DiffEntry } from './diffSchema';

function makeEntry(event: string, field: string, type: 'added' | 'removed' | 'changed'): DiffEntry {
  return { event, field, type, before: null, after: null };
}

describe('normalizeDiff', () => {
  it('sorts entries by event then field by default', () => {
    const entries = [
      makeEntry('payment_intent.created', 'amount', 'added'),
      makeEntry('charge.updated', 'status', 'changed'),
      makeEntry('charge.updated', 'amount', 'removed'),
    ];
    const result = normalizeDiff(entries);
    expect(result[0].event).toBe('charge.updated');
    expect(result[0].field).toBe('amount');
    expect(result[1].field).toBe('status');
    expect(result[2].event).toBe('payment_intent.created');
  });

  it('sorts by field when sortBy=field', () => {
    const entries = [
      makeEntry('charge.updated', 'status', 'changed'),
      makeEntry('charge.updated', 'amount', 'added'),
    ];
    const result = normalizeDiff(entries, { sortBy: 'field' });
    expect(result[0].field).toBe('amount');
    expect(result[1].field).toBe('status');
  });

  it('deduplicates entries with same event+field+type', () => {
    const entries = [
      makeEntry('charge.updated', 'amount', 'added'),
      makeEntry('charge.updated', 'amount', 'added'),
    ];
    const result = normalizeDiff(entries, { deduplicate: true });
    expect(result).toHaveLength(1);
  });

  it('keeps duplicates when deduplicate=false', () => {
    const entries = [
      makeEntry('charge.updated', 'amount', 'added'),
      makeEntry('charge.updated', 'amount', 'added'),
    ];
    const result = normalizeDiff(entries, { deduplicate: false });
    expect(result).toHaveLength(2);
  });

  it('strips metadata fields when stripMetadata=true', () => {
    const entries = [
      makeEntry('charge.updated', 'data.object.id', 'changed'),
      makeEntry('charge.updated', 'data.object.amount', 'added'),
      makeEntry('charge.updated', 'data.object.created', 'removed'),
    ];
    const result = normalizeDiff(entries, { stripMetadata: true });
    expect(result).toHaveLength(1);
    expect(result[0].field).toBe('data.object.amount');
  });
});

describe('formatNormalized', () => {
  it('returns a message for empty entries', () => {
    expect(formatNormalized([])).toContain('No diff entries');
  });

  it('formats entries with type, event, and field', () => {
    const entries = [makeEntry('charge.updated', 'amount', 'added')];
    const output = formatNormalized(entries);
    expect(output).toContain('[ADDED]');
    expect(output).toContain('charge.updated');
    expect(output).toContain('amount');
  });
});
