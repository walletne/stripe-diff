import { focusDiff, matchesFocusField, getFieldDepth, formatFocusResults, formatFocusJson } from './diffFocus';
import { DiffEntry } from './diffSchema';

function makeEntry(type: 'added' | 'removed' | 'changed'): DiffEntry {
  return { type, before: type === 'added' ? undefined : 'string', after: type === 'removed' ? undefined : 'string' };
}

const sampleDiff: Record<string, Record<string, DiffEntry>> = {
  'charge.updated': {
    'amount': makeEntry('changed'),
    'metadata.key': makeEntry('added'),
    'metadata.nested.deep': makeEntry('removed'),
  },
  'customer.created': {
    'email': makeEntry('added'),
    'address.city': makeEntry('changed'),
  },
};

describe('getFieldDepth', () => {
  it('returns 1 for top-level fields', () => {
    expect(getFieldDepth('amount')).toBe(1);
  });

  it('returns correct depth for nested fields', () => {
    expect(getFieldDepth('metadata.key')).toBe(2);
    expect(getFieldDepth('metadata.nested.deep')).toBe(3);
  });
});

describe('matchesFocusField', () => {
  it('matches exact field', () => {
    expect(matchesFocusField('amount', ['amount'])).toBe(true);
  });

  it('matches wildcard prefix', () => {
    expect(matchesFocusField('metadata.key', ['metadata.*'])).toBe(true);
    expect(matchesFocusField('metadata.nested.deep', ['metadata.*'])).toBe(true);
  });

  it('does not match unrelated field', () => {
    expect(matchesFocusField('email', ['amount'])).toBe(false);
  });

  it('matches prefix path', () => {
    expect(matchesFocusField('address.city', ['address'])).toBe(true);
  });
});

describe('focusDiff', () => {
  it('returns all entries with no options', () => {
    const results = focusDiff(sampleDiff, {});
    expect(results.length).toBe(5);
  });

  it('filters by event', () => {
    const results = focusDiff(sampleDiff, { events: ['charge.updated'] });
    expect(results.every(r => r.event === 'charge.updated')).toBe(true);
    expect(results.length).toBe(3);
  });

  it('filters by depth', () => {
    const results = focusDiff(sampleDiff, { depth: 1 });
    expect(results.every(r => r.depth === 1)).toBe(true);
  });

  it('filters by field pattern', () => {
    const results = focusDiff(sampleDiff, { fields: ['metadata.*'] });
    expect(results.length).toBe(2);
  });

  it('includes depth in result', () => {
    const results = focusDiff(sampleDiff, { events: ['charge.updated'], fields: ['metadata.nested.deep'] });
    expect(results[0].depth).toBe(3);
  });
});

describe('formatFocusResults', () => {
  it('returns message when no results', () => {
    expect(formatFocusResults([])).toBe('No matching fields found.');
  });

  it('formats results with event headers', () => {
    const results = focusDiff(sampleDiff, { events: ['charge.updated'], depth: 1 });
    const output = formatFocusResults(results);
    expect(output).toContain('charge.updated');
    expect(output).toContain('amount');
  });
});

describe('formatFocusJson', () => {
  it('returns valid JSON', () => {
    const results = focusDiff(sampleDiff, {});
    const json = JSON.parse(formatFocusJson(results));
    expect(Array.isArray(json)).toBe(true);
    expect(json[0]).toHaveProperty('event');
    expect(json[0]).toHaveProperty('field');
  });
});
