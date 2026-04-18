import { lintDiff, formatLintResults, formatLintJson, LintViolation } from './diffLint';

const changes = {
  'charge.updated': [
    { type: 'removed' as const, field: 'old_field', from: 'string', to: undefined },
    { type: 'changed' as const, field: 'amount', from: 'integer', to: 'string' },
    { type: 'added' as const, field: 'new_required', from: undefined, to: 'string:required' },
  ],
};

describe('lintDiff', () => {
  it('detects removed fields', () => {
    const violations = lintDiff(changes, ['no-removal']);
    expect(violations.some(v => v.rule === 'no-removal')).toBe(true);
    expect(violations.some(v => v.field === 'charge.updated.old_field')).toBe(true);
  });

  it('detects type changes', () => {
    const violations = lintDiff(changes, ['no-type-change']);
    expect(violations.some(v => v.rule === 'no-type-change')).toBe(true);
    expect(violations.some(v => v.field === 'charge.updated.amount')).toBe(true);
  });

  it('detects required fields added', () => {
    const violations = lintDiff(changes, ['no-required-added']);
    expect(violations.some(v => v.rule === 'no-required-added')).toBe(true);
  });

  it('returns empty for no violations', () => {
    const violations = lintDiff({ 'charge.updated': [{ type: 'added', field: 'x', from: undefined, to: 'string' }] }, ['no-removal']);
    expect(violations).toHaveLength(0);
  });

  it('applies all rules by default', () => {
    const violations = lintDiff(changes);
    expect(violations.length).toBeGreaterThan(1);
  });
});

describe('formatLintResults', () => {
  it('shows success when no violations', () => {
    expect(formatLintResults([])).toContain('✅');
  });

  it('shows violations count and details', () => {
    const violations = lintDiff(changes);
    const out = formatLintResults(violations);
    expect(out).toContain('❌');
    expect(out).toContain('no-removal');
  });
});

describe('formatLintJson', () => {
  it('returns valid json with count', () => {
    const violations = lintDiff(changes);
    const json = JSON.parse(formatLintJson(violations));
    expect(json).toHaveProperty('count');
    expect(json.violations).toBeInstanceOf(Array);
  });
});
