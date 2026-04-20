import { mergeDiffs, formatMergeConflicts, MergeConflict } from "./diffMerge";
import { EventDiff } from "./diffSchema";

function makeChange(field: string, type: "added" | "removed" | "changed", before?: string, after?: string) {
  return { field, type, before, after };
}

describe("mergeDiffs", () => {
  it("merges two non-overlapping diffs", () => {
    const base: EventDiff = { "charge.created": [makeChange("amount", "added", undefined, "number")] };
    const other: EventDiff = { "customer.updated": [makeChange("email", "changed", "string", "string | null")] };
    const { merged, conflicts } = mergeDiffs(base, other);
    expect(Object.keys(merged)).toHaveLength(2);
    expect(conflicts).toHaveLength(0);
  });

  it("merges same event with non-overlapping fields", () => {
    const base: EventDiff = { "charge.created": [makeChange("amount", "added", undefined, "number")] };
    const other: EventDiff = { "charge.created": [makeChange("currency", "added", undefined, "string")] };
    const { merged, conflicts } = mergeDiffs(base, other);
    expect(merged["charge.created"]).toHaveLength(2);
    expect(conflicts).toHaveLength(0);
  });

  it("detects conflict when same field changed differently", () => {
    const base: EventDiff = { "charge.created": [makeChange("amount", "changed", "number", "string")] };
    const other: EventDiff = { "charge.created": [makeChange("amount", "changed", "number", "integer")] };
    const { merged, conflicts } = mergeDiffs(base, other);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].field).toBe("amount");
    expect(merged["charge.created"][0]).toEqual(base["charge.created"][0]);
  });

  it("no conflict when same field changed identically", () => {
    const change = makeChange("amount", "changed", "number", "string");
    const base: EventDiff = { "charge.created": [change] };
    const other: EventDiff = { "charge.created": [change] };
    const { conflicts } = mergeDiffs(base, other);
    expect(conflicts).toHaveLength(0);
  });

  it("handles empty base", () => {
    const other: EventDiff = { "charge.created": [makeChange("amount", "added", undefined, "number")] };
    const { merged } = mergeDiffs({}, other);
    expect(merged).toEqual(other);
  });

  it("handles empty other", () => {
    const base: EventDiff = { "charge.created": [makeChange("amount", "added", undefined, "number")] };
    const { merged } = mergeDiffs(base, {});
    expect(merged).toEqual(base);
  });
});

describe("formatMergeConflicts", () => {
  it("returns no conflicts message when empty", () => {
    expect(formatMergeConflicts([])).toBe("No conflicts.");
  });

  it("formats conflicts correctly", () => {
    const conflicts: MergeConflict[] = [
      {
        event: "charge.created",
        field: "amount",
        changes: [
          { field: "amount", type: "changed", before: "number", after: "string" },
          { field: "amount", type: "changed", before: "number", after: "integer" },
        ],
      },
    ];
    const output = formatMergeConflicts(conflicts);
    expect(output).toContain("Merge conflicts (1)");
    expect(output).toContain("charge.created");
    expect(output).toContain('"amount"');
    expect(output).toContain("number -> string");
    expect(output).toContain("number -> integer");
  });
});
