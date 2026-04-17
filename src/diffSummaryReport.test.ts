import { buildSummaryReport, formatSummaryReport } from './diffSummaryReport';
import { EventDiff } from './diffSchema';

function makeDiff(changes: { type: 'added' | 'removed' | 'changed'; path: string }[]): EventDiff {
  return {
    changes: changes.map(c => ({ ...c, before: 'string', after: 'string' })),
  };
}

describe('buildSummaryReport', () => {
  it('counts fields correctly across events', () => {
    const diffs = {
      'charge.updated': makeDiff([
        { type: 'added', path: 'data.object.metadata' },
        { type: 'removed', path: 'data.object.old_field' },
      ]),
      'payment_intent.created': makeDiff([
        { type: 'changed', path: 'data.object.amount' },
      ]),
    };

    const report = buildSummaryReport(diffs);
    expect(report.totalEvents).toBe(2);
    expect(report.addedFields).toBe(1);
    expect(report.removedFields).toBe(1);
    expect(report.changedFields).toBe(1);
    expect(report.breakingCount).toBe(2);
  });

  it('returns zero counts for empty diffs', () => {
    const report = buildSummaryReport({});
    expect(report.totalEvents).toBe(0);
    expect(report.addedFields).toBe(0);
    expect(report.breakingCount).toBe(0);
  });

  it('populates byEvent correctly', () => {
    const diffs = {
      'invoice.paid': makeDiff([{ type: 'added', path: 'data.object.x' }]),
    };
    const report = buildSummaryReport(diffs);
    expect(report.byEvent['invoice.paid']).toEqual({ added: 1, removed: 0, changed: 0 });
  });
});

describe('formatSummaryReport', () => {
  const diffs = {
    'charge.updated': makeDiff([{ type: 'removed', path: 'data.object.foo' }]),
  };

  it('formats as text', () => {
    const report = buildSummaryReport(diffs);
    const output = formatSummaryReport(report, 'text');
    expect(output).toContain('Summary Report');
    expect(output).toContain('charge.updated');
    expect(output).toContain('-1');
  });

  it('formats as json', () => {
    const report = buildSummaryReport(diffs);
    const output = formatSummaryReport(report, 'json');
    const parsed = JSON.parse(output);
    expect(parsed.totalEvents).toBe(1);
    expect(parsed.removedFields).toBe(1);
  });
});
