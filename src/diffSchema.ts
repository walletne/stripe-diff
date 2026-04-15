import { JSONSchema7 } from "json-schema";

export interface SchemaDiff {
  eventType: string;
  added: string[];
  removed: string[];
  changed: Array<{ path: string; from: unknown; to: unknown }>;
}

export interface DiffResult {
  fromVersion: string;
  toVersion: string;
  diffs: SchemaDiff[];
  unchanged: string[];
}

function flattenSchema(
  schema: JSONSchema7,
  prefix = ""
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value.properties) {
        Object.assign(result, flattenSchema(value, fullPath));
      } else {
        result[fullPath] = value;
      }
    }
  }

  return result;
}

export function diffEventSchemas(
  fromVersion: string,
  toVersion: string,
  fromSchemas: Record<string, JSONSchema7>,
  toSchemas: Record<string, JSONSchema7>
): DiffResult {
  const diffs: SchemaDiff[] = [];
  const unchanged: string[] = [];

  const allEventTypes = new Set([
    ...Object.keys(fromSchemas),
    ...Object.keys(toSchemas),
  ]);

  for (const eventType of allEventTypes) {
    const fromFlat = fromSchemas[eventType]
      ? flattenSchema(fromSchemas[eventType])
      : {};
    const toFlat = toSchemas[eventType]
      ? flattenSchema(toSchemas[eventType])
      : {};

    const added = Object.keys(toFlat).filter((k) => !(k in fromFlat));
    const removed = Object.keys(fromFlat).filter((k) => !(k in toFlat));
    const changed: SchemaDiff["changed"] = [];

    for (const key of Object.keys(fromFlat)) {
      if (key in toFlat && JSON.stringify(fromFlat[key]) !== JSON.stringify(toFlat[key])) {
        changed.push({ path: key, from: fromFlat[key], to: toFlat[key] });
      }
    }

    if (added.length === 0 && removed.length === 0 && changed.length === 0) {
      unchanged.push(eventType);
    } else {
      diffs.push({ eventType, added, removed, changed });
    }
  }

  return { fromVersion, toVersion, diffs, unchanged };
}
