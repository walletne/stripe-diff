import { detectDeprecations, formatDeprecationWarnings, DeprecationWarning } from './deprecationDetector';
import { DiffResult } from './diffSchema';

function makeDiff(changes: any[]): DiffResult {
  return { changes, added: 0, removed: 0, changed: 0 };
}

describe('detectDeprecations', () => {
  it('detects removed fields', () => {
    const diffs = {
      'charge.updated': makeDiff([{ type: 'removed', field: 'data.object.card', oldType: 'string' }]),
    };
    const warnings = detectDeprecations(diffs, '2023-01-01', '2024-01-01');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('removed');
    expect(warnings[0].field).toBe('data.object.card');
    expect(warnings[0].event).toBe('charge.updated');
  });

  it('detects type changes', () => {
    const diffs = {
      'payment_intent.created': makeDiff([
        { type: 'changed', field: 'data.object.amount', oldType: 'integer', newType: 'string', oldRequired: false, newRequired: false },
      ]),
    };
    const warnings = detectDeprecations(diffs, '2023-01-01', '2024-01-01');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('type_changed');
  });

  it('detects required dropped', () => {
    const diffs = {
      'customer.created': makeDiff([
        { type: 'changed', field: 'data.object.email', oldType: 'string', newType: 'string', oldRequired: true, newRequired: false },
      ]),
    };
    const warnings = detectDeprecations(diffs, '2023-01-01', '2024-01-01');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe('required_dropped');
  });

  it('returns empty for added fields', () => {
    const diffs = {
      'charge.updated': makeDiff([{ type: 'added', field: 'data.object.new_field', newType: 'string' }]),
    };
    const warnings = detectDeprecations(diffs, '2023-01-01', '2024-01-01');
    expect(warnings).toHaveLength(0);
  });
});

describe('formatDeprecationWarnings', () => {
  it('returns no-warning message when empty', () => {
    expect(formatDeprecationWarnings([])).toContain('No deprecation warnings');
  });

  it('formats warnings with count', () => {
    const warnings: DeprecationWarning[] = [
      { event: 'charge.updated', field: 'data.object.card', type: 'removed', message: 'Field removed.' },
    ];
    const output = formatDeprecationWarnings(warnings);
    expect(output).toContain('Deprecation Warnings (1)');
    expect(output).toContain('charge.updated');
    expect(output).toContain('Field removed.');
  });
});
