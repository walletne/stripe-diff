import {
  buildTimelinePoint,
  buildTimelineReport,
  formatTimelineReport,
  formatTimelineJson,
} from './diffTimeline';
import { DiffEntry } from './diffSchema';

function makeEntry(
  event: string,
  field: string,
  change: 'added' | 'removed' | 'changed'
): DiffEntry {
  return { event, field, change, before: 'string', after: 'string' };
}

const v1Entries: DiffEntry[] = [
  makeEntry('charge.created', 'amount', 'added'),
  makeEntry('charge.created', 'currency', 'added'),
  makeEntry('customer.deleted', 'email', 'removed'),
];

const v2Entries: DiffEntry[] = [
  makeEntry('charge.updated', 'status', 'changed'),
];

describe('buildTimelinePoint', () => {
  it('counts changes by type', () => {
    const point = buildTimelinePoint('2023-01-01', v1Entries);
    expect(point.version).toBe('2023-01-01');
    expect(point.added).toBe(2);
    expect(point.removed).toBe(1);
    expect(point.changed).toBe(0);
  });

  it('deduplicates events', () => {
    const point = buildTimelinePoint('2023-01-01', v1Entries);
    expect(point.events).toContain('charge.created');
    expect(point.events).toContain('customer.deleted');
    expect(point.events.length).toBe(2);
  });
});

describe('buildTimelineReport', () => {
  it('builds report from versioned entries', () => {
    const report = buildTimelineReport({
      '2023-01-01': v1Entries,
      '2023-06-01': v2Entries,
    });
    expect(report.totalVersions).toBe(2);
    expect(report.points.length).toBe(2);
    expect(report.mostActiveVersion).toBe('2023-01-01');
    expect(report.mostActiveCount).toBe(3);
  });

  it('handles empty input', () => {
    const report = buildTimelineReport({});
    expect(report.totalVersions).toBe(0);
    expect(report.mostActiveVersion).toBeNull();
  });
});

describe('formatTimelineReport', () => {
  it('returns fallback for empty report', () => {
    const report = buildTimelineReport({});
    expect(formatTimelineReport(report)).toBe('No timeline data available.');
  });

  it('includes version lines and summary', () => {
    const report = buildTimelineReport({ '2023-01-01': v1Entries });
    const output = formatTimelineReport(report);
    expect(output).toContain('2023-01-01');
    expect(output).toContain('+2');
    expect(output).toContain('Most active');
  });
});

describe('formatTimelineJson', () => {
  it('returns valid JSON', () => {
    const report = buildTimelineReport({ '2023-01-01': v1Entries });
    const json = JSON.parse(formatTimelineJson(report));
    expect(json.totalVersions).toBe(1);
    expect(Array.isArray(json.points)).toBe(true);
  });
});
