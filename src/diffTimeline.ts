import { DiffEntry } from './diffSchema';

export interface TimelinePoint {
  version: string;
  added: number;
  removed: number;
  changed: number;
  events: string[];
}

export interface TimelineReport {
  points: TimelinePoint[];
  totalVersions: number;
  mostActiveVersion: string | null;
  mostActiveCount: number;
}

export function buildTimelinePoint(
  version: string,
  entries: DiffEntry[]
): TimelinePoint {
  const added = entries.filter(e => e.change === 'added').length;
  const removed = entries.filter(e => e.change === 'removed').length;
  const changed = entries.filter(e => e.change === 'changed').length;
  const events = [...new Set(entries.map(e => e.event))];
  return { version, added, removed, changed, events };
}

export function buildTimelineReport(
  versionedEntries: Record<string, DiffEntry[]>
): TimelineReport {
  const versions = Object.keys(versionedEntries).sort();
  const points = versions.map(v => buildTimelinePoint(v, versionedEntries[v]));

  let mostActiveVersion: string | null = null;
  let mostActiveCount = 0;
  for (const p of points) {
    const total = p.added + p.removed + p.changed;
    if (total > mostActiveCount) {
      mostActiveCount = total;
      mostActiveVersion = p.version;
    }
  }

  return {
    points,
    totalVersions: versions.length,
    mostActiveVersion,
    mostActiveCount,
  };
}

export function formatTimelineReport(report: TimelineReport): string {
  if (report.points.length === 0) return 'No timeline data available.';
  const lines: string[] = ['## Diff Timeline\n'];
  for (const p of report.points) {
    const total = p.added + p.removed + p.changed;
    lines.push(
      `${p.version}: +${p.added} -${p.removed} ~${p.changed} (${total} total, ${p.events.length} events)`
    );
  }
  if (report.mostActiveVersion) {
    lines.push(`\nMost active: ${report.mostActiveVersion} (${report.mostActiveCount} changes)`);
  }
  return lines.join('\n');
}

export function formatTimelineJson(report: TimelineReport): string {
  return JSON.stringify(report, null, 2);
}
