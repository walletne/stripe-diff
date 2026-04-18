import { saveBaseline, loadBaseline, compareToBaseline, formatBaselineComparison } from './diffBaseline';
import * as cache from './cache';

jest.mock('./cache');

const mockRead = cache.readCache as jest.Mock;
const mockWrite = cache.writeCache as jest.Mock;

const makeDiffs = (keys: string[]) =>
  Object.fromEntries(keys.map(k => [k, { added: {}, removed: {}, changed: {} }])) as any;

describe('saveBaseline', () => {
  it('writes to cache and returns entry', () => {
    const diffs = makeDiffs(['charge.created']);
    const entry = saveBaseline('2023-01-01', diffs);
    expect(mockWrite).toHaveBeenCalledWith('baseline-2023-01-01', expect.objectContaining({ version: '2023-01-01' }));
    expect(entry.version).toBe('2023-01-01');
    expect(entry.diffs).toBe(diffs);
  });
});

describe('loadBaseline', () => {
  it('returns cached entry', () => {
    const entry = { version: '2023-01-01', savedAt: '', diffs: {} };
    mockRead.mockReturnValue(entry);
    expect(loadBaseline('2023-01-01')).toBe(entry);
  });

  it('returns null if not found', () => {
    mockRead.mockReturnValue(null);
    expect(loadBaseline('2020-01-01')).toBeNull();
  });
});

describe('compareToBaseline', () => {
  it('detects added, removed, changed events', () => {
    const baseline = { version: 'v1', savedAt: '', diffs: makeDiffs(['a', 'b']) };
    const current = makeDiffs(['b', 'c']);
    current['b'] = { added: { x: 'string' }, removed: {}, changed: {} } as any;
    const cmp = compareToBaseline(baseline, current);
    expect(cmp.added).toContain('c');
    expect(cmp.removed).toContain('a');
    expect(cmp.changed).toContain('b');
  });

  it('returns empty arrays when identical', () => {
    const diffs = makeDiffs(['charge.created']);
    const baseline = { version: 'v1', savedAt: '', diffs };
    const cmp = compareToBaseline(baseline, makeDiffs(['charge.created']));
    expect(cmp.added).toHaveLength(0);
    expect(cmp.removed).toHaveLength(0);
    expect(cmp.changed).toHaveLength(0);
  });
});

describe('formatBaselineComparison', () => {
  it('includes summary counts', () => {
    const cmp = { baselineVersion: 'v1', added: ['x'], removed: [], changed: ['y'] };
    const out = formatBaselineComparison(cmp);
    expect(out).toContain('Baseline: v1');
    expect(out).toContain('Added events:   1');
    expect(out).toContain('+ x');
    expect(out).toContain('~ y');
  });
});
