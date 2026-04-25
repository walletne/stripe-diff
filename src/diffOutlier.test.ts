import {
  scoreEntry,
  buildOutlierReport,
  formatOutlierReport,
  formatOutlierJson,
} from "./diffOutlier";
import { DiffEntry } from "./diffSchema";

function makeEntry(overrides: Partial<DiffEntry> = {}): DiffEntry {
  return {
    event: "charge.updated",
    path: "data.object.amount",
    change: "changed",
    oldType: "integer",
    newType: "integer",
    oldRequired: true,
    newRequired: true,
    ...overrides,
  };
}

describe("scoreEntry", () => {
  it("returns 0 for a shallow unchanged-type entry", () => {
    expect(scoreEntry(makeEntry())).toBe(0);
  });

  it("adds score for type change", () => {
    const entry = makeEntry({ oldType: "integer", newType: "string" });
    expect(scoreEntry(entry)).toBeGreaterThanOrEqual(5);
  });

  it("adds score for removed fields", () => {
    const entry = makeEntry({ change: "removed" });
    expect(scoreEntry(entry)).toBeGreaterThanOrEqual(3);
  });

  it("adds score for deep nesting", () => {
    const entry = makeEntry({ path: "a.b.c.d.e.f" }); // depth 6
    expect(scoreEntry(entry)).toBeGreaterThanOrEqual(4);
  });

  it("adds score for required flag change", () => {
    const entry = makeEntry({ oldRequired: true, newRequired: false });
    expect(scoreEntry(entry)).toBeGreaterThanOrEqual(4);
  });
});

describe("buildOutlierReport", () => {
  it("returns empty outliers when nothing exceeds threshold", () => {
    const entries = [makeEntry()];
    const report = buildOutlierReport(entries, 10);
    expect(report.outliers).toHaveLength(0);
    expect(report.totalEntries).toBe(1);
  });

  it("identifies type-change entries as outliers", () => {
    const entries = [
      makeEntry({ oldType: "integer", newType: "string" }),
      makeEntry(),
    ];
    const report = buildOutlierReport(entries, 5);
    expect(report.outliers).toHaveLength(1);
    expect(report.outliers[0].entry.oldType).toBe("integer");
  });

  it("sorts outliers by descending score", () => {
    const entries = [
      makeEntry({ change: "removed" }),
      makeEntry({ oldType: "integer", newType: "string", change: "changed" }),
    ];
    const report = buildOutlierReport(entries, 3);
    expect(report.outliers[0].score).toBeGreaterThanOrEqual(
      report.outliers[report.outliers.length - 1].score
    );
  });
});

describe("formatOutlierReport", () => {
  it("mentions threshold and total entries", () => {
    const report = buildOutlierReport([makeEntry()], 5);
    const text = formatOutlierReport(report);
    expect(text).toContain("threshold: 5");
    expect(text).toContain("total entries: 1");
  });

  it("prints no-outliers message when list is empty", () => {
    const report = buildOutlierReport([makeEntry()], 100);
    expect(formatOutlierReport(report)).toContain("No outliers detected.");
  });
});

describe("formatOutlierJson", () => {
  it("returns valid JSON", () => {
    const report = buildOutlierReport([makeEntry()], 5);
    expect(() => JSON.parse(formatOutlierJson(report))).not.toThrow();
  });
});
