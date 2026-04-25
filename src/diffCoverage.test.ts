import { buildCoverageReport, formatCoverageReport, formatCoverageJson } from './diffCoverage';
import { DiffEntry } from './diffSchema';

function makeEntry(change: 'added' | 'removed' | 'modified', field: string): DiffEntry {
  return {
    field,
    change,
    before: change === 'added' ? undefined : 'string',
    after: change === 'removed' ? undefined : 'string',
  };
}

const allEvents = ['charge.created', 'charge.updated', 'invoice.paid', 'customer.deleted'];

const diffs: Record<string, DiffEntry[]> = {
  'charge.created': [makeEntry('added', 'data.object.new_field')],
  'charge.updated': [
    makeEntry('removed', 'data.object.old_field'),
    makeEntry('modified', 'data.object.amount'),
  ],
  'invoice.paid': [],
  'customer.deleted': [],
};

describe('buildCoverageReport', () => {
  it('counts total events correctly', () => {
    const report = buildCoverageReport(allEvents, diffs);
    expect(report.totalEvents).toBe(4);
  });

  it('identifies changed vs unchanged events', () => {
    const report = buildCoverageReport(allEvents, diffs);
    expect(report.changedEvents).toEqual(['charge.created', 'charge.updated']);
    expect(report.unchangedEvents).toContain('invoice.paid');
    expect(report.unchangedEvents).toContain('customer.deleted');
  });

  it('counts field changes by type', () => {
    const report = buildCoverageReport(allEvents, diffs);
    expect(report.addedFields).toBe(1);
    expect(report.removedFields).toBe(1);
    expect(report.modifiedFields).toBe(1);
  });

  it('computes coverage percent', () => {
    const report = buildCoverageReport(allEvents, diffs);
    expect(report.coveragePercent).toBe(50);
  });

  it('returns 0% coverage when no events', () => {
    const report = buildCoverageReport([], {});
    expect(report.coveragePercent).toBe(0);
    expect(report.totalEvents).toBe(0);
  });
});

describe('formatCoverageReport', () => {
  it('includes key stats in output', () => {
    const report = buildCoverageReport(allEvents, diffs);
    const output = formatCoverageReport(report);
    expect(output).toContain('Coverage Report');
    expect(output).toContain('Total events:    4');
    expect(output).toContain('50%');
    expect(output).toContain('charge.created');
  });
});

describe('formatCoverageJson', () => {
  it('returns valid JSON', () => {
    const report = buildCoverageReport(allEvents, diffs);
    const json = formatCoverageJson(report);
    const parsed = JSON.parse(json);
    expect(parsed.totalEvents).toBe(4);
    expect(parsed.coveragePercent).toBe(50);
  });
});
