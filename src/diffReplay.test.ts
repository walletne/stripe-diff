import {
  buildReplayReport,
  formatReplayReport,
  formatReplayJson,
  ReplayStep,
} from './diffReplay';
import { EventDiff } from './diffSchema';

function makeStep(
  version: string,
  diffs: Record<string, EventDiff> = {}
): ReplayStep {
  return { version, timestamp: '2024-01-01T00:00:00Z', diffs };
}

function makeDiff(
  added: string[] = [],
  removed: string[] = [],
  changed: string[] = []
): EventDiff {
  return {
    added: added.map((f) => ({ field: f, type: 'string' })),
    removed: removed.map((f) => ({ field: f, type: 'string' })),
    changed: changed.map((f) => ({ field: f, before: { type: 'string' }, after: { type: 'integer' } })),
  };
}

describe('buildReplayReport', () => {
  it('returns zero totals for empty steps', () => {
    const report = buildReplayReport([]);
    expect(report.totalChanges).toBe(0);
    expect(report.eventsCovered).toEqual([]);
    expect(report.steps).toHaveLength(0);
  });

  it('counts changes across multiple steps', () => {
    const steps = [
      makeStep('2023-01-01', { 'charge.updated': makeDiff(['a', 'b'], [], ['c']) }),
      makeStep('2023-06-01', { 'invoice.paid': makeDiff([], ['x']) }),
    ];
    const report = buildReplayReport(steps);
    expect(report.totalChanges).toBe(4);
    expect(report.eventsCovered).toEqual(['charge.updated', 'invoice.paid']);
  });

  it('deduplicates events covered across steps', () => {
    const steps = [
      makeStep('2023-01-01', { 'charge.updated': makeDiff(['a']) }),
      makeStep('2023-06-01', { 'charge.updated': makeDiff(['b']) }),
    ];
    const report = buildReplayReport(steps);
    expect(report.eventsCovered).toEqual(['charge.updated']);
  });
});

describe('formatReplayReport', () => {
  it('includes version and timestamp in output', () => {
    const steps = [makeStep('2023-08-01', { 'payment_intent.created': makeDiff(['amount']) })];
    const report = buildReplayReport(steps);
    const output = formatReplayReport(report);
    expect(output).toContain('2023-08-01');
    expect(output).toContain('payment_intent.created');
    expect(output).toContain('+1 added');
  });

  it('shows no changes message when step has empty diffs', () => {
    const steps = [makeStep('2023-01-01', {})];
    const report = buildReplayReport(steps);
    const output = formatReplayReport(report);
    expect(output).toContain('(no changes)');
  });
});

describe('formatReplayJson', () => {
  it('returns valid JSON', () => {
    const report = buildReplayReport([makeStep('2024-01-01')]);
    const json = formatReplayJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.steps).toHaveLength(1);
  });
});
