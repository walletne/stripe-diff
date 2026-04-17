/**
 * Computes a similarity score between two API versions based on their diffs.
 * Score ranges from 0 (completely different) to 1 (identical).
 */

import { EventDiff } from './diffSchema';

export interface SimilarityResult {
  score: number;
  totalFields: number;
  changedFields: number;
  addedFields: number;
  removedFields: number;
}

export function computeSimilarity(diffs: EventDiff[]): SimilarityResult {
  let totalFields = 0;
  let changedFields = 0;
  let addedFields = 0;
  let removedFields = 0;

  for (const diff of diffs) {
    for (const change of diff.changes) {
      if (change.type === 'added') {
        addedFields++;
      } else if (change.type === 'removed') {
        removedFields++;
      } else if (change.type === 'changed') {
        changedFields++;
        totalFields++;
      }
      totalFields++;
    }
  }

  if (totalFields === 0) {
    return { score: 1, totalFields: 0, changedFields: 0, addedFields: 0, removedFields: 0 };
  }

  const unchanged = totalFields - changedFields - addedFields - removedFields;
  const score = Math.max(0, Math.min(1, unchanged / totalFields));

  return { score: parseFloat(score.toFixed(4)), totalFields, changedFields, addedFields, removedFields };
}

export function formatSimilarity(result: SimilarityResult): string {
  const pct = (result.score * 100).toFixed(1);
  return [
    `Similarity: ${pct}%`,
    `  Total fields evaluated : ${result.totalFields}`,
    `  Changed                : ${result.changedFields}`,
    `  Added                  : ${result.addedFields}`,
    `  Removed                : ${result.removedFields}`,
  ].join('\n');
}
