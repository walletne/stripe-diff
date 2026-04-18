import { EventDiff } from './diffSchema';

export interface GroupedDiff {
  object: string;
  events: Record<string, EventDiff>;
}

export function groupDiffByObject(diff: Record<string, EventDiff>): GroupedDiff[] {
  const groups: Record<string, Record<string, EventDiff>> = {};

  for (const [event, changes] of Object.entries(diff)) {
    const parts = event.split('.');
    const object = parts.length >= 2 ? parts[0] : 'other';
    if (!groups[object]) groups[object] = {};
    groups[object][event] = changes;
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([object, events]) => ({ object, events }));
}

export function formatGroupedDiff(groups: GroupedDiff[]): string {
  if (groups.length === 0) return 'No changes found.';
  const lines: string[] = [];
  for (const group of groups) {
    lines.push(`## ${group.object}`);
    for (const [event, changes] of Object.entries(group.events)) {
      const added = changes.added.length;
      const removed = changes.removed.length;
      const changed = changes.changed.length;
      lines.push(`  ${event}: +${added} -${removed} ~${changed}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export function formatGroupedDiffJson(groups: GroupedDiff[]): string {
  return JSON.stringify(groups, null, 2);
}
