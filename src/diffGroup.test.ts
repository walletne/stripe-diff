import { groupDiffByObject, formatGroupedDiff, formatGroupedDiffJson } from './diffGroup';
import { EventDiff } from './diffSchema';

function makeDiff(added: string[] = [], removed: string[] = [], changed: string[] = []): EventDiff {
  return {
    added: added.map(f => ({ field: f, type: 'string' })),
    removed: removed.map(f => ({ field: f, type: 'string' })),
    changed: changed.map(f => ({ field: f, before: { type: 'string' }, after: { type: 'integer' } })),
  };
}

describe('groupDiffByObject', () => {
  it('groups events by object prefix', () => {
    const diff = {
      'charge.created': makeDiff(['a']),
      'charge.updated': makeDiff([], ['b']),
      'customer.created': makeDiff(['c']),
    };
    const groups = groupDiffByObject(diff);
    expect(groups).toHaveLength(2);
    expect(groups[0].object).toBe('charge');
    expect(groups[1].object).toBe('customer');
  });

  it('returns empty array for empty diff', () => {
    expect(groupDiffByObject({})).toEqual([]);
  });

  it('groups unknown events under other', () => {
    const diff = { 'ping': makeDiff(['x']) };
    const groups = groupDiffByObject(diff);
    expect(groups[0].object).toBe('other');
  });
});

describe('formatGroupedDiff', () => {
  it('returns no changes message for empty groups', () => {
    expect(formatGroupedDiff([])).toBe('No changes found.');
  });

  it('formats groups with counts', () => {
    const diff = { 'charge.created': makeDiff(['a', 'b'], ['c']) };
    const groups = groupDiffByObject(diff);
    const output = formatGroupedDiff(groups);
    expect(output).toContain('## charge');
    expect(output).toContain('+2 -1 ~0');
  });
});

describe('formatGroupedDiffJson', () => {
  it('returns valid JSON', () => {
    const diff = { 'invoice.paid': makeDiff(['amount']) };
    const groups = groupDiffByObject(diff);
    const json = JSON.parse(formatGroupedDiffJson(groups));
    expect(Array.isArray(json)).toBe(true);
    expect(json[0].object).toBe('invoice');
  });
});
