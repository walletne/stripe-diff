import { DiffEntry } from "./diffSchema";

export interface OutlierResult {
  entry: DiffEntry;
  score: number;
  reason: string;
}

export interface OutlierReport {
  outliers: OutlierResult[];
  threshold: number;
  totalEntries: number;
}

/**
 * Compute a numeric "unusualness" score for a single diff entry.
 * Higher = more likely to be an outlier worth flagging.
 */
export function scoreEntry(entry: DiffEntry): number {
  let score = 0;
  const path = entry.path;

  // Deep nesting is unusual
  const depth = path.split(".").length;
  if (depth > 4) score += (depth - 4) * 2;

  // Type changes are high-signal
  if (entry.change === "changed" && entry.oldType !== entry.newType) score += 5;

  // Required -> optional or vice-versa
  if (
    entry.change === "changed" &&
    entry.oldRequired !== entry.newRequired
  ) score += 4;

  // Removal of a field is notable
  if (entry.change === "removed") score += 3;

  // Very short field names may be core fields
  const fieldName = path.split(".").pop() ?? "";
  if (fieldName.length <= 2) score += 2;

  return score;
}

export function buildOutlierReport(
  entries: DiffEntry[],
  threshold = 5
): OutlierReport {
  const outliers: OutlierResult[] = [];

  for (const entry of entries) {
    const score = scoreEntry(entry);
    if (score >= threshold) {
      const reasons: string[] = [];
      if (entry.change === "removed") reasons.push("field removed");
      if (entry.change === "changed" && entry.oldType !== entry.newType)
        reasons.push(`type changed from ${entry.oldType} to ${entry.newType}`);
      if (entry.change === "changed" && entry.oldRequired !== entry.newRequired)
        reasons.push("required flag changed");
      const depth = entry.path.split(".").length;
      if (depth > 4) reasons.push(`deep nesting (depth ${depth})`);
      outliers.push({ entry, score, reason: reasons.join("; ") });
    }
  }

  outliers.sort((a, b) => b.score - a.score);

  return { outliers, threshold, totalEntries: entries.length };
}

export function formatOutlierReport(report: OutlierReport): string {
  const lines: string[] = [
    `Outlier Detection (threshold: ${report.threshold}, total entries: ${report.totalEntries})`,
    "",
  ];

  if (report.outliers.length === 0) {
    lines.push("No outliers detected.");
    return lines.join("\n");
  }

  for (const { entry, score, reason } of report.outliers) {
    lines.push(`  [score ${score}] ${entry.event} / ${entry.path}`);
    lines.push(`    change: ${entry.change}  reason: ${reason}`);
  }

  return lines.join("\n");
}

export function formatOutlierJson(report: OutlierReport): string {
  return JSON.stringify(report, null, 2);
}
