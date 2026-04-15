import { diffEventSchemas, DiffResult } from "./diffSchema";
import { JSONSchema7 } from "json-schema";

function makeSchema(properties: Record<string, JSONSchema7>): JSONSchema7 {
  return { type: "object", properties };
}

describe("diffEventSchemas", () => {
  const fromVersion = "2022-11-15";
  const toVersion = "2023-10-16";

  it("returns unchanged when schemas are identical", () => {
    const schema = makeSchema({ id: { type: "string" } });
    const result = diffEventSchemas(
      fromVersion,
      toVersion,
      { "charge.created": schema },
      { "charge.created": schema }
    );
    expect(result.unchanged).toContain("charge.created");
    expect(result.diffs).toHaveLength(0);
  });

  it("detects added fields", () => {
    const from = makeSchema({ id: { type: "string" } });
    const to = makeSchema({ id: { type: "string" }, amount: { type: "number" } });
    const result = diffEventSchemas(fromVersion, toVersion, { "charge.created": from }, { "charge.created": to });
    const diff = result.diffs.find((d) => d.eventType === "charge.created");
    expect(diff).toBeDefined();
    expect(diff!.added).toContain("amount");
    expect(diff!.removed).toHaveLength(0);
  });

  it("detects removed fields", () => {
    const from = makeSchema({ id: { type: "string" }, legacy: { type: "boolean" } });
    const to = makeSchema({ id: { type: "string" } });
    const result = diffEventSchemas(fromVersion, toVersion, { "charge.created": from }, { "charge.created": to });
    const diff = result.diffs.find((d) => d.eventType === "charge.created");
    expect(diff!.removed).toContain("legacy");
  });

  it("detects changed field types", () => {
    const from = makeSchema({ amount: { type: "string" } });
    const to = makeSchema({ amount: { type: "number" } });
    const result = diffEventSchemas(fromVersion, toVersion, { "payment_intent.created": from }, { "payment_intent.created": to });
    const diff = result.diffs.find((d) => d.eventType === "payment_intent.created");
    expect(diff!.changed).toHaveLength(1);
    expect(diff!.changed[0].path).toBe("amount");
  });

  it("detects new event types", () => {
    const schema = makeSchema({ id: { type: "string" } });
    const result = diffEventSchemas(fromVersion, toVersion, {}, { "payment_link.created": schema });
    const diff = result.diffs.find((d) => d.eventType === "payment_link.created");
    expect(diff).toBeDefined();
    expect(diff!.added.length).toBeGreaterThan(0);
  });

  it("includes version metadata in result", () => {
    const result = diffEventSchemas(fromVersion, toVersion, {}, {});
    expect(result.fromVersion).toBe(fromVersion);
    expect(result.toVersion).toBe(toVersion);
  });
});
