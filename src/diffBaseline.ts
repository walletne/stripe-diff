import { readCache, writeCache } from './cache';
import { EventSchemaDiff } from './diffSchema';

export interface BaselineEntry {
  version: string;
  savedAt: string;
  diffs: Record<string, EventSchemaDiff>;
}

export function saveBaseline(
  version: string,
  diffs: Record<string, EventSchemaDiff>
): BaselineEntry {
  const entry: BaselineEntry = {
    version,
    savedAt: new Date().toISOString(),
    diffs,
  };
  writeCache<BaselineEntry>(`baseline-${version}`, entry);
  return entry;
}

export function loadBaseline(version: string): BaselineEntry | null {
  return readCache<BaselineEntry>(`baseline-${version}`);
}

export function compareToBaseline(
  baseline: BaselineEntry,
  current: Record<string, EventSchemaDiff>
): BaselineComparison {
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  const baseKeys = new Set(Object.keys(baseline.diffs));
  const currKeys = new Set(Object.keys(current));

  for (const k of currKeys) {
    if (!baseKeys.has(k)) added.push(k);
    else {
      const b = baseline.diffs[k];
      const c = current[k];
      if (JSON.stringify(b) !== JSON.stringify(c)) changed.push(k);
    }
  }
  for (const k of baseKeys) {
    if (!currKeys.has(k)) removed.push(k);
  }

  return { baselineVersion: baseline.version, added, removed, changed };
}

export interface BaselineComparison {
  baselineVersion: string;
  added: string[];
  removed: string[];
  changed: string[];
}

export function formatBaselineComparison(cmp: BaselineComparison): string {
  const lines: string[] = [
    `Baseline: ${cmp.baselineVersion}`,
    `  Added events:   ${cmp.added.length}`,
    `  Removed events: ${cmp.removed.length}`,
    `  Changed events: ${cmp.changed.length}`,
  ];
  if (cmp.added.length) lines.push('\nAdded:\n' + cmp.added.map(e => `  + ${e}`).join('\n'));
  if (cmp.removed.length) lines.push('\nRemoved:\n' + cmp.removed.map(e => `  - ${e}`).join('\n'));
  if (cmp.changed.length) lines.push('\nChanged:\n' + cmp.changed.map(e => `  ~ ${e}`).join('\n'));
  return lines.join('\n');
}
