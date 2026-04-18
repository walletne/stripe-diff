import { EventSchemaDiff } from './diffSchema';

export interface PatchEntry {
  event: string;
  field: string;
  op: 'add' | 'remove' | 'change';
  from?: string;
  to?: string;
}

export interface DiffPatch {
  fromVersion: string;
  toVersion: string;
  entries: PatchEntry[];
}

export function buildPatch(
  fromVersion: string,
  toVersion: string,
  diffs: Record<string, EventSchemaDiff>
): DiffPatch {
  const entries: PatchEntry[] = [];

  for (const [event, diff] of Object.entries(diffs)) {
    for (const [field, type] of Object.entries(diff.added)) {
      entries.push({ event, field, op: 'add', to: type });
    }
    for (const [field, type] of Object.entries(diff.removed)) {
      entries.push({ event, field, op: 'remove', from: type });
    }
    for (const [field, change] of Object.entries(diff.changed)) {
      entries.push({ event, field, op: 'change', from: change.from, to: change.to });
    }
  }

  return { fromVersion, toVersion, entries };
}

export function applyPatch(
  base: Record<string, Record<string, string>>,
  patch: DiffPatch
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};

  for (const [event, fields] of Object.entries(base)) {
    result[event] = { ...fields };
  }

  for (const entry of patch.entries) {
    if (!result[entry.event]) result[entry.event] = {};
    if (entry.op === 'add' && entry.to) {
      result[entry.event][entry.field] = entry.to;
    } else if (entry.op === 'remove') {
      delete result[entry.event][entry.field];
    } else if (entry.op === 'change' && entry.to) {
      result[entry.event][entry.field] = entry.to;
    }
  }

  return result;
}

export function formatPatch(patch: DiffPatch): string {
  const lines: string[] = [
    `Patch: ${patch.fromVersion} → ${patch.toVersion}`,
    `Entries: ${patch.entries.length}`,
    ''
  ];
  for (const e of patch.entries) {
    if (e.op === 'add') lines.push(`  + [${e.event}] ${e.field}: ${e.to}`);
    else if (e.op === 'remove') lines.push(`  - [${e.event}] ${e.field}: ${e.from}`);
    else lines.push(`  ~ [${e.event}] ${e.field}: ${e.from} → ${e.to}`);
  }
  return lines.join('\n');
}
