import { validateDiff, formatValidationReport } from "./diffValidate";
import { EventDiff } from "./diffSchema";

function makeDiff(changes: EventDiff["changes"]): Record<string, EventDiff> {
  return {
    "charge.updated": {
      event: "charge.updated",
      added: [],
      removed: [],
      changed: [],
      changes,
    },
  };
}

describe("validateDiff", () => {
  it("returns no results when diff is clean", () => {
    const diffs = makeDiff({
      amount: {
        before: { type: "integer" },
        after: { type: "integer" },
      },
    });
    const report = validateDiff(diffs);
    expect(report.failed).toBe(0);
    expect(report.results).toHaveLength(0);
  });

  it("detects removed fields via no-field-removal rule", () => {
    const diffs = makeDiff({
      legacy_id: {
        before: { type: "string" },
        after: null,
      },
    });
    const report = validateDiff(diffs, ["no-field-removal"]);
    expect(report.failed).toBe(1);
    expect(report.results[0].rule).toBe("no-field-removal");
    expect(report.results[0].messages[0]).toContain('"legacy_id" was removed');
  });

  it("detects type widening via no-type-widening rule", () => {
    const diffs = makeDiff({
      metadata: {
        before: { type: "string" },
        after: { type: "object" },
      },
    });
    const report = validateDiff(diffs, ["no-type-widening"]);
    expect(report.failed).toBe(1);
    expect(report.results[0].messages[0]).toContain(
      'widened from string to object'
    );
  });

  it("detects required field added via no-required-added rule", () => {
    const diffs = makeDiff({
      new_field: {
        before: null,
        after: { type: "string", required: true },
      },
    });
    const report = validateDiff(diffs, ["no-required-added"]);
    expect(report.failed).toBe(1);
    expect(report.results[0].messages[0]).toContain('"new_field" was added');
  });

  it("applies all rules when no filter provided", () => {
    const diffs = makeDiff({
      gone: { before: { type: "string" }, after: null },
    });
    const report = validateDiff(diffs);
    expect(report.results.some((r) => r.rule === "no-field-removal")).toBe(true);
  });
});

describe("formatValidationReport", () => {
  it("returns success message when no failures", () => {
    const report = { results: [], passed: 9, failed: 0 };
    expect(formatValidationReport(report)).toContain("All validations passed");
  });

  it("lists failures with rule and message", () => {
    const report = {
      results: [
        {
          event: "charge.updated",
          rule: "no-field-removal",
          messages: ['Field "x" was removed'],
        },
      ],
      passed: 2,
      failed: 1,
    };
    const output = formatValidationReport(report);
    expect(output).toContain("no-field-removal");
    expect(output).toContain('"x" was removed');
    expect(output).toContain("1 failed");
  });
});
