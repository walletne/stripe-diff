import { buildPatch, applyPatch, formatPatch } from './diffPatch';
import { EventSchemaDiff } from './diffSchema';

function makeDiff(overrides: Partial<EventSchemaDiff> = {}): EventSchemaDiff {
  return {
    added: {},
    removed: {},
    changed: {},
    ...overrides
  };
}

describe('buildPatch', () => {
  it('creates patch with added fields', () => {
    const diffs = { 'charge.updated': makeDiff({ added: { 'data.amount': 'integer' } }) };
    const patch = buildPatch('2023-01-01', '2024-01-01', diffs);
    expect(patch.fromVersion).toBe('2023-01-01');
    expect(patch.toVersion).toBe('2024-01-01');
    expect(patch.entries).toHaveLength(1);
    expect(patch.entries[0]).toMatchObject({ event: 'charge.updated', field: 'data.amount', op: 'add', to: 'integer' });
  });

  it('creates patch with removed fields', () => {
    const diffs = { 'charge.updated': makeDiff({ removed: { 'data.old': 'string' } }) };
    const patch = buildPatch('2023-01-01', '2024-01-01', diffs);
    expect(patch.entries[0]).toMatchObject({ op: 'remove', from: 'string' });
  });

  it('creates patch with changed fields', () => {
    const diffs = { 'charge.updated': makeDiff({ changed: { 'data.status': { from: 'string', to: 'boolean' } } }) };
    const patch = buildPatch('2023-01-01', '2024-01-01', diffs);
    expect(patch.entries[0]).toMatchObject({ op: 'change', from: 'string', to: 'boolean' });
  });

  it('returns empty entries for empty diffs', () => {
    const patch = buildPatch('2023-01-01', '2024-01-01', {});
    expect(patch.entries).toHaveLength(0);
  });
});

describe('applyPatch', () => {
  const base = { 'charge.updated': { 'data.amount': 'integer', 'data.status': 'string' } };

  it('applies add operation', () => {
    const patch = buildPatch('a', 'b', { 'charge.updated': makeDiff({ added: { 'data.new': 'boolean' } }) });
    const result = applyPatch(base, patch);
    expect(result['charge.updated']['data.new']).toBe('boolean');
  });

  it('applies remove operation', () => {
    const patch = buildPatch('a', 'b', { 'charge.updated': makeDiff({ removed: { 'data.status': 'string' } }) });
    const result = applyPatch(base, patch);
    expect(result['charge.updated']['data.status']).toBeUndefined();
  });

  it('applies change operation', () => {
    const patch = buildPatch('a', 'b', { 'charge.updated': makeDiff({ changed: { 'data.amount': { from: 'integer', to: 'string' } } }) });
    const result = applyPatch(base, patch);
    expect(result['charge.updated']['data.amount']).toBe('string');
  });

  it('does not mutate base', () => {
    const patch = buildPatch('a', 'b', { 'charge.updated': makeDiff({ removed: { 'data.amount': 'integer' } }) });
    applyPatch(base, patch);
    expect(base['charge.updated']['data.amount']).toBe('integer');
  });
});

describe('formatPatch', () => {
  it('formats patch as readable string', () => {
    const patch = buildPatch('2023-01-01', '2024-01-01', {
      'charge.updated': makeDiff({ added: { 'data.x': 'string' } })
    });
    const out = formatPatch(patch);
    expect(out).toContain('2023-01-01 → 2024-01-01');
    expect(out).toContain('+ [charge.updated] data.x: string');
  });
});
