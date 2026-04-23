import { DiffEntry } from './diffAnnotations';

export interface ClusterGroup {
  label: string;
  entries: DiffEntry[];
  size: number;
}

export interface ClusterReport {
  strategy: string;
  groups: ClusterGroup[];
  totalEntries: number;
}

export type ClusterStrategy = 'type' | 'depth' | 'object';

function getDepthBucket(path: string): string {
  const depth = path.split('.').length;
  if (depth <= 1) return 'shallow (depth 1)';
  if (depth <= 3) return 'mid (depth 2-3)';
  return 'deep (depth 4+)';
}

function getObjectLabel(path: string): string {
  const parts = path.split('.');
  return parts[0] ?? 'root';
}

export function clusterDiff(
  entries: DiffEntry[],
  strategy: ClusterStrategy = 'type'
): ClusterReport {
  const map = new Map<string, DiffEntry[]>();

  for (const entry of entries) {
    let label: string;
    if (strategy === 'type') {
      label = entry.change.type;
    } else if (strategy === 'depth') {
      label = getDepthBucket(entry.change.path);
    } else {
      label = getObjectLabel(entry.change.path);
    }

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(entry);
  }

  const groups: ClusterGroup[] = Array.from(map.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([label, groupEntries]) => ({
      label,
      entries: groupEntries,
      size: groupEntries.length,
    }));

  return { strategy, groups, totalEntries: entries.length };
}

export function formatClusterReport(report: ClusterReport): string {
  const lines: string[] = [
    `Cluster Report (strategy: ${report.strategy})`,
    `Total entries: ${report.totalEntries}`,
    '',
  ];
  for (const group of report.groups) {
    lines.push(`  [${group.label}] — ${group.size} change(s)`);
    for (const entry of group.entries) {
      lines.push(`    • ${entry.change.path} (${entry.change.type})`);
    }
  }
  return lines.join('\n');
}

export function formatClusterJson(report: ClusterReport): string {
  return JSON.stringify(report, null, 2);
}
