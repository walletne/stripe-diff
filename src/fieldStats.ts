import { EventDiff } from './diffSchema';

export interface FieldStats {
  totalFields: number;
  addedFields: number;
  removedFields: number;
  changedFields: number;
  changeRate: number;
}

export interface EventFieldStats {
  event: string;
  stats: FieldStats;
}

export function computeFieldStats(diff: EventDiff): FieldStats {
  const added = diff.changes.filter(c => c.type === 'added').length;
  const removed = diff.changes.filter(c => c.type === 'removed').length;
  const changed = diff.changes.filter(c => c.type === 'changed').length;
  const total = diff.totalFields ?? added + removed + changed;
  const modifications = added + removed + changed;
  const changeRate = total > 0 ? modifications / total : 0;

  return {
    totalFields: total,
    addedFields: added,
    removedFields: removed,
    changedFields: changed,
    changeRate: Math.round(changeRate * 1000) / 1000,
  };
}

export function computeAllFieldStats(diffs: EventDiff[]): EventFieldStats[] {
  return diffs.map(diff => ({
    event: diff.event,
    stats: computeFieldStats(diff),
  }));
}

export function formatFieldStats(stats: EventFieldStats[]): string {
  if (stats.length === 0) return 'No events to report.';

  const lines: string[] = ['Field Statistics:', ''];
  for (const { event, stats: s } of stats) {
    lines.push(`  ${event}`);
    lines.push(`    Total fields : ${s.totalFields}`);
    lines.push(`    Added        : ${s.addedFields}`);
    lines.push(`    Removed      : ${s.removedFields}`);
    lines.push(`    Changed      : ${s.changedFields}`);
    lines.push(`    Change rate  : ${(s.changeRate * 100).toFixed(1)}%`);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}
