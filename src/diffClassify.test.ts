import {
  classifyChange,
  classifyAll,
  groupByCategory,
  formatClassifyReport,
  formatClassifyJson,
  labelChange,
} from './diffClassify';
import { DiffEntry } from './diffSchema';

function makeEntry(overrides: Partial<DiffEntry> = {}): DiffEntry {
  return {
    path: 'charge.amount',
    type: 'changed',
    oldValue: 'integer',
    newValue: 'number',
    ...overrides,
  } as DiffEntry;
}

describe('classifyChange', () => {
  it('classifies added as field-addition', () => {
    expect(classifyChange(makeEntry({ type: 'added', oldValue: undefined }))).toBe('field-addition');
  });

  it('classifies removed as field-removal', () => {
    expect(classifyChange(makeEntry({ type: 'removed', newValue: undefined }))).toBe('field-removal');
  });

  it('classifies type keyword change as type-change', () => {
    expect(classifyChange(makeEntry({ oldValue: 'string', newValue: 'integer' }))).toBe('type-change');
  });

  it('classifies shallow path change as structural', () => {
    const entry = makeEntry({ path: 'charge', oldValue: 'foo', newValue: 'bar' });
    expect(classifyChange(entry)).toBe('structural');
  });

  it('classifies constraint path', () => {
    const entry = makeEntry({ path: 'charge.amount.nullable', oldValue: 'false', newValue: 'true' });
    expect(classifyChange(entry)).toBe('constraint');
  });
});

describe('labelChange', () => {
  it('returns readable label', () => {
    expect(labelChange('field-addition')).toBe('Field added');
    expect(labelChange('type-change')).toBe('Type change');
  });
});

describe('classifyAll', () => {
  it('returns classified entries for all inputs', () => {
    const entries = [makeEntry({ type: 'added' }), makeEntry({ type: 'removed' })];
    const result = classifyAll(entries);
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('field-addition');
    expect(result[1].category).toBe('field-removal');
  });
});

describe('groupByCategory', () => {
  it('groups entries by category', () => {
    const classified = classifyAll([
      makeEntry({ type: 'added' }),
      makeEntry({ type: 'removed' }),
      makeEntry({ type: 'added', path: 'charge.fee' }),
    ]);
    const grouped = groupByCategory(classified);
    expect(grouped['field-addition']).toHaveLength(2);
    expect(grouped['field-removal']).toHaveLength(1);
  });
});

describe('formatClassifyReport', () => {
  it('includes category headers', () => {
    const classified = classifyAll([makeEntry({ type: 'added' })]);
    const report = formatClassifyReport(classified);
    expect(report).toContain('Field added');
    expect(report).toContain('charge.amount');
  });
});

describe('formatClassifyJson', () => {
  it('returns valid JSON with category field', () => {
    const classified = classifyAll([makeEntry()]);
    const json = JSON.parse(formatClassifyJson(classified));
    expect(json[0]).toHaveProperty('category');
    expect(json[0]).toHaveProperty('label');
  });
});
