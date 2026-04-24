import { buildPivotTable, formatPivotTable, formatPivotJson } from './diffPivot';
import type { DiffEntry } from './diffSchema';

function makeEntry(
  field: string,
  change: 'added' | 'removed' | 'changed'
): DiffEntry {
  return { field, change, before: 'string', after: 'string' };
}

const entries: DiffEntry[] = [
  makeEntry('charge.amount', 'added'),
  makeEntry('charge.currency', 'removed'),
  makeEntry('charge.status', 'changed'),
  makeEntry('invoice.total', 'added'),
  makeEntry('invoice.lines.amount', 'changed'),
  makeEntry('refund', 'removed'),
];

describe('buildPivotTable', () => {
  it('groups entries by object and type', () => {
    const table = buildPivotTable(entries, 'object', 'type');
    expect(table['charge']['added'].total).toBe(1);
    expect(table['charge']['removed'].total).toBe(1);
    expect(table['charge']['changed'].total).toBe(1);
    expect(table['invoice']['added'].total).toBe(1);
    expect(table['invoice']['changed'].total).toBe(1);
    expect(table['refund']['removed'].total).toBe(1);
  });

  it('groups entries by depth and type', () => {
    const table = buildPivotTable(entries, 'depth', 'type');
    expect(table['top-level']).toBeDefined();
    expect(table['nested']).toBeDefined();
    expect(table['deep']).toBeDefined();
  });

  it('returns empty table for no entries', () => {
    const table = buildPivotTable([]);
    expect(Object.keys(table)).toHaveLength(0);
  });

  it('increments correct counters per change type', () => {
    const table = buildPivotTable(entries, 'object', 'type');
    expect(table['charge']['added'].added).toBe(1);
    expect(table['charge']['removed'].removed).toBe(1);
    expect(table['charge']['changed'].changed).toBe(1);
  });
});

describe('formatPivotTable', () => {
  it('returns no-data message for empty table', () => {
    expect(formatPivotTable({})).toBe('No data to pivot.');
  });

  it('renders header and rows', () => {
    const table = buildPivotTable(entries, 'object', 'type');
    const output = formatPivotTable(table);
    expect(output).toContain('charge');
    expect(output).toContain('invoice');
    expect(output).toContain('added');
    expect(output).toContain('removed');
  });
});

describe('formatPivotJson', () => {
  it('returns valid JSON', () => {
    const table = buildPivotTable(entries, 'object', 'type');
    const json = formatPivotJson(table);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed['charge']).toBeDefined();
  });
});
