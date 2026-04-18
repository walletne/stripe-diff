import {
  addAlias,
  removeAlias,
  resolveAlias,
  listAliases,
  resolveVersionArg,
  mergeAliases,
} from './diffAlias';

describe('addAlias', () => {
  it('adds an alias', () => {
    const map = addAlias('latest', '2024-06-01', {});
    expect(map['latest']).toBe('2024-06-01');
  });

  it('throws on invalid alias name', () => {
    expect(() => addAlias('bad alias!', '2024-06-01', {})).toThrow();
  });
});

describe('removeAlias', () => {
  it('removes existing alias', () => {
    const map = removeAlias('latest', { latest: '2024-06-01' });
    expect(map['latest']).toBeUndefined();
  });

  it('is a no-op for missing alias', () => {
    const map = removeAlias('nope', { latest: '2024-06-01' });
    expect(map['latest']).toBe('2024-06-01');
  });
});

describe('resolveAlias', () => {
  it('returns version for known alias', () => {
    expect(resolveAlias('latest', { latest: '2024-06-01' })).toBe('2024-06-01');
  });

  it('returns undefined for unknown alias', () => {
    expect(resolveAlias('missing', {})).toBeUndefined();
  });
});

describe('listAliases', () => {
  it('shows message when empty', () => {
    expect(listAliases({})).toBe('No aliases defined.');
  });

  it('lists aliases', () => {
    const out = listAliases({ latest: '2024-06-01', prev: '2023-10-16' });
    expect(out).toContain('latest');
    expect(out).toContain('2024-06-01');
  });
});

describe('resolveVersionArg', () => {
  it('resolves alias', () => {
    expect(resolveVersionArg('latest', { latest: '2024-06-01' })).toBe('2024-06-01');
  });

  it('returns arg unchanged when not an alias', () => {
    expect(resolveVersionArg('2023-01-01', {})).toBe('2023-01-01');
  });
});

describe('mergeAliases', () => {
  it('merges maps with override precedence', () => {
    const result = mergeAliases({ a: '1', b: '2' }, { b: '3', c: '4' });
    expect(result).toEqual({ a: '1', b: '3', c: '4' });
  });
});
