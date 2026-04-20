/**
 * Normalize a diff by sorting entries, deduplicating, and optionally
 * stripping metadata fields before comparison or export.
 */

import type { DiffEntry } from './diffSchema';

export interface NormalizeOptions {
  sortBy?: 'event' | 'field' | 'type';
  deduplicate?: boolean;
  stripMetadata?: boolean;
}

const METADATA_FIELDS = ['created', 'id', 'object', 'livemode'];

export function normalizeDiff(
  entries: DiffEntry[],
  options: NormalizeOptions = {}
): DiffEntry[] {
  const { sortBy = 'event', deduplicate = true, stripMetadata = false } = options;

  let result = [...entries];

  if (stripMetadata) {
    result = result.filter(
      (e) => !METADATA_FIELDS.includes(e.field.split('.').pop() ?? '')
    );
  }

  if (deduplicate) {
    const seen = new Set<string>();
    result = result.filter((e) => {
      const key = `${e.event}::${e.field}::${e.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  result.sort((a, b) => {
    if (sortBy === 'field') return a.field.localeCompare(b.field);
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    // default: 'event'
    const eventCmp = a.event.localeCompare(b.event);
    return eventCmp !== 0 ? eventCmp : a.field.localeCompare(b.field);
  });

  return result;
}

export function formatNormalized(entries: DiffEntry[]): string {
  if (entries.length === 0) return 'No diff entries after normalization.\n';
  const lines = entries.map(
    (e) => `[${e.type.toUpperCase()}] ${e.event} — ${e.field}`
  );
  return lines.join('\n') + '\n';
}
