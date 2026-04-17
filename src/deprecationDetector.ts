import { DiffResult, FieldChange } from './diffSchema';

export interface DeprecationWarning {
  event: string;
  field: string;
  type: 'removed' | 'type_changed' | 'required_dropped';
  message: string;
}

export function detectDeprecations(
  diffs: Record<string, DiffResult>,
  fromVersion: string,
  toVersion: string
): DeprecationWarning[] {
  const warnings: DeprecationWarning[] = [];

  for (const [event, diff] of Object.entries(diffs)) {
    for (const change of diff.changes) {
      if (change.type === 'removed') {
        warnings.push({
          event,
          field: change.field,
          type: 'removed',
          message: `Field "${change.field}" was removed between ${fromVersion} and ${toVersion}.`,
        });
      } else if (change.type === 'changed') {
        if (change.oldType !== change.newType) {
          warnings.push({
            event,
            field: change.field,
            type: 'type_changed',
            message: `Field "${change.field}" changed type from "${change.oldType}" to "${change.newType}" between ${fromVersion} and ${toVersion}.`,
          });
        }
        if (change.oldRequired && !change.newRequired) {
          warnings.push({
            event,
            field: change.field,
            type: 'required_dropped',
            message: `Field "${change.field}" is no longer required as of ${toVersion}.`,
          });
        }
      }
    }
  }

  return warnings;
}

export function formatDeprecationWarnings(warnings: DeprecationWarning[]): string {
  if (warnings.length === 0) return 'No deprecation warnings detected.\n';
  const lines = [`Deprecation Warnings (${warnings.length}):\n`];
  for (const w of warnings) {
    const icon = w.type === 'removed' ? '🗑' : w.type === 'type_changed' ? '⚠️' : 'ℹ️';
    lines.push(`  ${icon} [${w.event}] ${w.message}`);
  }
  return lines.join('\n') + '\n';
}
