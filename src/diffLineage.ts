import { DiffEntry } from './diffSchema';

export interface LineageNode {
  field: string;
  versions: string[];
  introduced: string | null;
  removed: string | null;
  typeChanges: { version: string; from: string; to: string }[];
}

export interface LineageReport {
  field: string;
  nodes: LineageNode[];
}

export function buildLineageReport(
  versionedDiffs: { version: string; entries: DiffEntry[] }[]
): LineageReport[] {
  const fieldMap = new Map<string, LineageNode>();

  for (const { version, entries } of versionedDiffs) {
    for (const entry of entries) {
      const existing = fieldMap.get(entry.field) ?? {
        field: entry.field,
        versions: [],
        introduced: null,
        removed: null,
        typeChanges: [],
      };

      if (entry.change === 'added') {
        existing.introduced = version;
        existing.versions.push(version);
      } else if (entry.change === 'removed') {
        existing.removed = version;
      } else if (entry.change === 'modified') {
        existing.versions.push(version);
        if (entry.from !== undefined && entry.to !== undefined) {
          existing.typeChanges.push({ version, from: entry.from, to: entry.to });
        }
      }

      fieldMap.set(entry.field, existing);
    }
  }

  return Array.from(fieldMap.values()).map((node) => ({
    field: node.field,
    nodes: [node],
  }));
}

export function formatLineageReport(report: LineageReport[]): string {
  if (report.length === 0) return 'No lineage data available.\n';
  const lines: string[] = ['Field Lineage Report', '==================='];
  for (const { field, nodes } of report) {
    const node = nodes[0];
    lines.push(`\nField: ${field}`);
    if (node.introduced) lines.push(`  Introduced: ${node.introduced}`);
    if (node.removed) lines.push(`  Removed:    ${node.removed}`);
    if (node.typeChanges.length > 0) {
      lines.push('  Type Changes:');
      for (const tc of node.typeChanges) {
        lines.push(`    ${tc.version}: ${tc.from} → ${tc.to}`);
      }
    }
    if (node.versions.length > 0) {
      lines.push(`  Active in: ${node.versions.join(', ')}`);
    }
  }
  return lines.join('\n') + '\n';
}

export function formatLineageJson(report: LineageReport[]): string {
  return JSON.stringify(report.map(({ field, nodes }) => ({ field, ...nodes[0] })), null, 2);
}
