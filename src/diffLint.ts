import { Change } from './diffSchema';

export type LintRule = 'no-type-change' | 'no-removal' | 'no-required-added' | 'no-enum-shrink';

export interface LintViolation {
  rule: LintRule;
  field: string;
  message: string;
}

export function lintDiff(
  changes: Record<string, Change[]>,
  rules: LintRule[] = ['no-type-change', 'no-removal', 'no-required-added', 'no-enum-shrink']
): LintViolation[] {
  const violations: LintViolation[] = [];

  for (const [event, eventChanges] of Object.entries(changes)) {
    for (const change of eventChanges) {
      if (rules.includes('no-removal') && change.type === 'removed') {
        violations.push({ rule: 'no-removal', field: `${event}.${change.field}`, message: `Field removed: ${change.field}` });
      }
      if (rules.includes('no-type-change') && change.type === 'changed' && change.from !== change.to) {
        const fromType = change.from?.split(':')[0];
        const toType = change.to?.split(':')[0];
        if (fromType !== toType) {
          violations.push({ rule: 'no-type-change', field: `${event}.${change.field}`, message: `Type changed on ${change.field}: ${fromType} -> ${toType}` });
        }
      }
      if (rules.includes('no-required-added') && change.type === 'added' && change.to?.includes('required')) {
        violations.push({ rule: 'no-required-added', field: `${event}.${change.field}`, message: `Required field added: ${change.field}` });
      }
    }
  }

  return violations;
}

export function formatLintResults(violations: LintViolation[]): string {
  if (violations.length === 0) return '✅ No lint violations found.\n';
  const lines = [`❌ ${violations.length} lint violation(s):\n`];
  for (const v of violations) {
    lines.push(`  [${v.rule}] ${v.field}: ${v.message}`);
  }
  return lines.join('\n') + '\n';
}

export function formatLintJson(violations: LintViolation[]): string {
  return JSON.stringify({ violations, count: violations.length }, null, 2);
}
