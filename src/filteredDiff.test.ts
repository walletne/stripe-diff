import { describe, it, expect } from 'vitest';
import { filteredDiff } from './filteredDiff';
import type { EventSchemas } from './parseSchema';

const makeSchemas = (events: Record<string, Record<string, string>>): EventSchemas => {
  const result: EventSchemas = {};
  for (const [event, props] of Object.entries(events)) {
    result[event] = {
      properties: Object.fromEntries(
        Object.entries(props).map(([k, v]) => [k, { type: v }])
      ),
    };
  }
  return result;
};

const schemasA = makeSchemas({
  'charge.created': { id: 'string', amount: 'integer' },
  'charge.updated': { id: 'string', status: 'string' },
  'invoice.paid': { id: 'string', total: 'integer' },
});

const schemasB = makeSchemas({
  'charge.created': { id: 'string', amount: 'integer', currency: 'string' },
  'charge.updated': { id: 'string', status: 'string' },
  'invoice.paid': { id: 'string', total: 'integer', due_date: 'string' },
});

describe('filteredDiff', () => {
  it('returns diffs for all events when no pattern given', () => {
    const result = filteredDiff(schemasA, schemasB);
    expect(result.totalCount).toBe(3);
    expect(result.filteredCount).toBe(3);
  });

  it('filters events by pattern', () => {
    const result = filteredDiff(schemasA, schemasB, { eventPatterns: 'charge.*' });
    expect(result.filteredCount).toBe(2);
    expect(result.matchedEvents).toContain('charge.created');
    expect(result.matchedEvents).not.toContain('invoice.paid');
  });

  it('excludes unchanged events by default', () => {
    const result = filteredDiff(schemasA, schemasB);
    expect(result.diffs['charge.updated']).toBeUndefined();
    expect(result.diffs['charge.created']).toBeDefined();
  });

  it('includes unchanged events when option set', () => {
    const result = filteredDiff(schemasA, schemasB, { includeUnchanged: true });
    expect(result.diffs['charge.updated']).toBeDefined();
  });

  it('reports correct totalCount and filteredCount', () => {
    const result = filteredDiff(schemasA, schemasB, { eventPatterns: 'invoice.*' });
    expect(result.totalCount).toBe(3);
    expect(result.filteredCount).toBe(1);
  });

  it('handles empty schemas gracefully', () => {
    const result = filteredDiff({}, {});
    expect(result.totalCount).toBe(0);
    expect(Object.keys(result.diffs)).toHaveLength(0);
  });
});
