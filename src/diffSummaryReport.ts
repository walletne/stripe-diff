import { EventDiff } from './diffSchema';

export interface SummaryReport {
  totalEvents: number;
  addedFields: number;
  removedFields: number;
  changedFields: number;
  breakingCount: number;
  deprecatedCount: number;
  byEvent: Record<string, { added: number; removed: number; changed: number }>;
}

export function buildSummaryReport(diffs: Record<string, EventDiff>): SummaryReport {
  const report: SummaryReport = {
    totalEvents: Object.keys(diffs).length,
    addedFields: 0,
    removedFields: 0,
    changedFields: 0,
    breakingCount: 0,
    deprecatedCount: 0,
    byEvent: {},
  };

  for (const [event, diff] of Object.entries(diffs)) {
    const added = diff.changes.filter(c => c.type === 'added').length;
    const removed = diff.changes.filter(c => c.type === 'removed').length;
    const changed = diff.changes.filter(c => c.type === 'changed').length;

    report.addedFields += added;
    report.removedFields += removed;
    report.changedFields += changed;
    report.byEvent[event] = { added, removed, changed };
  }

  report.breakingCount = report.removedFields + report.changedFields;
  return report;
}

export function formatSummaryReport(report: SummaryReport, format: 'text' | 'json' = 'text'): string {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  const lines: string[] = [
    `Summary Report`,
    `==============`,
    `Total events diffed : ${report.totalEvents}`,
    `Fields added        : ${report.addedFields}`,
    `Fields removed      : ${report.removedFields}`,
    `Fields changed      : ${report.changedFields}`,
    `Potentially breaking: ${report.breakingCount}`,
    '',
    'By Event:',
  ];

  for (const [event, stats] of Object.entries(report.byEvent)) {
    if (stats.added + stats.removed + stats.changed > 0) {
      lines.push(`  ${event}: +${stats.added} -${stats.removed} ~${stats.changed}`);
    }
  }

  return lines.join('\n');
}
