import { buildLineageReport, formatLineageReport, formatLineageJson } from './diffLineage';
import { DiffEntry } from './diffSchema';

function makeEntry(field: string, change: 'added' | 'removed' | 'modified', from?: string, to?: string): DiffEntry {
  return { field, change, from, to } as DiffEntry;
}

describe('buildLineageReport', () => {
  it('returns empty array for no diffs', () => {
    expect(buildLineageReport([])).toEqual([]);
  });

  it('tracks introduced version for added fields', () => {
    const result = buildLineageReport([
      { version: '2023-01-01', entries: [makeEntry('charge.amount', 'added')] },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].nodes[0].introduced).toBe('2023-01-01');
    expect(result[0].nodes[0].removed).toBeNull();
  });

  it('tracks removed version for removed fields', () => {
    const result = buildLineageReport([
      { version: '2023-06-01', entries: [makeEntry('charge.old_field', 'removed')] },
    ]);
    expect(result[0].nodes[0].removed).toBe('2023-06-01');
  });

  it('accumulates type changes across versions', () => {
    const result = buildLineageReport([
      { version: '2023-01-01', entries: [makeEntry('charge.amount', 'modified', 'integer', 'string')] },
      { version: '2023-06-01', entries: [makeEntry('charge.amount', 'modified', 'string', 'number')] },
    ]);
    const node = result[0].nodes[0];
    expect(node.typeChanges).toHaveLength(2);
    expect(node.typeChanges[0]).toEqual({ version: '2023-01-01', from: 'integer', to: 'string' });
    expect(node.typeChanges[1]).toEqual({ version: '2023-06-01', from: 'string', to: 'number' });
  });

  it('handles multiple fields across versions', () => {
    const result = buildLineageReport([
      { version: 'v1', entries: [makeEntry('a.x', 'added'), makeEntry('a.y', 'added')] },
      { version: 'v2', entries: [makeEntry('a.x', 'removed')] },
    ]);
    expect(result).toHaveLength(2);
  });
});

describe('formatLineageReport', () => {
  it('returns fallback for empty report', () => {
    expect(formatLineageReport([])).toContain('No lineage data');
  });

  it('includes field name and introduced version', () => {
    const result = buildLineageReport([
      { version: '2023-01-01', entries: [makeEntry('charge.amount', 'added')] },
    ]);
    const output = formatLineageReport(result);
    expect(output).toContain('charge.amount');
    expect(output).toContain('2023-01-01');
  });
});

describe('formatLineageJson', () => {
  it('produces valid JSON', () => {
    const result = buildLineageReport([
      { version: '2023-01-01', entries: [makeEntry('charge.amount', 'added')] },
    ]);
    const json = JSON.parse(formatLineageJson(result));
    expect(Array.isArray(json)).toBe(true);
    expect(json[0].field).toBe('charge.amount');
  });
});
