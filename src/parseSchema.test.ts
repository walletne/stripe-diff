import { describe, it, expect } from "vitest";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { parseSchemaFromResponse, extractEventSchemas, StripeOpenApiSpec } from "./parseSchema";

function createMockResponse(body: string): IncomingMessage {
  const socket = new Socket();
  const res = new IncomingMessage(socket);
  res.push(body);
  res.push(null);
  return res;
}

const sampleSpec: StripeOpenApiSpec = {
  components: {
    schemas: {
      event: {
        description: "A Stripe event object",
        properties: {
          id: { type: "string", description: "Unique identifier" },
          type: { type: "string", enum: ["payment_intent.created", "charge.failed"] },
          livemode: { type: "boolean", nullable: false },
        },
      },
      notification_event_data: {
        description: "Event data payload",
        properties: {
          object: { type: "object", description: "The event object" },
        },
      },
      unrelated_schema: {
        properties: {
          foo: { type: "string" },
        },
      },
    },
  },
};

describe("parseSchemaFromResponse", () => {
  it("parses valid JSON from a response stream", async () => {
    const res = createMockResponse(JSON.stringify(sampleSpec));
    const result = await parseSchemaFromResponse(res);
    expect(result).toEqual(sampleSpec);
  });

  it("throws on invalid JSON", async () => {
    const res = createMockResponse("not valid json{");
    await expect(parseSchemaFromResponse(res)).rejects.toThrow(
      "Failed to parse schema JSON"
    );
  });

  it("handles empty object", async () => {
    const res = createMockResponse("{}");
    const result = await parseSchemaFromResponse(res);
    expect(result).toEqual({});
  });
});

describe("extractEventSchemas", () => {
  it("extracts event and notification schemas", () => {
    const schemas = extractEventSchemas(sampleSpec);
    expect(schemas.has("event")).toBe(true);
    expect(schemas.has("notification_event_data")).toBe(true);
    expect(schemas.has("unrelated_schema")).toBe(false);
  });

  it("correctly maps properties", () => {
    const schemas = extractEventSchemas(sampleSpec);
    const event = schemas.get("event")!;
    expect(event.properties["id"].type).toBe("string");
    expect(event.properties["type"].enum).toContain("charge.failed");
    expect(event.description).toBe("A Stripe event object");
  });

  it("returns empty map for spec with no schemas", () => {
    const schemas = extractEventSchemas({});
    expect(schemas.size).toBe(0);
  });
});
