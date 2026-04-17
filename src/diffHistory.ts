import { EventDiff } from './diffSchema';

export interface DiffHistoryEntry {
  fromVersion: string;
  toVersion: string;
  timestamp: string;
  eventCount: number;
  addedFields: number;
  removedFields: number;
  changedFields: number;
}

export function buildHistoryEntry(
  fromVersion: string,
  toVersion: string,
  diffs: Record<string, EventDiff>
): DiffHistoryEntry {
  let addedFields = 0;
  let removedFields = 0;
  let changedFields = 0;

  for (const diff of Object.values(diffs)) {
    addedFields += diff.added.length;
    removedFields += diff.removed.length;
    changedFields += diff.changed.length;
  }

  return {
    fromVersion,
    toVersion,
    timestamp: new Date().toISOString(),
    eventCount: Object.keys(diffs).length,
    addedFields,
    removedFields,
    changedFields,
  };
}

export function formatHistoryTable(entries: DiffHistoryEntry[]): string {
  if (entries.length === 0) return 'No diff history found.\n';

  const header = ['From', 'To', 'Events', 'Added', 'Removed', 'Changed', 'Date'];
  const rows = entries.map(e => [
    e.fromVersion,
    e.toVersion,
    String(e.eventCount),
    String(e.addedFields),
    String(e.removedFields),
    String(e.changedFields),
    e.timestamp.slice(0, 10),
  ]);

  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map(r => r[i].length))
  );

  const fmt = (row: string[]) =>
    row.map((cell, i) => cell.padEnd(widths[i])).join('  ');

  const separator = widths.map(w => '-'.repeat(w)).join('  ');
  return [fmt(header), separator, ...rows.map(fmt)].join('\n') + '\n';
}
