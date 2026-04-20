import { scoreDiff, buildDiffScoreReport, formatDiffScoreReport, formatDiffScoreJson } from './diffScore';
import { DiffResult } from './diffSchema';

function makeDiff(added: string[], removed: string[], changed: string[]): DiffResult {
  return {
    added: added.map(f => ({ field: f, type: 'string' })),
    removed: removed.map(f => ({ field: f, type: 'string' })),
    changed: changed.map(f => ({ field: f, from: 'string', to: 'integer' })),
  };
}

describe('scoreDiff', () => {
  it('returns zero score for empty diff', () => {
    const score = scoreDiff('charge.created', makeDiff([], [], []));
    expect(score.score).toBe(0);
    expect(score.total).toBe(0);
  });

  it('scores added fields', () => {
    const score = scoreDiff('charge.created', makeDiff(['a', 'b'], [], []));
    expect(score.added).toBe(2);
    expect(score.score).toBeGreaterThan(0);
  });

  it('scores removed fields higher than added', () => {
    const s1 = scoreDiff('e', makeDiff(['a'], [], []));
    const s2 = scoreDiff('e', makeDiff([], ['a'], []));
    expect(s2.score).toBeGreaterThan(s1.score);
  });

  it('caps score at 100', () => {
    const score = scoreDiff('e', makeDiff(Array(50).fill('x'), Array(50).fill('y'), Array(50).fill('z')));
    expect(score.score).toBeLessThanOrEqual(100);
  });
});

describe('buildDiffScoreReport', () => {
  it('handles empty input', () => {
    const report = buildDiffScoreReport({});
    expect(report.scores).toHaveLength(0);
    expect(report.mostChanged).toBeNull();
    expect(report.leastChanged).toBeNull();
    expect(report.averageScore).toBe(0);
  });

  it('identifies most and least changed events', () => {
    const diffs = {
      'charge.created': makeDiff(['a', 'b'], ['c'], []),
      'payment.failed': makeDiff([], [], []),
    };
    const report = buildDiffScoreReport(diffs);
    expect(report.mostChanged).toBe('charge.created');
    expect(report.leastChanged).toBe('payment.failed');
  });

  it('computes average score', () => {
    const diffs = {
      'a.b': makeDiff(['x'], [], []),
      'c.d': makeDiff([], [], []),
    };
    const report = buildDiffScoreReport(diffs);
    expect(report.averageScore).toBeGreaterThanOrEqual(0);
  });
});

describe('formatDiffScoreReport', () => {
  it('returns no events message for empty report', () => {
    const report = buildDiffScoreReport({});
    expect(formatDiffScoreReport(report)).toBe('No events scored.');
  });

  it('includes event names and score bar', () => {
    const diffs = { 'charge.created': makeDiff(['a'], [], []) };
    const report = buildDiffScoreReport(diffs);
    const output = formatDiffScoreReport(report);
    expect(output).toContain('charge.created');
    expect(output).toContain('/100');
  });
});

describe('formatDiffScoreJson', () => {
  it('returns valid JSON', () => {
    const report = buildDiffScoreReport({});
    const json = formatDiffScoreJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
