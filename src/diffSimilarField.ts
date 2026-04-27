import { DiffEntry } from './diffSchema';

export interface SimilarFieldPair {
  eventName: string;
  fieldA: string;
  fieldB: string;
  score: number;
  reason: string;
}

export interface SimilarFieldReport {
  pairs: SimilarFieldPair[];
  threshold: number;
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function fieldSimilarityScore(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

function reasonFor(a: string, b: string): string {
  const segA = a.split('.');
  const segB = b.split('.');
  if (segA.slice(0, -1).join('.') === segB.slice(0, -1).join('.')) {
    return 'same parent path';
  }
  if (segA[segA.length - 1] === segB[segB.length - 1]) {
    return 'same leaf name';
  }
  return 'string similarity';
}

export function buildSimilarFieldReport(
  entries: DiffEntry[],
  threshold = 0.75
): SimilarFieldReport {
  const byEvent: Record<string, string[]> = {};
  for (const entry of entries) {
    if (!byEvent[entry.eventName]) byEvent[entry.eventName] = [];
    byEvent[entry.eventName].push(entry.field);
  }

  const pairs: SimilarFieldPair[] = [];
  for (const [eventName, fields] of Object.entries(byEvent)) {
    for (let i = 0; i < fields.length; i++) {
      for (let j = i + 1; j < fields.length; j++) {
        const score = fieldSimilarityScore(fields[i], fields[j]);
        if (score >= threshold && score < 1) {
          pairs.push({
            eventName,
            fieldA: fields[i],
            fieldB: fields[j],
            score: Math.round(score * 1000) / 1000,
            reason: reasonFor(fields[i], fields[j]),
          });
        }
      }
    }
  }

  pairs.sort((a, b) => b.score - a.score);
  return { pairs, threshold };
}

export function formatSimilarFieldReport(report: SimilarFieldReport): string {
  if (report.pairs.length === 0) {
    return `No similar field pairs found above threshold ${report.threshold}.\n`;
  }
  const lines: string[] = [`Similar Fields (threshold: ${report.threshold})`, ''];
  for (const p of report.pairs) {
    lines.push(`  [${p.eventName}] ${p.fieldA} <-> ${p.fieldB}  score=${p.score}  (${p.reason})`);
  }
  return lines.join('\n') + '\n';
}

export function formatSimilarFieldJson(report: SimilarFieldReport): string {
  return JSON.stringify(report, null, 2);
}
