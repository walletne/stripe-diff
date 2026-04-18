import {
  tagDiffEntry,
  buildTagIndex,
  filterByTag,
  formatTagSummary,
  TaggedDiff,
} from './diffTag';

function makeEntry(overrides: Partial<TaggedDiff> = {}): TaggedDiff {
  return {
    tag: 'billing',
    eventName: 'invoice.created',
    version: '2023-10-01',
    field: 'data.object.amount',
    changeType: 'added',
    ...overrides,
  };
}

describe('tagDiffEntry', () => {
  it('creates one entry per tag', () => {
    const entries = tagDiffEntry('invoice.created', '2023-10-01', 'data.object.amount', 'added', ['billing', 'core']);
    expect(entries).toHaveLength(2);
    expect(entries[0].tag).toBe('billing');
    expect(entries[1].tag).toBe('core');
  });

  it('sets all fields correctly', () => {
    const [entry] = tagDiffEntry('charge.updated', '2024-01-01', 'data.object.status', 'removed', ['payments']);
    expect(entry.eventName).toBe('charge.updated');
    expect(entry.changeType).toBe('removed');
  });
});

describe('buildTagIndex', () => {
  it('groups entries by tag', () => {
    const entries = [
      makeEntry({ tag: 'billing' }),
      makeEntry({ tag: 'core' }),
      makeEntry({ tag: 'billing', field: 'data.object.currency' }),
    ];
    const index = buildTagIndex(entries);
    expect(index['billing']).toHaveLength(2);
    expect(index['core']).toHaveLength(1);
  });

  it('returns empty index for no entries', () => {
    expect(buildTagIndex([])).toEqual({});
  });
});

describe('filterByTag', () => {
  it('returns only matching entries', () => {
    const entries = [makeEntry({ tag: 'billing' }), makeEntry({ tag: 'core' })];
    expect(filterByTag(entries, 'billing')).toHaveLength(1);
    expect(filterByTag(entries, 'unknown')).toHaveLength(0);
  });
});

describe('formatTagSummary', () => {
  it('formats a summary with tag headers', () => {
    const index = buildTagIndex([makeEntry()]);
    const output = formatTagSummary(index);
    expect(output).toContain('[billing]');
    expect(output).toContain('invoice.created');
    expect(output).toContain('added');
  });

  it('returns empty string for empty index', () => {
    expect(formatTagSummary({})).toBe('');
  });
});
