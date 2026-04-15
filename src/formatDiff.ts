import { EventSchemaDiff, SchemaChange } from './diffSchema';

export const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
export const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
export const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
export const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
export const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
export const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
export const reset = (s: string) => `\x1b[0m${s}\x1b[0m`;

function formatChange(change: SchemaChange, prefix: string, colorFn: (s: string) => string): string {
  const base = `${prefix} ${change.path} (${change.type})`;
  if ('oldType' in change && change.oldType) {
    return colorFn(`${prefix} ${change.path}: ${change.oldType} → ${change.type}`);
  }
  return colorFn(base);
}

export function formatDiff(diff: EventSchemaDiff): string {
  const lines: string[] = [];
  const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;

  if (!hasChanges) return '';

  lines.push(bold(cyan(`\n● ${diff.event}`)));

  for (const field of diff.added) {
    lines.push(formatChange(field, '  +', green));
  }
  for (const field of diff.removed) {
    lines.push(formatChange(field, '  -', red));
  }
  for (const field of diff.changed) {
    lines.push(formatChange(field, '  ~', yellow));
  }

  return lines.join('\n');
}

export function formatSummary(diffs: EventSchemaDiff[]): string {
  const lines: string[] = [];
  let totalAdded = 0;
  let totalRemoved = 0;
  let totalChanged = 0;

  for (const diff of diffs) {
    const a = diff.added.length;
    const r = diff.removed.length;
    const c = diff.changed.length;
    if (a + r + c === 0) continue;

    totalAdded += a;
    totalRemoved += r;
    totalChanged += c;

    const parts = [
      a > 0 ? green(`+${a}`) : '',
      r > 0 ? red(`-${r}`) : '',
      c > 0 ? yellow(`~${c}`) : '',
    ].filter(Boolean).join(' ');

    lines.push(`  ${bold(diff.event)}: ${parts}`);
  }

  lines.push('');
  lines.push(`Total: ${green(`+${totalAdded}`)} ${red(`-${totalRemoved}`)} ${yellow(`~${totalChanged}`)}`);

  return lines.join('\n');
}
