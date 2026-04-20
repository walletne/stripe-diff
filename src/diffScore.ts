import { DiffResult } from './diffSchema';

export interface DiffScore {
  event: string;
  added: number;
  removed: number;
  changed: number;
  total: number;
  score: number; // 0-100, higher = more changed
}

export interface DiffScoreReport {
  scores: DiffScore[];
  mostChanged: string | null;
  leastChanged: string | null;
  averageScore: number;
}

export function scoreDiff(event: string, diff: DiffResult): DiffScore {
  const added = diff.added.length;
  const removed = diff.removed.length;
  const changed = diff.changed.length;
  const total = added + removed + changed;
  const score = total === 0 ? 0 : Math.min(100, Math.round((added * 1 + removed * 2 + changed * 1.5) * 10));
  return { event, added, removed, changed, total, score };
}

export function buildDiffScoreReport(diffs: Record<string, DiffResult>): DiffScoreReport {
  const scores = Object.entries(diffs).map(([event, diff]) => scoreDiff(event, diff));

  if (scores.length === 0) {
    return { scores: [], mostChanged: null, leastChanged: null, averageScore: 0 };
  }

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const mostChanged = sorted[0].event;
  const leastChanged = sorted[sorted.length - 1].event;
  const averageScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);

  return { scores, mostChanged, leastChanged, averageScore };
}

export function formatDiffScoreReport(report: DiffScoreReport): string {
  if (report.scores.length === 0) return 'No events scored.';

  const lines: string[] = ['Diff Score Report', '================='];
  const sorted = [...report.scores].sort((a, b) => b.score - a.score);

  for (const s of sorted) {
    const bar = '█'.repeat(Math.round(s.score / 10)).padEnd(10, '░');
    lines.push(`  ${s.event.padEnd(40)} [${bar}] ${String(s.score).padStart(3)}/100  (+${s.added} -${s.removed} ~${s.changed})`);
  }

  lines.push('');
  lines.push(`  Most changed:  ${report.mostChanged}`);
  lines.push(`  Least changed: ${report.leastChanged}`);
  lines.push(`  Average score: ${report.averageScore}/100`);

  return lines.join('\n');
}

export function formatDiffScoreJson(report: DiffScoreReport): string {
  return JSON.stringify(report, null, 2);
}
