export interface RenameEntry {
  event: string;
  oldField: string;
  newField: string;
  similarity: number;
}

export interface RenameResult {
  renames: RenameEntry[];
  unmatched: string[];
}

import type { DiffEntry } from './diffSchema';

function tokenize(field: string): string[] {
  return field.split('.').flatMap(p => p.split('_'));
}

function fieldSimilarity(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  const intersection = [...ta].filter(t => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : intersection / union;
}

export function detectRenames(
  diffs: Record<string, DiffEntry[]>,
  threshold = 0.5
): Record<string, RenameResult> {
  const results: Record<string, RenameResult> = {};

  for (const [event, entries] of Object.entries(diffs)) {
    const removed = entries.filter(e => e.type === 'removed').map(e => e.field);
    const added = entries.filter(e => e.type === 'added').map(e => e.field);

    const renames: RenameEntry[] = [];
    const matchedAdded = new Set<string>();
    const matchedRemoved = new Set<string>();

    for (const oldField of removed) {
      let best = { field: '', score: -1 };
      for (const newField of added) {
        if (matchedAdded.has(newField)) continue;
        const score = fieldSimilarity(oldField, newField);
        if (score > best.score) best = { field: newField, score };
      }
      if (best.score >= threshold) {
        renames.push({ event, oldField, newField: best.field, similarity: best.score });
        matchedAdded.add(best.field);
        matchedRemoved.add(oldField);
      }
    }

    const unmatched = removed.filter(f => !matchedRemoved.has(f));
    results[event] = { renames, unmatched };
  }

  return results;
}

export function formatRenameReport(results: Record<string, RenameResult>): string {
  const lines: string[] = [];
  for (const [event, { renames, unmatched }] of Object.entries(results)) {
    if (renames.length === 0) continue;
    lines.push(`## ${event}`);
    for (const r of renames) {
      lines.push(`  ~ ${r.oldField} → ${r.newField} (similarity: ${(r.similarity * 100).toFixed(0)}%)`);
    }
    if (unmatched.length > 0) {
      lines.push(`  unmatched removals: ${unmatched.join(', ')}`);
    }
  }
  return lines.join('\n');
}
