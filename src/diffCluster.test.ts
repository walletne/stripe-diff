import { clusterDiff, formatClusterReport, formatClusterJson } from './diffCluster';
import { DiffEntry } from './diffAnnotations';

function makeEntry(path: string, type: 'added' | 'removed' | 'changed'): DiffEntry {
  return {
    change: { path, type, before: 'string', after: 'number' },
    severity: 'info',
    tags: [],
  };
}

describe('clusterDiff', () => {
  const entries: DiffEntry[] = [
    makeEntry('charge.amount', 'added'),
    makeEntry('charge.currency', 'added'),
    makeEntry('customer.email', 'removed'),
    makeEntry('charge.status', 'changed'),
    makeEntry('invoice.lines.data.amount', 'changed'),
  ];

  it('clusters by type', () => {
    const report = clusterDiff(entries, 'type');
    expect(report.strategy).toBe('type');
    expect(report.totalEntries).toBe(5);
    const labels = report.groups.map((g) => g.label);
    expect(labels).toContain('added');
    expect(labels).toContain('removed');
    expect(labels).toContain('changed');
  });

  it('clusters by depth', () => {
    const report = clusterDiff(entries, 'depth');
    const labels = report.groups.map((g) => g.label);
    expect(labels).toContain('mid (depth 2-3)');
    expect(labels).toContain('deep (depth 4+)');
  });

  it('clusters by object', () => {
    const report = clusterDiff(entries, 'object');
    const labels = report.groups.map((g) => g.label);
    expect(labels).toContain('charge');
    expect(labels).toContain('customer');
    expect(labels).toContain('invoice');
  });

  it('sorts groups by size descending', () => {
    const report = clusterDiff(entries, 'object');
    const sizes = report.groups.map((g) => g.size);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i - 1]).toBeGreaterThanOrEqual(sizes[i]);
    }
  });

  it('handles empty entries', () => {
    const report = clusterDiff([], 'type');
    expect(report.groups).toHaveLength(0);
    expect(report.totalEntries).toBe(0);
  });
});

describe('formatClusterReport', () => {
  it('includes strategy and total entries', () => {
    const report = clusterDiff([makeEntry('charge.amount', 'added')], 'type');
    const output = formatClusterReport(report);
    expect(output).toContain('strategy: type');
    expect(output).toContain('Total entries: 1');
    expect(output).toContain('charge.amount');
  });
});

describe('formatClusterJson', () => {
  it('returns valid JSON', () => {
    const report = clusterDiff([makeEntry('a.b', 'removed')], 'depth');
    const json = JSON.parse(formatClusterJson(report));
    expect(json.strategy).toBe('depth');
    expect(Array.isArray(json.groups)).toBe(true);
  });
});
