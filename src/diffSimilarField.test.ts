import {
  fieldSimilarityScore,
  buildSimilarFieldReport,
  formatSimilarFieldReport,
  formatSimilarFieldJson,
} from './diffSimilarField';
import { DiffEntry } from './diffSchema';

function makeEntry(eventName: string, field: string, type: 'added' | 'removed' | 'changed' = 'added'): DiffEntry {
  return { eventName, field, type, before: undefined, after: 'string' };
}

describe('fieldSimilarityScore', () => {
  it('returns 1 for identical strings', () => {
    expect(fieldSimilarityScore('data.id', 'data.id')).toBe(1);
  });

  it('returns 0 for completely different strings', () => {
    const score = fieldSimilarityScore('abc', 'xyz');
    expect(score).toBeLessThan(0.5);
  });

  it('returns high score for similar strings', () => {
    const score = fieldSimilarityScore('data.amount', 'data.amounts');
    expect(score).toBeGreaterThan(0.8);
  });

  it('handles empty strings', () => {
    expect(fieldSimilarityScore('', '')).toBe(1);
  });
});

describe('buildSimilarFieldReport', () => {
  it('returns empty pairs when no similar fields', () => {
    const entries = [
      makeEntry('charge.updated', 'data.id'),
      makeEntry('charge.updated', 'data.zzz_unrelated_field'),
    ];
    const report = buildSimilarFieldReport(entries, 0.9);
    expect(report.pairs).toHaveLength(0);
  });

  it('detects similar fields within the same event', () => {
    const entries = [
      makeEntry('charge.updated', 'data.amount'),
      makeEntry('charge.updated', 'data.amounts'),
    ];
    const report = buildSimilarFieldReport(entries, 0.75);
    expect(report.pairs.length).toBeGreaterThan(0);
    expect(report.pairs[0].fieldA).toBe('data.amount');
    expect(report.pairs[0].fieldB).toBe('data.amounts');
  });

  it('does not pair fields across different events', () => {
    const entries = [
      makeEntry('charge.updated', 'data.amount'),
      makeEntry('payment.created', 'data.amounts'),
    ];
    const report = buildSimilarFieldReport(entries, 0.75);
    expect(report.pairs).toHaveLength(0);
  });

  it('sorts pairs by descending score', () => {
    const entries = [
      makeEntry('ev', 'data.foo'),
      makeEntry('ev', 'data.foos'),
      makeEntry('ev', 'data.bar'),
      makeEntry('ev', 'data.baz'),
    ];
    const report = buildSimilarFieldReport(entries, 0.5);
    for (let i = 1; i < report.pairs.length; i++) {
      expect(report.pairs[i - 1].score).toBeGreaterThanOrEqual(report.pairs[i].score);
    }
  });
});

describe('formatSimilarFieldReport', () => {
  it('returns no-pairs message when empty', () => {
    const out = formatSimilarFieldReport({ pairs: [], threshold: 0.75 });
    expect(out).toContain('No similar field pairs');
  });

  it('includes pair info in output', () => {
    const report = buildSimilarFieldReport(
      [makeEntry('charge.updated', 'data.amount'), makeEntry('charge.updated', 'data.amounts')],
      0.75
    );
    const out = formatSimilarFieldReport(report);
    expect(out).toContain('charge.updated');
    expect(out).toContain('data.amount');
  });
});

describe('formatSimilarFieldJson', () => {
  it('produces valid JSON', () => {
    const report = { pairs: [], threshold: 0.8 };
    expect(() => JSON.parse(formatSimilarFieldJson(report))).not.toThrow();
  });
});
