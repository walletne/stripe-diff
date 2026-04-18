import { SnapshotEntry } from './diffSnapshot';
import { EventSchemaDiff } from './diffSchema';

export interface SnapshotComparison {
  onlyInA: string[];
  onlyInB: string[];
  changed: string[];
  unchanged: string[];
}

export function compareSnapshots(a: SnapshotEntry, b: SnapshotEntry): SnapshotComparison {
  const keysA = new Set(Object.keys(a.diff));
  const keysB = new Set(Object.keys(b.diff));

  const onlyInA = [...keysA].filter((k) => !keysB.has(k));
  const onlyInB = [...keysB].filter((k) => !keysA.has(k));
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const key of keysA) {
    if (!keysB.has(key)) continue;
    const ea = a.diff[key];
    const eb = b.diff[key];
    const same =
      JSON.stringify(ea.added) === JSON.stringify(eb.added) &&
      JSON.stringify(ea.removed) === JSON.stringify(eb.removed) &&
      JSON.stringify(ea.changed) === JSON.stringify(eb.changed);
    (same ? unchanged : changed).push(key);
  }

  return { onlyInA, onlyInB, changed, unchanged };
}

export function formatSnapshotComparison(cmp: SnapshotComparison, a: SnapshotEntry, b: SnapshotEntry): string {
  const lines: string[] = [`Comparing ${a.version} vs ${b.version}`, ''];
  if (cmp.changed.length) lines.push(`Changed events (${cmp.changed.length}):`, ...cmp.changed.map((e) => `  ~ ${e}`), '');
  if (cmp.onlyInA.length) lines.push(`Only in ${a.version} (${cmp.onlyInA.length}):`, ...cmp.onlyInA.map((e) => `  - ${e}`), '');
  if (cmp.onlyInB.length) lines.push(`Only in ${b.version} (${cmp.onlyInB.length}):`, ...cmp.onlyInB.map((e) => `  + ${e}`), '');
  lines.push(`Unchanged: ${cmp.unchanged.length}`);
  return lines.join('\n');
}
