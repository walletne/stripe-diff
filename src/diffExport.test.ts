import { exportDiffToJson, exportDiffToMarkdown, exportDiff } from './diffExport';
import { EventDiff } from './diffSchema';

const makeDiff = (overrides: Partial<EventDiff> = {}): EventDiff => ({
  added: [],
  removed: [],
  changed: [],
  ...overrides,
});

const baseOptions = {
  version1: '2023-08-16',
  version2: '2024-04-10',
  diffs: {
    'charge.updated': makeDiff({ added: ['data.object.new_field'] }),
    'customer.deleted': makeDiff({ removed: ['data.object.old_field'] }),
  },
  format: 'json' as const,
};

describe('exportDiffToJson', () => {
  it('includes version fields', () => {
    const result = exportDiffToJson(baseOptions);
    const parsed = JSON.parse(result);
    expect(parsed.version1).toBe('2023-08-16');
    expect(parsed.version2).toBe('2024-04-10');
  });

  it('includes event keys', () => {
    const result = exportDiffToJson(baseOptions);
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed.events)).toContain('charge.updated');
    expect(Object.keys(parsed.events)).toContain('customer.deleted');
  });

  it('includes added fields', () => {
    const result = exportDiffToJson(baseOptions);
    const parsed = JSON.parse(result);
    expect(parsed.events['charge.updated'].added).toContain('data.object.new_field');
  });
});

describe('exportDiffToMarkdown', () => {
  it('starts with heading', () => {
    const result = exportDiffToMarkdown(baseOptions);
    expect(result).toMatch(/^# Stripe Diff/);
  });

  it('includes event names as headers', () => {
    const result = exportDiffToMarkdown(baseOptions);
    expect(result).toContain('## charge.updated');
    expect(result).toContain('## customer.deleted');
  });
});

describe('exportDiff', () => {
  it('returns json string for json format', () => {
    const result = exportDiff(baseOptions);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('returns markdown for markdown format', () => {
    const result = exportDiff({ ...baseOptions, format: 'markdown' });
    expect(result).toContain('# Stripe Diff');
  });

  it('returns text for text format', () => {
    const result = exportDiff({ ...baseOptions, format: 'text' });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
