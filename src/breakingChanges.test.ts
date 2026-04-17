import { detectBreakingChanges, formatBreakingChanges } from './breakingChanges';
import { DiffResult } from './diffSchema';

function makeDiff(overrides: DiffResult = {}): DiffResult {
  return overrides;
}

describe('detectBreakingChanges', () => {
  it('returns empty array for no changes', () => {
    expect(detectBreakingChanges(makeDiff())).toEqual([]);
  });

  it('flags removed fields as errors', () => {
    const diff = makeDiff({
      'charge.updated': [{ type: 'removed', field: 'data.object.foo', oldType: 'string' }],
    });
    const result = detectBreakingChanges(diff);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('error');
    expect(result[0].reason).toBe('Field removed');
  });

  it('flags type changes as errors', () => {
    const diff = makeDiff({
      'charge.updated': [
        { type: 'changed', field: 'data.object.amount', oldType: 'string', newType: 'integer', oldRequired: false, newRequired: false },
      ],
    });
    const result = detectBreakingChanges(diff);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('error');
    expect(result[0].reason).toContain('Type changed');
  });

  it('flags optional-to-required as warnings', () => {
    const diff = makeDiff({
      'invoice.paid': [
        { type: 'changed', field: 'data.object.due_date', oldType: 'string', newType: 'string', oldRequired: false, newRequired: true },
      ],
    });
    const result = detectBreakingChanges(diff);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('warning');
  });

  it('does not flag added fields', () => {
    const diff = makeDiff({
      'charge.updated': [{ type: 'added', field: 'data.object.new_field', newType: 'string' }],
    });
    expect(detectBreakingChanges(diff)).toHaveLength(0);
  });
});

describe('formatBreakingChanges', () => {
  it('returns no-breaking message for empty list', () => {
    expect(formatBreakingChanges([])).toContain('No breaking changes');
  });

  it('formats errors and warnings with icons', () => {
    const changes = [
      { event: 'charge.updated', field: 'foo', reason: 'Field removed', severity: 'error' as const },
      { event: 'invoice.paid', field: 'bar', reason: 'Field became required', severity: 'warning' as const },
    ];
    const output = formatBreakingChanges(changes);
    expect(output).toContain('✖');
    expect(output).toContain('⚠');
    expect(output).toContain('charge.updated');
    expect(output).toContain('Breaking Changes (2)');
  });
});
