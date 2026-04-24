import { DiffEntry } from './diffSchema';

export interface MatrixCell {
  added: number;
  removed: number;
  changed: number;
  total: number;
}

export interface DiffMatrix {
  versions: string[];
  events: string[];
  cells: Record<string, Record<string, MatrixCell>>; // cells[version][event]
}

export function emptyCell(): MatrixCell {
  return { added: 0, removed: 0, changed: 0, total: 0 };
}

export function buildDiffMatrix(
  versionDiffs: Record<string, DiffEntry[]>
): DiffMatrix {
  const versions = Object.keys(versionDiffs);
  const eventSet = new Set<string>();

  for (const entries of Object.values(versionDiffs)) {
    for (const entry of entries) {
      eventSet.add(entry.event);
    }
  }

  const events = Array.from(eventSet).sort();
  const cells: Record<string, Record<string, MatrixCell>> = {};

  for (const version of versions) {
    cells[version] = {};
    for (const event of events) {
      cells[version][event] = emptyCell();
    }
    for (const entry of versionDiffs[version]) {
      const cell = cells[version][entry.event];
      if (entry.type === 'added') cell.added++;
      else if (entry.type === 'removed') cell.removed++;
      else if (entry.type === 'changed') cell.changed++;
      cell.total++;
    }
  }

  return { versions, events, cells };
}

export function formatMatrixTable(matrix: DiffMatrix): string {
  if (matrix.versions.length === 0 || matrix.events.length === 0) {
    return 'No data available.';
  }

  const colWidth = 14;
  const eventWidth = 36;
  const header =
    'Event'.padEnd(eventWidth) +
    matrix.versions.map(v => v.padStart(colWidth)).join('');
  const divider = '-'.repeat(eventWidth + matrix.versions.length * colWidth);
  const rows = matrix.events.map(event => {
    const cells = matrix.versions.map(version => {
      const c = matrix.cells[version][event];
      const label = c.total === 0 ? '-' : `+${c.added}/-${c.removed}/~${c.changed}`;
      return label.padStart(colWidth);
    });
    return event.padEnd(eventWidth) + cells.join('');
  });

  return [header, divider, ...rows].join('\n');
}

export function formatMatrixJson(matrix: DiffMatrix): string {
  return JSON.stringify(matrix, null, 2);
}
