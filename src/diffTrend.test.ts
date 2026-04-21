import { buildTrendPoint, buildTrendReport, formatTrendReport, formatTrendJson, TrendPoint } from './diffTrend';
import { DiffEntry } from './diffSchema';

function makeEntries(added: number, removed: number, changed: number): DiffEntry[] {
  const entries: DiffEntry[] = [];
  for (let i = 0; i < added; i++) entries.push({ type: 'added', path: `field_a${i}`, value: 'string' });
  for (let i = 0; i < removed; i++) entries.push({ type: 'removed', path: `field_r${i}`, value: 'string' });
  for (let i = 0; i < changed; i++) entries.push({ type: 'changed', path: `field_c${i}`, before: 'string', after: 'integer' });
  return entries;
}

describe('buildTrendPoint', () => {
  it('counts changes per type', () => {
    const diffs = { 'charge.updated': makeEntries(2, 1, 3) };
    const point = buildTrendPoint('2023-01-01', diffs);
    expect(point.added).toBe(2);
    expect(point.removed).toBe(1);
    expect(point.changed).toBe(3);
    expect(point.total).toBe(6);
    expect(point.version).toBe('2023-01-01');
  });

  it('handles empty diffs', () => {
    const point = buildTrendPoint('2023-01-01', {});
    expect(point.total).toBe(0);
  });
});

describe('buildTrendReport', () => {
  it('identifies most volatile event', () => {
    const points: TrendPoint[] = [{ version: '2023-01-01', added: 5, removed: 2, changed: 1, total: 8 }];
    const diffs = {
      '2023-01-01': {
        'charge.updated': makeEntries(5, 2, 1),
        'customer.created': makeEntries(1, 0, 0),
      },
    };
    const report = buildTrendReport(points, diffs);
    expect(report.mostVolatileEvent).toBe('charge.updated');
  });

  it('computes average changes per version', () => {
    const points: TrendPoint[] = [
      { version: 'v1', added: 4, removed: 0, changed: 0, total: 4 },
      { version: 'v2', added: 2, removed: 0, changed: 0, total: 2 },
    ];
    const report = buildTrendReport(points, {});
    expect(report.averageChangesPerVersion).toBe(3);
  });

  it('returns null for most volatile event when no diffs', () => {
    const report = buildTrendReport([], {});
    expect(report.mostVolatileEvent).toBeNull();
    expect(report.averageChangesPerVersion).toBe(0);
  });
});

describe('formatTrendReport', () => {
  it('renders markdown table', () => {
    const report = { points: [{ version: '2023-01-01', added: 1, removed: 0, changed: 2, total: 3 }], mostVolatileEvent: 'charge.updated', averageChangesPerVersion: 3 };
    const output = formatTrendReport(report);
    expect(output).toContain('## Diff Trend Report');
    expect(output).toContain('2023-01-01');
    expect(output).toContain('charge.updated');
  });
});

describe('formatTrendJson', () => {
  it('returns valid JSON', () => {
    const report = { points: [], mostVolatileEvent: null, averageChangesPerVersion: 0 };
    const json = JSON.parse(formatTrendJson(report));
    expect(json.points).toEqual([]);
  });
});
