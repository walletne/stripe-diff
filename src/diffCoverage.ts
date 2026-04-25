import { DiffEntry } from './diffSchema';

export interface CoverageReport {
  totalEvents: number;
  addedFields: number;
  removedFields: number;
  modifiedFields: number;
  unchangedEvents: string[];
  changedEvents: string[];
  coveragePercent: number;
}

export function buildCoverageReport(
  allEvents: string[],
  diffs: Record<string, DiffEntry[]>
): CoverageReport {
  const changedEvents = Object.keys(diffs).filter(
    (event) => diffs[event].length > 0
  );
  const unchangedEvents = allEvents.filter(
    (event) => !changedEvents.includes(event)
  );

  let addedFields = 0;
  let removedFields = 0;
  let modifiedFields = 0;

  for (const entries of Object.values(diffs)) {
    for (const entry of entries) {
      if (entry.change === 'added') addedFields++;
      else if (entry.change === 'removed') removedFields++;
      else if (entry.change === 'modified') modifiedFields++;
    }
  }

  const totalEvents = allEvents.length;
  const coveragePercent =
    totalEvents === 0
      ? 0
      : Math.round((changedEvents.length / totalEvents) * 100);

  return {
    totalEvents,
    addedFields,
    removedFields,
    modifiedFields,
    unchangedEvents,
    changedEvents,
    coveragePercent,
  };
}

export function formatCoverageReport(report: CoverageReport): string {
  const lines: string[] = [
    `Coverage Report`,
    `===============`,
    `Total events:    ${report.totalEvents}`,
    `Changed events:  ${report.changedEvents.length} (${report.coveragePercent}%)`,
    `Unchanged events:${report.unchangedEvents.length}`,
    ``,
    `Field changes:`,
    `  Added:    ${report.addedFields}`,
    `  Removed:  ${report.removedFields}`,
    `  Modified: ${report.modifiedFields}`,
  ];

  if (report.changedEvents.length > 0) {
    lines.push(``, `Changed events:`);
    for (const event of report.changedEvents) {
      lines.push(`  - ${event}`);
    }
  }

  return lines.join('\n');
}

export function formatCoverageJson(report: CoverageReport): string {
  return JSON.stringify(report, null, 2);
}
