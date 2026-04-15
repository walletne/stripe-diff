import { fetchSchema } from './fetchSchema';
import { extractEventSchemas } from './parseSchema';
import { diffEventSchemas, EventSchemaDiff } from './diffSchema';

export interface DiffOptions {
  event?: string;
}

export interface ListOptions {
  version: string;
}

export async function runDiff(
  versionA: string,
  versionB: string,
  options: DiffOptions
): Promise<EventSchemaDiff[]> {
  const rawA = await fetchSchema(versionA);
  const rawB = await fetchSchema(versionB);

  const schemasA = extractEventSchemas(rawA);
  const schemasB = extractEventSchemas(rawB);

  const diffs = diffEventSchemas(schemasA, schemasB);

  if (options.event) {
    return diffs.filter(d => d.event === options.event);
  }

  return diffs;
}

export async function runList(version: string): Promise<string[]> {
  const raw = await fetchSchema(version);
  const schemas = extractEventSchemas(raw);
  return Object.keys(schemas).sort();
}
