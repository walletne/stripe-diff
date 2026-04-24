import { buildDiffMatrix, formatMatrixTable, formatMatrixJson, emptyCell } from './diffMatrix';
import { DiffEntry } from './diffSchema';

function makeEntry(event: string, type: 'added' | 'removed' | 'changed', field = 'data.id'): DiffEntry {
  return { event, field, type, before: 'string', after: 'string' };
}

describe('emptyCell', () => {
  it('returns zeroed cell', () => {
    expect(emptyCell()).toEqual({ added: 0, removed: 0, changed: 0, total: 0 });
  });
});

describe('buildDiffMatrix', () => {
  it('builds matrix with correct cell counts', () => {
    const diffs = {
      '2023-01-01': [
        makeEntry('charge.created', 'added'),
        makeEntry('charge.created', 'removed'),
        makeEntry('payment_intent.succeeded', 'changed'),
      ],
      '2023-06-01': [
        makeEntry('charge.created', 'added'),
      ],
    };
    const matrix = buildDiffMatrix(diffs);
    expect(matrix.versions).toEqual(['2023-01-01', '2023-06-01']);
    expect(matrix.events).toContain('charge.created');
    expect(matrix.events).toContain('payment_intent.succeeded');
    expect(matrix.cells['2023-01-01']['charge.created'].added).toBe(1);
    expect(matrix.cells['2023-01-01']['charge.created'].removed).toBe(1);
    expect(matrix.cells['2023-01-01']['charge.created'].total).toBe(2);
    expect(matrix.cells['2023-01-01']['payment_intent.succeeded'].changed).toBe(1);
    expect(matrix.cells['2023-06-01']['charge.created'].added).toBe(1);
    expect(matrix.cells['2023-06-01']['payment_intent.succeeded'].total).toBe(0);
  });

  it('returns empty structure for empty input', () => {
    const matrix = buildDiffMatrix({});
    expect(matrix.versions).toEqual([]);
    expect(matrix.events).toEqual([]);
  });

  it('sorts events alphabetically', () => {
    const diffs = {
      'v1': [makeEntry('z.event', 'added'), makeEntry('a.event', 'removed')],
    };
    const matrix = buildDiffMatrix(diffs);
    expect(matrix.events[0]).toBe('a.event');
    expect(matrix.events[1]).toBe('z.event');
  });
});

describe('formatMatrixTable', () => {
  it('returns no-data message for empty matrix', () => {
    const matrix = buildDiffMatrix({});
    expect(formatMatrixTable(matrix)).toBe('No data available.');
  });

  it('includes version and event headers', () => {
    const diffs = { '2024-01-01': [makeEntry('charge.created', 'added')] };
    const matrix = buildDiffMatrix(diffs);
    const output = formatMatrixTable(matrix);
    expect(output).toContain('2024-01-01');
    expect(output).toContain('charge.created');
  });

  it('shows dash for zero-change cells', () => {
    const diffs = {
      'v1': [makeEntry('charge.created', 'added')],
      'v2': [],
    };
    const matrix = buildDiffMatrix(diffs);
    const output = formatMatrixTable(matrix);
    expect(output).toContain('-');
  });
});

describe('formatMatrixJson', () => {
  it('returns valid JSON', () => {
    const diffs = { 'v1': [makeEntry('charge.created', 'added')] };
    const matrix = buildDiffMatrix(diffs);
    const json = JSON.parse(formatMatrixJson(matrix));
    expect(json.versions).toContain('v1');
    expect(json.events).toContain('charge.created');
  });
});
