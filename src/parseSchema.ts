import { IncomingMessage } from "http";
import { collectBody } from "./fetchSchema";

export interface EventSchema {
  name: string;
  description?: string;
  properties: Record<string, PropertySchema>;
}

export interface PropertySchema {
  type: string;
  description?: string;
  nullable?: boolean;
  enum?: string[];
}

export interface StripeOpenApiSpec {
  components?: {
    schemas?: Record<string, unknown>;
  };
  paths?: Record<string, unknown>;
}

export async function parseSchemaFromResponse(
  response: IncomingMessage
): Promise<StripeOpenApiSpec> {
  const raw = await collectBody(response);
  try {
    return JSON.parse(raw) as StripeOpenApiSpec;
  } catch (err) {
    throw new Error(`Failed to parse schema JSON: ${(err as Error).message}`);
  }
}

export function extractEventSchemas(
  spec: StripeOpenApiSpec
): Map<string, EventSchema> {
  const schemas = spec?.components?.schemas ?? {};
  const eventSchemas = new Map<string, EventSchema>();

  for (const [key, value] of Object.entries(schemas)) {
    if (!key.startsWith("notification_event_data") && key !== "event") {
      continue;
    }

    const schema = value as Record<string, unknown>;
    const properties: Record<string, PropertySchema> = {};

    const rawProps = (schema["properties"] ?? {}) as Record<
      string,
      Record<string, unknown>
    >;

    for (const [propName, propDef] of Object.entries(rawProps)) {
      properties[propName] = parsePropertySchema(propDef);
    }

    eventSchemas.set(key, {
      name: key,
      description: schema["description"] as string | undefined,
      properties,
    });
  }

  return eventSchemas;
}

/**
 * Parses a raw property definition object from the OpenAPI spec into a
 * strongly-typed PropertySchema. Handles missing or malformed fields
 * by falling back to safe defaults (e.g. type defaults to "unknown").
 */
function parsePropertySchema(
  propDef: Record<string, unknown>
): PropertySchema {
  return {
    type: typeof propDef["type"] === "string" ? propDef["type"] : "unknown",
    description:
      typeof propDef["description"] === "string"
        ? propDef["description"]
        : undefined,
    nullable:
      typeof propDef["nullable"] === "boolean"
        ? propDef["nullable"]
        : undefined,
    enum: Array.isArray(propDef["enum"])
      ? (propDef["enum"] as string[])
      : undefined,
  };
}
