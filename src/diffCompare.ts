import { DiffEntry } from "./diffSchema";

export interface CompareResult {
  onlyInA: DiffEntry[];
  onlyInB: DiffEntry[];
  inBoth: DiffEntry[];
  summary: {
    totalA: number;
    totalB: number;
    shared: number;
    uniqueToA: number;
    uniqueToB: number;
  };
}

/**
 * Compare two sets of diff entries by their field paths.
 * Identifies entries unique to each set and those present in both.
 */
export function compareDiffs(
  a: DiffEntry[],
  b: DiffEntry[]
): CompareResult {
  const keyOf = (e: DiffEntry) => `${e.event}::${e.field}::${e.type}`;

  const mapA = new Map(a.map((e) => [keyOf(e), e]));
  const mapB = new Map(b.map((e) => [keyOf(e), e]));

  const onlyInA: DiffEntry[] = [];
  const onlyInB: DiffEntry[] = [];
  const inBoth: DiffEntry[] = [];

  for (const [k, entry] of mapA) {
    if (mapB.has(k)) {
      inBoth.push(entry);
    } else {
      onlyInA.push(entry);
    }
  }

  for (const [k, entry] of mapB) {
    if (!mapA.has(k)) {
      onlyInB.push(entry);
    }
  }

  return {
    onlyInA,
    onlyInB,
    inBoth,
    summary: {
      totalA: a.length,
      totalB: b.length,
      shared: inBoth.length,
      uniqueToA: onlyInA.length,
      uniqueToB: onlyInB.length,
    },
  };
}

export function formatCompareReport(result: CompareResult): string {
  const lines: string[] = [];
  const { summary } = result;

  lines.push("## Diff Comparison Report");
  lines.push("");
  lines.push(`Total in A: ${summary.totalA}`);
  lines.push(`Total in B: ${summary.totalB}`);
  lines.push(`Shared:     ${summary.shared}`);
  lines.push(`Only in A:  ${summary.uniqueToA}`);
  lines.push(`Only in B:  ${summary.uniqueToB}`);

  if (result.onlyInA.length > 0) {
    lines.push("");
    lines.push("### Only in A");
    for (const e of result.onlyInA) {
      lines.push(`  [${e.type}] ${e.event} → ${e.field}`);
    }
  }

  if (result.onlyInB.length > 0) {
    lines.push("");
    lines.push("### Only in B");
    for (const e of result.onlyInB) {
      lines.push(`  [${e.type}] ${e.event} → ${e.field}`);
    }
  }

  return lines.join("\n");
}

export function formatCompareJson(result: CompareResult): string {
  return JSON.stringify(result, null, 2);
}
