import { DiffEntry } from './diffSchema';

export interface AuditEvent {
  timestamp: string;
  action: string;
  fromVersion: string;
  toVersion: string;
  eventName: string;
  fieldPath: string;
  changeType: 'added' | 'removed' | 'changed';
  details: string;
}

export interface AuditReport {
  generatedAt: string;
  fromVersion: string;
  toVersion: string;
  events: AuditEvent[];
}

export function buildAuditReport(
  entries: DiffEntry[],
  fromVersion: string,
  toVersion: string
): AuditReport {
  const generatedAt = new Date().toISOString();
  const events: AuditEvent[] = entries.map((entry) => ({
    timestamp: generatedAt,
    action: `field.${entry.change}`,
    fromVersion,
    toVersion,
    eventName: entry.event,
    fieldPath: entry.field,
    changeType: entry.change,
    details: buildDetails(entry),
  }));

  return { generatedAt, fromVersion, toVersion, events };
}

function buildDetails(entry: DiffEntry): string {
  if (entry.change === 'added') {
    return `Field added with type "${entry.newType ?? 'unknown'}"`;
  }
  if (entry.change === 'removed') {
    return `Field removed (was "${entry.oldType ?? 'unknown'}")`;
  }
  return `Type changed from "${entry.oldType ?? 'unknown'}" to "${entry.newType ?? 'unknown'}"`;
}

export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [
    `Audit Report: ${report.fromVersion} → ${report.toVersion}`,
    `Generated: ${report.generatedAt}`,
    `Total events: ${report.events.length}`,
    '',
  ];
  for (const ev of report.events) {
    lines.push(`[${ev.changeType.toUpperCase()}] ${ev.eventName} / ${ev.fieldPath}`);
    lines.push(`  ${ev.details}`);
  }
  return lines.join('\n');
}

export function formatAuditJson(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}
