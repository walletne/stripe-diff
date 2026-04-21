import { compareDiffs, formatCompareReport, formatCompareJson } from "./diffCompare";
import { DiffEntry } from "./diffSchema";

function makeEntry(
  event: string,
  field: string,
  type: "added" | "removed" | "changed" = "added"
): DiffEntry {
  return { event, field, type, before: undefined, after: "string" };
}

describe("compareDiffs", () => {
  it("identifies entries only in A", () => {
    const a = [makeEntry("charge.created", "amount")];
    const b: DiffEntry[] = [];
    const result = compareDiffs(a, b);
    expect(result.onlyInA).toHaveLength(1);
    expect(result.onlyInB).toHaveLength(0);
    expect(result.inBoth).toHaveLength(0);
  });

  it("identifies entries only in B", () => {
    const a: DiffEntry[] = [];
    const b = [makeEntry("charge.created", "amount")];
    const result = compareDiffs(a, b);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(1);
  });

  it("identifies shared entries", () => {
    const entry = makeEntry("charge.created", "amount");
    const result = compareDiffs([entry], [entry]);
    expect(result.inBoth).toHaveLength(1);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
  });

  it("handles mixed sets correctly", () => {
    const shared = makeEntry("payment_intent.created", "currency");
    const onlyA = makeEntry("charge.updated", "metadata", "removed");
    const onlyB = makeEntry("invoice.paid", "total", "changed");
    const result = compareDiffs([shared, onlyA], [shared, onlyB]);
    expect(result.inBoth).toHaveLength(1);
    expect(result.onlyInA).toHaveLength(1);
    expect(result.onlyInB).toHaveLength(1);
  });

  it("computes summary correctly", () => {
    const a = [makeEntry("e1", "f1"), makeEntry("e2", "f2")];
    const b = [makeEntry("e1", "f1"), makeEntry("e3", "f3")];
    const { summary } = compareDiffs(a, b);
    expect(summary.totalA).toBe(2);
    expect(summary.totalB).toBe(2);
    expect(summary.shared).toBe(1);
    expect(summary.uniqueToA).toBe(1);
    expect(summary.uniqueToB).toBe(1);
  });
});

describe("formatCompareReport", () => {
  it("includes summary counts", () => {
    const a = [makeEntry("charge.created", "amount")];
    const b = [makeEntry("invoice.paid", "total")];
    const result = compareDiffs(a, b);
    const report = formatCompareReport(result);
    expect(report).toContain("Total in A: 1");
    expect(report).toContain("Total in B: 1");
    expect(report).toContain("Shared:     0");
  });

  it("lists entries only in A and B", () => {
    const a = [makeEntry("charge.created", "amount")];
    const b = [makeEntry("invoice.paid", "total")];
    const result = compareDiffs(a, b);
    const report = formatCompareReport(result);
    expect(report).toContain("Only in A");
    expect(report).toContain("Only in B");
    expect(report).toContain("charge.created");
    expect(report).toContain("invoice.paid");
  });
});

describe("formatCompareJson", () => {
  it("returns valid JSON", () => {
    const result = compareDiffs([], []);
    const json = formatCompareJson(result);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("includes summary in JSON output", () => {
    const result = compareDiffs([], []);
    const parsed = JSON.parse(formatCompareJson(result));
    expect(parsed).toHaveProperty("summary");
    expect(parsed.summary.totalA).toBe(0);
  });
});
