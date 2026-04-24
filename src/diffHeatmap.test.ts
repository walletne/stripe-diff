import { buildHeatmap, formatHeatmapTable, formatHeatmapJson } from './diffHeatmap';
import { DiffEntry } from './diffSchema';

function makeEntry(field: string, change: 'added' | 'removed' | 'changed'): DiffEntry {
  return {
    field,
    change,
    before: change === 'added' ? undefined : { type: 'string' },
    after: change === 'removed' ? undefined : { type: 'string' },
  };
}

describe('buildHeatmap', () => {
  it('returns empty report for no diffs', () => {
    const report = buildHeatmap({}, ['2023-01-01']);
    expect(report.cells).toHaveLength(0);
    expect(report.maxTotal).toBe(0);
  });

  it('counts changes per object per version', () => {
    const diffs = {
      '2023-01-01': [makeEntry('charge.amount', 'added'), makeEntry('charge.currency', 'removed')],
      '2023-06-01': [makeEntry('invoice.total', 'changed')],
    };
    const report = buildHeatmap(diffs, ['2023-01-01', '2023-06-01']);
    const chargeCell = report.cells.find(c => c.object === 'charge' && c.version === '2023-01-01');
    expect(chargeCell).toBeDefined();
    expect(chargeCell!.total).toBe(2);
    expect(chargeCell!.added).toBe(1);
    expect(chargeCell!.removed).toBe(1);
  });

  it('normalizes intensity between 0 and 1', () => {
    const diffs = {
      '2023-01-01': [
        makeEntry('charge.a', 'added'),
        makeEntry('charge.b', 'added'),
        makeEntry('invoice.x', 'added'),
      ],
    };
    const report = buildHeatmap(diffs, ['2023-01-01']);
    const chargeCell = report.cells.find(c => c.object === 'charge')!;
    const invoiceCell = report.cells.find(c => c.object === 'invoice')!;
    expect(chargeCell.intensity).toBe(1);
    expect(invoiceCell.intensity).toBeCloseTo(0.5);
  });

  it('collects unique objects and versions', () => {
    const diffs = {
      'v1': [makeEntry('payment_intent.status', 'changed')],
      'v2': [makeEntry('charge.amount', 'added')],
    };
    const report = buildHeatmap(diffs, ['v1', 'v2']);
    expect(report.objects).toContain('payment_intent');
    expect(report.objects).toContain('charge');
    expect(report.versions).toEqual(['v1', 'v2']);
  });
});

describe('formatHeatmapTable', () => {
  it('returns fallback for empty report', () => {
    const report = buildHeatmap({}, []);
    expect(formatHeatmapTable(report)).toBe('No data for heatmap.');
  });

  it('renders a table with header and rows', () => {
    const diffs = { '2023-01-01': [makeEntry('charge.amount', 'added')] };
    const report = buildHeatmap(diffs, ['2023-01-01']);
    const output = formatHeatmapTable(report);
    expect(output).toContain('Object');
    expect(output).toContain('charge');
    expect(output).toContain('1');
  });
});

describe('formatHeatmapJson', () => {
  it('returns valid JSON', () => {
    const diffs = { 'v1': [makeEntry('charge.x', 'removed')] };
    const report = buildHeatmap(diffs, ['v1']);
    const json = JSON.parse(formatHeatmapJson(report));
    expect(json.cells).toBeDefined();
    expect(json.maxTotal).toBe(1);
  });
});
