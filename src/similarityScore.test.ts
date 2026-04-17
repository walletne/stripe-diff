import { computeSimilarity, formatSimilarity } from './similarityScore';
import { EventDiff } from './diffSchema';

function makeChange(type: 'added' | 'removed' | 'changed') {
  return { path: 'data.object.field', type, before: 'string', after: 'integer' };
}

function makeDiff(changes: ReturnType<typeof makeChange>[]): EventDiff {
  return { event: 'charge.updated', changes } as any;
}

describe('computeSimilarity', () => {
  it('returns score 1 when there are no diffs', () => {
    const result = computeSimilarity([]);
    expect(result.score).toBe(1);
    expect(result.totalFields).toBe(0);
  });

  it('returns score 1 when all diffs have no changes', () => {
    const result = computeSimilarity([makeDiff([])]);
    expect(result.score).toBe(1);
  });

  it('counts added, removed, changed fields', () => {
    const diff = makeDiff([
      makeChange('added'),
      makeChange('removed'),
      makeChange('changed'),
    ]);
    const result = computeSimilarity([diff]);
    expect(result.addedFields).toBe(1);
    expect(result.removedFields).toBe(1);
    expect(result.changedFields).toBe(1);
  });

  it('score is between 0 and 1', () => {
    const diff = makeDiff([
      makeChange('added'),
      makeChange('removed'),
      makeChange('changed'),
      makeChange('changed'),
    ]);
    const result = computeSimilarity([diff]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('aggregates across multiple diffs', () => {
    const d1 = makeDiff([makeChange('added')]);
    const d2 = makeDiff([makeChange('removed')]);
    const result = computeSimilarity([d1, d2]);
    expect(result.addedFields).toBe(1);
    expect(result.removedFields).toBe(1);
  });
});

describe('formatSimilarity', () => {
  it('formats output with percentage and counts', () => {
    const result = { score: 0.75, totalFields: 20, changedFields: 2, addedFields: 3, removedFields: 0 };
    const output = formatSimilarity(result);
    expect(output).toContain('75.0%');
    expect(output).toContain('Total fields evaluated : 20');
    expect(output).toContain('Changed                : 2');
    expect(output).toContain('Added                  : 3');
    expect(output).toContain('Removed                : 0');
  });
});
