import { DiffEntry } from './diffSchema';

export interface HeatmapCell {
  object: string;
  version: string;
  added: number;
  removed: number;
  changed: number;
  total: number;
  intensity: number; // 0-1 normalized
}

export interface HeatmapReport {
  cells: HeatmapCell[];
  objects: string[];
  versions: string[];
  maxTotal: number;
}

export function buildHeatmap(
  diffs: Record<string, DiffEntry[]>,
  versions: string[]
): HeatmapReport {
  const cellMap = new Map<string, HeatmapCell>();
  const objectSet = new Set<string>();

  for (const [version, entries] of Object.entries(diffs)) {
    for (const entry of entries) {
      const object = entry.field.split('.')[0];
      objectSet.add(object);
      const key = `${object}::${version}`;
      if (!cellMap.has(key)) {
        cellMap.set(key, { object, version, added: 0, removed: 0, changed: 0, total: 0, intensity: 0 });
      }
      const cell = cellMap.get(key)!;
      if (entry.change === 'added') cell.added++;
      else if (entry.change === 'removed') cell.removed++;
      else cell.changed++;
      cell.total++;
    }
  }

  const cells = Array.from(cellMap.values());
  const maxTotal = cells.reduce((m, c) => Math.max(m, c.total), 0);

  for (const cell of cells) {
    cell.intensity = maxTotal > 0 ? cell.total / maxTotal : 0;
  }

  return {
    cells,
    objects: Array.from(objectSet).sort(),
    versions,
    maxTotal,
  };
}

export function formatHeatmapTable(report: HeatmapReport): string {
  if (report.cells.length === 0) return 'No data for heatmap.';
  const colWidth = 10;
  const labelWidth = 20;
  const header =
    'Object'.padEnd(labelWidth) +
    report.versions.map(v => v.slice(-8).padStart(colWidth)).join('');
  const separator = '-'.repeat(labelWidth + colWidth * report.versions.length);
  const rows = report.objects.map(obj => {
    const cols = report.versions.map(ver => {
      const cell = report.cells.find(c => c.object === obj && c.version === ver);
      const val = cell ? String(cell.total) : '0';
      return val.padStart(colWidth);
    });
    return obj.padEnd(labelWidth) + cols.join('');
  });
  return [header, separator, ...rows].join('\n');
}

export function formatHeatmapJson(report: HeatmapReport): string {
  return JSON.stringify(report, null, 2);
}
