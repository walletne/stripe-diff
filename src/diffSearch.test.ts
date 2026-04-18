import { searchDiff, formatSearchResults, SearchResult } from './diffSearch';
import { FieldDiff } from './diffSchema';

const makeChange = (field: string, oldType?: string, newType?: string): FieldDiff => ({
  field,
  oldType: oldType ?? null,
  newType: newType ?? null,
  kind: oldType && newType ? 'changed' : oldType ? 'removed' : 'added',
});

const diffs: Record<string, FieldDiff[]> = {
  'charge.updated': [
    makeChange('amount', 'integer', 'number'),
    makeChange('currency', 'string', 'string'),
  ],
  'customer.deleted': [
    makeChange('email', 'string', undefined),
    makeChange('metadata', 'object', 'hash'),
  ],
};

describe('searchDiff', () => {
  it('finds matches by field name', () => {
    const results = searchDiff(diffs, { query: 'email' });
    expect(results).toHaveLength(1);
    expect(results[0].fieldPath).toBe('email');
    expect(results[0].eventName).toBe('customer.deleted');
  });

  it('finds matches by type', () => {
    const results = searchDiff(diffs, { query: 'hash', searchIn: ['type'] });
    expect(results).toHaveLength(1);
    expect(results[0].matchedOn).toBe('type');
  });

  it('is case-insensitive by default', () => {
    const results = searchDiff(diffs, { query: 'AMOUNT' });
    expect(results).toHaveLength(1);
  });

  it('respects caseSensitive flag', () => {
    const results = searchDiff(diffs, { query: 'AMOUNT', caseSensitive: true });
    expect(results).toHaveLength(0);
  });

  it('returns empty array when no matches', () => {
    const results = searchDiff(diffs, { query: 'nonexistent' });
    expect(results).toHaveLength(0);
  });

  it('searches across multiple events', () => {
    const results = searchDiff(diffs, { query: 'object', searchIn: ['type'] });
    expect(results).toHaveLength(1);
    expect(results[0].eventName).toBe('customer.deleted');
  });
});

describe('formatSearchResults', () => {
  it('returns no-match message for empty results', () => {
    expect(formatSearchResults([])).toContain('No matches found.');
  });

  it('formats results with event and field info', () => {
    const results = searchDiff(diffs, { query: 'amount' });
    const output = formatSearchResults(results);
    expect(output).toContain('charge.updated');
    expect(output).toContain('amount');
    expect(output).toContain('integer');
  });
});
