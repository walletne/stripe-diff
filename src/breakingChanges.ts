import { DiffResult, FieldChange } from './diffSchema';

export type BreakingChange = {
  event: string;
  field: string;
  reason: string;
  severity: 'error' | 'warning';
};

const BREAKING_REMOVAL_SEVERITY: 'error' = 'error';
const BREAKING_TYPE_CHANGE_SEVERITY: 'error' = 'error';
const OPTIONAL_TO_REQUIRED_SEVERITY: 'warning' = 'warning';

export function detectBreakingChanges(diff: DiffResult): BreakingChange[] {
  const breaking: BreakingChange[] = [];

  for (const [event, changes] of Object.entries(diff)) {
    for (const change of changes) {
      if (change.type === 'removed') {
        breaking.push({
          event,
          field: change.field,
          reason: `Field removed`,
          severity: BREAKING_REMOVAL_SEVERITY,
        });
      } else if (change.type === 'changed') {
        if (change.oldType !== change.newType) {
          breaking.push({
            event,
            field: change.field,
            reason: `Type changed from '${change.oldType}' to '${change.newType}'`,
            severity: BREAKING_TYPE_CHANGE_SEVERITY,
          });
        }
        if (!change.oldRequired && change.newRequired) {
          breaking.push({
            event,
            field: change.field,
            reason: `Field became required`,
            severity: OPTIONAL_TO_REQUIRED_SEVERITY,
          });
        }
      }
    }
  }

  return breaking;
}

export function formatBreakingChanges(changes: BreakingChange[]): string {
  if (changes.length === 0) {
    return 'No breaking changes detected.\n';
  }

  const lines: string[] = [`Breaking Changes (${changes.length}):\n`];
  for (const c of changes) {
    const icon = c.severity === 'error' ? '✖' : '⚠';
    lines.push(`  ${icon} [${c.event}] ${c.field}: ${c.reason}`);
  }
  return lines.join('\n') + '\n';
}
