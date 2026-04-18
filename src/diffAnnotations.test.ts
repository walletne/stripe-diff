import { annotateChange, annotateAll, filterBySeverity } from './diffAnnotations';
import { FieldChange, DiffResult } from './diffSchema';

function makeChange(overrides: Partial<FieldChange> = {}): FieldChange {
  return { field: 'data.object.amount', type: 'changed', from: 'integer', to: 'string', ...overrides };
}

describe('annotateChange', () => {
  it('marks removed fields as error', () => {
    const a = annotateChange('charge.updated', makeChange({ type: 'removed', from: undefined, to: undefined }));
    expect(a.severity).toBe('error');
    expect(a.message).toContain('removed');
  });

  it('marks added fields as info', () => {
    const a = annotateChange('charge.updated', makeChange({ type: 'added', from: undefined, to: undefined }));
    expect(a.severity).toBe('info');
  });

  it('marks type changes as warning', () => {
    const a = annotateChange('charge.updated', makeChange({ type: 'changed', from: 'integer', to: 'string' }));
    expect(a.severity).toBe('warning');
    expect(a.message).toContain('integer');
    expect(a.message).toContain('string');
  });
});

describe('annotateAll', () => {
  it('flattens all events into annotations', () => {
    const diff: DiffResult = {
      'charge.updated': [makeChange({ type: 'removed' }), makeChange({ type: 'added' })],
      'payment_intent.created': [makeChange({ type: 'changed' })],
    };
    const result = annotateAll(diff);
    expect(result).toHaveLength(3);
    expect(result.map(a => a.event)).toContain('charge.updated');
  });

  it('returns empty array for empty diff', () => {
    expect(annotateAll({})).toEqual([]);
  });
});

describe('filterBySeverity', () => {
  it('filters to only error and above', () => {
    const diff: DiffResult = {
      'charge.updated': [
        makeChange({ type: 'removed' }),
        makeChange({ type: 'added' }),
        makeChange({ type: 'changed' }),
      ],
    };
    const annotations = annotateAll(diff);
    const errors = filterBySeverity(annotations, 'error');
    expect(errors.every(a => a.severity === 'error')).toBe(true);
  });

  it('includes warnings and errors when filtering by warning', () => {
    const diff: DiffResult = {
      'charge.updated': [makeChange({ type: 'removed' }), makeChange({ type: 'changed' })],
    };
    const annotations = annotateAll(diff);
    const result = filterBySeverity(annotations, 'warning');
    expect(result.length).toBeGreaterThanOrEqual(1);
    result.forEach(a => expect(['warning', 'error']).toContain(a.severity));
  });
});
