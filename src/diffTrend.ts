import { DiffEntry } from './diffSchema';

export interface TrendPoint {
  version: string;
  added: number;
  removed: number;
  changed: number;
  total: number;
}

export interface TrendReport {
  points: TrendPoint[];
  mostVolatileEvent: string | null;
  averageChangesPerVersion: number;
}

export function buildTrendPoint(version: string, diffs: Record<string, DiffEntry[]>): TrendPoint {
  let added = 0;
  let removed = 0;
  let changed = 0;

  for (const entries of Object.values(diffs)) {
    for (const entry of entries) {
      if (entry.type === 'added') added++;
      else if (entry.type === 'removed') removed++;
      else if (entry.type === 'changed') changed++;
    }
  }

  return { version, added, removed, changed, total: added + removed + changed };
}

export function buildTrendReport(points: TrendPoint[], diffs: Record<string, Record<string, DiffEntry[]>>): TrendReport {
  const eventTotals: Record<string, number> = {};

  for (const versionDiffs of Object.values(diffs)) {
    for (const [event, entries] of Object.entries(versionDiffs)) {
      eventTotals[event] = (eventTotals[event] ?? 0) + entries.length;
    }
  }

  const mostVolatileEvent = Object.keys(eventTotals).sort((a, b) => eventTotals[b] - eventTotals[a])[0] ?? null;
  const totalChanges = points.reduce((sum, p) => sum + p.total, 0);
  const averageChangesPerVersion = points.length > 0 ? totalChanges / points.length : 0;

  return { points, mostVolatileEvent, averageChangesPerVersion };
}

export function formatTrendReport(report: TrendReport): string {
  const lines: string[] = ['## Diff Trend Report', ''];

  lines.push(`Most volatile event: ${report.mostVolatileEvent ?? 'N/A'}`);
  lines.push(`Average changes per version: ${report.averageChangesPerVersion.toFixed(2)}`);
  lines.push('');
  lines.push('| Version | Added | Removed | Changed | Total |');
  lines.push('|---------|-------|---------|---------|-------|');

  for (const p of report.points) {
    lines.push(`| ${p.version} | ${p.added} | ${p.removed} | ${p.changed} | ${p.total} |`);
  }

  return lines.join('\n');
}

export function formatTrendJson(report: TrendReport): string {
  return JSON.stringify(report, null, 2);
}
