import { DiffEntry } from './diffSchema';

export interface PivotCell {
  added: number;
  removed: number;
  changed: number;
  total: number;
}

export type PivotTable = Record<string, Record<string, PivotCell>>;

function emptyCell(): PivotCell {
  return { added: 0, removed: 0, changed: 0, total: 0 };
}

function getObjectLabel(field: string): string {
  return field.split('.')[0] ?? 'root';
}

function getDepthLabel(field: string): string {
  const depth = field.split('.').length;
  if (depth === 1) return 'top-level';
  if (depth === 2) return 'nested';
  return 'deep';
}

export function buildPivotTable(
  entries: DiffEntry[],
  rowKey: 'object' | 'depth' = 'object',
  colKey: 'type' | 'depth' = 'type'
): PivotTable {
  const table: PivotTable = {};

  for (const entry of entries) {
    const row = rowKey === 'object' ? getObjectLabel(entry.field) : getDepthLabel(entry.field);
    const col = colKey === 'type' ? entry.change : getDepthLabel(entry.field);

    if (!table[row]) table[row] = {};
    if (!table[row][col]) table[row][col] = emptyCell();

    const cell = table[row][col];
    cell.total++;
    if (entry.change === 'added') cell.added++;
    else if (entry.change === 'removed') cell.removed++;
    else cell.changed++;
  }

  return table;
}

export function formatPivotTable(table: PivotTable): string {
  const rows = Object.keys(table).sort();
  if (rows.length === 0) return 'No data to pivot.';

  const cols = Array.from(
    new Set(rows.flatMap((r) => Object.keys(table[r])))
  ).sort();

  const colWidth = 10;
  const rowWidth = 20;

  const header =
    'Object/Event'.padEnd(rowWidth) +
    cols.map((c) => c.padStart(colWidth)).join('');

  const divider = '-'.repeat(rowWidth + cols.length * colWidth);

  const lines = rows.map((row) => {
    const cells = cols.map((col) => {
      const cell = table[row][col];
      return String(cell ? cell.total : 0).padStart(colWidth);
    });
    return row.padEnd(rowWidth) + cells.join('');
  });

  return [header, divider, ...lines].join('\n');
}

export function formatPivotJson(table: PivotTable): string {
  return JSON.stringify(table, null, 2);
}
